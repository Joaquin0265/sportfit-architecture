const pool = require('../db');

const carritoController = {
    // Ver los productos del carrito del usuario actual
    obtenerCarrito: async (req, res) => {
        try {
            const id_usuario = req.usuario.id_usuario;
            const query = `
                SELECT p.id_producto, p.nombre, p.precio, ci.cantidad, (p.precio * ci.cantidad) AS subtotal
                FROM Carrito_Items ci
                JOIN Carritos c ON ci.id_carrito = c.id_carrito
                JOIN Productos p ON ci.id_producto = p.id_producto
                WHERE c.id_usuario = ?`;
            
            const [items] = await pool.query(query, [id_usuario]);
            res.json(items);
        } catch (error) {
            res.status(500).json({ error: "Error al obtener el carrito" });
        }
    },

    // Agregar o actualizar cantidad de un producto en el carrito
    agregarProducto: async (req, res) => {
        try {
            const id_usuario = req.usuario.id_usuario;
            const { id_producto, cantidad } = req.body;

            // 1. Obtener el id_carrito del usuario
            const [carrito] = await pool.query('SELECT id_carrito FROM Carritos WHERE id_usuario = ?', [id_usuario]);
            const id_carrito = carrito[0].id_carrito;

            // 2. Insertar o actualizar si ya existe (ON DUPLICATE KEY UPDATE)
            await pool.query(
                `INSERT INTO Carrito_Items (id_carrito, id_producto, cantidad) 
                 VALUES (?, ?, ?) 
                 ON DUPLICATE KEY UPDATE cantidad = cantidad + VALUES(cantidad)`,
                [id_carrito, id_producto, cantidad]
            );

            res.json({ mensaje: "Producto añadido al carrito" });
        } catch (error) {
            res.status(500).json({ error: "Error al añadir al carrito" });
        }
    }
};

module.exports = carritoController;