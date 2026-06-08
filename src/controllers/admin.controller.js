const pool = require('../db');

const pedidosController = require('./pedidos.controller');

const adminController = {
    
    crearPedidoManual: pedidosController.crearPedidoManual,
    // 📊 1. Reporte de Ventas Totales
    // Consulta los pedidos pagados y detecta productos con poco stock

    // 👥 2. Gestión de Usuarios
    // Lista a todos los clientes registrados en el sistema
    listarUsuarios: async (req, res) => {
        try {
            const [usuarios] = await pool.query(
                'SELECT id_usuario, nombre, correo, id_rol, fecha_registro FROM Usuarios'
            );
            res.json(usuarios);
        } catch (error) {
            console.error("Error en usuarios:", error);
            res.status(500).json({ error: "Error al obtener usuarios" });
        }
    },

    // 🏷️ 3. Promociones Masivas
    // Aplica un descuento porcentual a todos los productos de una categoría específica
    aplicarDescuentoCategoria: async (req, res) => {
        try {
            const { id_categoria, porcentaje } = req.body;
            const factor = 1 - (porcentaje / 100);
            
            await pool.query(
                'UPDATE Productos SET precio = precio * ? WHERE id_categoria = ?',
                [factor, id_categoria]
            );
            
            res.json({ mensaje: `Descuento del ${porcentaje}% aplicado correctamente` });
        } catch (error) {
            console.error("Error en promociones:", error);
            res.status(500).json({ error: "Error al aplicar promoción" });
        }
    },


obtenerCategorias: async (req, res) => {
    try {
        const [categorias] = await pool.query('SELECT * FROM Categorias');
        res.json(categorias);
    } catch (error) {
        res.status(500).json({ error: "Error al obtener categorías" });
    }
},

// NUEVO: Para ver una sola categoría por ID (necesario para el botón editar)
obtenerCategoriaPorId: async (req, res) => {
    try {
        const { id } = req.params;
        const [categoria] = await pool.query('SELECT * FROM Categorias WHERE id_categoria = ?', [id]);
        if (categoria.length === 0) return res.status(404).json({ error: "No existe" });
        res.json(categoria[0]);
    } catch (error) {
        res.status(500).json({ error: "Error al obtener categoría" });
    }
},

crearCategoria: async (req, res) => {
    try {
        const { nombre, descripcion } = req.body;
        const [resultado] = await pool.query(
            'INSERT INTO Categorias (nombre, descripcion) VALUES (?, ?)', [nombre, descripcion]
        );
        res.status(201).json({ mensaje: "Categoría creada", id: resultado.insertId });
    } catch (error) {
        res.status(500).json({ error: "Error al crear" });
    }
},

actualizarCategoria: async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, descripcion } = req.body;
        await pool.query(
            'UPDATE Categorias SET nombre = ?, descripcion = ? WHERE id_categoria = ?',
            [nombre, descripcion, id]
        );
        res.json({ mensaje: "Categoría actualizada" });
    } catch (error) {
        res.status(500).json({ error: "Error al actualizar" });
    }
},

eliminarCategoria: async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM Categorias WHERE id_categoria = ?', [id]);
        res.json({ mensaje: "Categoría eliminada" });
    } catch (error) {
        res.status(500).json({ error: "No se puede eliminar (revisa si tiene productos)" });
    }
},
obtenerPedidos: async (req, res) => {
        try {
            const query = `
                SELECT 
                    p.id_pedido, 
                    u.nombre AS cliente, 
                    p.fecha_pedido AS fecha, 
                    p.total, 
                    p.estado 
                FROM Pedidos p
                LEFT JOIN Usuarios u ON p.id_usuario = u.id_usuario
                ORDER BY p.id_pedido DESC`;
            
            const [pedidos] = await pool.query(query);
            res.json(pedidos);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    obtenerPedidoPorId: async (req, res) => {
        try {
            const { id } = req.params;
            const [pedido] = await pool.query('SELECT * FROM Pedidos WHERE id_pedido = ?', [id]);
            if (pedido.length === 0) return res.status(404).json({ mensaje: "No encontrado" });
            
            const [detalles] = await pool.query(`
                SELECT dp.*, p.nombre 
                FROM Detalles_Pedido dp 
                JOIN Productos p ON dp.id_producto = p.id_producto
                WHERE dp.id_pedido = ?`, [id]);

            res.json({ ...pedido[0], detalles });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Reporte de Ventas (Corregido: Pedidos en mayúscula)
    obtenerResumenVentas: async (req, res) => {
        try {
            const query = `
                SELECT 
                    COUNT(id_pedido) as total_pedidos,
                    SUM(total) as ingresos_totales,
                    (SELECT nombre FROM Productos ORDER BY stock ASC LIMIT 1) as producto_critico_stock
                FROM Pedidos 
                WHERE estado IN ('Pagado', 'Entregado', 'Pendiente')`;

            const [reporte] = await pool.query(query);
            res.json(reporte[0]);
        } catch (error) {
            res.status(500).json({ error: "Error al generar reporte" });
        }
    },

    // Copia aquí el resto de tus funciones (listarUsuarios, categorías, etc.)
    // Pero asegúrate de que NO estén duplicadas al final del archivo.
    actualizarEstadoPedido: async (req, res) => {
        try {
            const { id } = req.params;
            const { estado } = req.body;
            await pool.query('UPDATE Pedidos SET estado = ? WHERE id_pedido = ?', [estado, id]);
            res.json({ mensaje: "Estado actualizado" });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    eliminarPedido: async (req, res) => {
        try {
            const { id } = req.params;
            await pool.query('DELETE FROM Pedidos WHERE id_pedido = ?', [id]);
            res.json({ mensaje: "Pedido eliminado" });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    obtenerDashboardStats: async (req, res) => {
        try {
            // 1. Calcular el Total de Pedidos Pagados
            const [pedidosRows] = await pool.query('SELECT COUNT(*) as total FROM Pedidos WHERE estado = "Pagado"');
            const totalPedidos = pedidosRows[0].total || 0;

            // 2. Calcular los Ingresos Totales (Sumar el total de los pedidos pagados)
            const [ingresosRows] = await pool.query('SELECT SUM(total) as ingresos FROM Pedidos WHERE estado = "Pagado"');
            const ingresosTotales = ingresosRows[0].ingresos || 0;

            // 3. Buscar Productos en Riesgo (Stock menor o igual a 5)
            // Hacemos un JOIN rápido con Categorías para que la tabla muestre el nombre de la categoría
            const queryStock = `
                SELECT p.id_producto, p.nombre, p.stock, c.nombre as categoria 
                FROM Productos p 
                LEFT JOIN Categorias c ON p.id_categoria = c.id_categoria 
                WHERE p.stock <= 5
            `;
            const [productosBajoStock] = await pool.query(queryStock);

            // 4. Enviar el paquete de datos al frontend
            res.json({
                totalPedidos: totalPedidos,
                ingresosTotales: parseFloat(ingresosTotales), // Lo pasamos a float por si MariaDB lo devuelve como string
                productosBajoStock: productosBajoStock
            });

        } catch (error) {
            console.error("Error al obtener estadísticas del dashboard:", error);
            res.status(500).json({ error: "Error interno al cargar las métricas" });
        }
    }
};


module.exports = adminController;