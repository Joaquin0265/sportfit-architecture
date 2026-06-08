const pool = require('../db');

const pedidosController = {
    // 👑 ADMIN: Crear pedido manual desde el panel
    crearPedidoManual: async (req, res) => {
        const { id_usuario, direccion_envio, estado, productos, fecha } = req.body;
        const conexion = await pool.getConnection();

        try {
            await conexion.beginTransaction();

            // 1. Calcular total del array enviado
            let total = 0;
            for (let p of productos) {
                total += p.precio * p.cantidad;
            }

            // 2. Crear el Pedido (Usando la fecha enviada o NOW())
            const [pedido] = await conexion.query(
                'INSERT INTO Pedidos (id_usuario, direccion_envio, total, estado, fecha_pedido) VALUES (?, ?, ?, ?, ?)',
                [id_usuario, direccion_envio, total, estado, fecha || new Date()]
            );
            const id_pedido = pedido.insertId;

            // 3. Insertar detalles y descontar stock
            for (let p of productos) {
                await conexion.query(
                    'INSERT INTO Detalles_Pedido (id_pedido, id_producto, cantidad, precio_unitario) VALUES (?, ?, ?, ?)',
                    [id_pedido, p.id_producto, p.cantidad, p.precio]
                );
                await conexion.query('UPDATE Productos SET stock = stock - ? WHERE id_producto = ?', [p.cantidad, p.id_producto]);
            }

            await conexion.commit();
            res.json({ mensaje: "Pedido manual creado con éxito", id_pedido });
        } catch (error) {
            await conexion.rollback();
            res.status(400).json({ error: error.message });
        } finally {
            conexion.release();
        }
    },

    // 🛒 CLIENTE: Procesa la compra desde el carrito (CORREGIDO)
    crearPedido: async (req, res) => {
        const id_usuario = req.usuario.id_usuario;
        
        // 1. Capturamos los productos y la dirección que envía el frontend (localStorage)
        const { productos, direccion_envio } = req.body; 

        const dirFinal = direccion_envio || "Recojo en Tienda";
        
        const conexion = await pool.getConnection();

        try {
            await conexion.beginTransaction();

            if (!productos || productos.length === 0) {
                throw new Error("El carrito está vacío");
            }

            let total = 0;

            // 2. Validar stock real de cada producto enviado antes de procesar
            for (let item of productos) {
                // item.id viene del objeto del carrito en el frontend
                const [rows] = await conexion.query(
                    'SELECT precio, stock, nombre FROM Productos WHERE id_producto = ?', 
                    [item.id]
                );
                
                if (rows.length === 0) throw new Error(`El producto ${item.nombre} ya no existe.`);
                
                const productoDB = rows[0];
                
                // VALIDACIÓN CRÍTICA DE STOCK
                if (productoDB.stock < item.cantidad) {
                    throw new Error(`Stock insuficiente para: ${productoDB.nombre}. Solo quedan ${productoDB.stock} unidades.`);
                }
                
                total += productoDB.precio * item.cantidad;
            }

            // 3. Crear el Pedido principal
            const [pedido] = await conexion.query(
                'INSERT INTO Pedidos (id_usuario, direccion_envio, total, estado) VALUES (?, ?, ?, "Pagado")',
                [id_usuario, dirFinal, total]
            );
            const id_pedido = pedido.insertId;

            // 4. Mover items a Detalles_Pedido y descontar stock real
            for (let item of productos) {
                const [resProducto] = await conexion.query('SELECT precio FROM Productos WHERE id_producto = ?', [item.id]);
                const precioReal = resProducto[0].precio;

                await conexion.query(
                    'INSERT INTO Detalles_Pedido (id_pedido, id_producto, cantidad, precio_unitario) VALUES (?, ?, ?, ?)',
                    [id_pedido, item.id, item.cantidad, precioReal]
                );
                
                // Restar del inventario
                await conexion.query(
                    'UPDATE Productos SET stock = stock - ? WHERE id_producto = ?', 
                    [item.cantidad, item.id]
                );
            }

            // 5. (Opcional) Si usaras Carrito_Items en la BD, aquí lo vaciarías. 
            // Como usas localStorage, el frontend se encarga de vaciarlo.

            await conexion.commit();
            res.json({ mensaje: "¡Compra realizada con éxito!", id_pedido });

        } catch (error) {
            await conexion.rollback();
            // Enviamos el mensaje de error exacto (ej: Stock insuficiente)
            res.status(400).json({ error: error.message });
        } finally {
            conexion.release();
        }
    },

    // 👑 ADMIN: Listar todos los pedidos para el Dashboard
    listarPedidosAdmin: async (req, res) => {
        try {
            const query = `
                SELECT 
                    p.id_pedido, 
                    u.nombre AS cliente, 
                    p.fecha_pedido, 
                    p.total, 
                    p.estado,
                    p.direccion_envio
                FROM Pedidos p
                JOIN Usuarios u ON p.id_usuario = u.id_usuario
                ORDER BY p.fecha_pedido DESC`;
            
            const [pedidos] = await pool.query(query);
            res.json(pedidos);
        } catch (error) {
            console.error("Error al listar pedidos:", error);
            res.status(500).json({ error: "No se pudieron recuperar los pedidos." });
        }
    },

    // Añade esto dentro del objeto pedidosController en pedidos.controller.js
    obtenerMisPedidos: async (req, res) => {
        try {
            // Sacamos el ID del usuario directamente del token (gracias al middleware)
            const id_usuario = req.usuario.id_usuario;

            // 1. Buscamos todos los pedidos de este usuario
            const [pedidos] = await pool.query(
                'SELECT id_pedido, fecha_pedido, total, estado, direccion_envio FROM Pedidos WHERE id_usuario = ? ORDER BY fecha_pedido DESC',
                [id_usuario]
            );

            // 2. Si no tiene pedidos, devolvemos un array vacío rápido
            if (pedidos.length === 0) {
                return res.json([]);
            }

            // 3. Para cada pedido, buscamos sus detalles (los productos que compró)
            for (let i = 0; i < pedidos.length; i++) {
                const id_pedido = pedidos[i].id_pedido;
                const [detalles] = await pool.query(`
                    SELECT dp.cantidad, p.nombre 
                    FROM Detalles_Pedido dp
                    JOIN Productos p ON dp.id_producto = p.id_producto
                    WHERE dp.id_pedido = ?
                `, [id_pedido]);

                // Formateamos los detalles para que el frontend los lea fácil (Ej: "Creatina x1")
                pedidos[i].items = detalles.map(d => `${d.nombre} x${d.cantidad}`);
            }

            // 4. Enviamos los pedidos completos con sus items
            res.json(pedidos);
        } catch (error) {
            console.error("Error al obtener mis pedidos:", error);
            res.status(500).json({ error: "No se pudo cargar el historial de compras." });
        }
    },
  
};

module.exports = pedidosController;