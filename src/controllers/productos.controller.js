const pool = require('../db');

const productosController = {
    // 1. Ver todos los productos (Público - Se usa en index.html)
    obtenerTodos: async (req, res) => {
        try {
            const [productos] = await pool.query('SELECT * FROM Productos');
            res.json(productos);
        } catch (error) {
            console.error('Error al obtener productos:', error);
            res.status(500).json({ error: "Error al cargar los productos" });
        }
    },

    // 2. Ver un solo producto por ID (Útil para editar)
    obtenerPorId: async (req, res) => {
        try {
            const { id } = req.params;
            const [producto] = await pool.query('SELECT * FROM Productos WHERE id_producto = ?', [id]);
            
            if (producto.length === 0) {
                return res.status(404).json({ error: "Producto no encontrado" });
            }
            res.json(producto[0]);
        } catch (error) {
            res.status(500).json({ error: "Error al obtener el producto" });
        }
    },

    // 3. Agregar un nuevo producto (MODIFICADO PARA IMÁGENES REALES)
    crearProducto: async (req, res) => {
        try {
            // Los textos vienen en req.body, la imagen en req.file
            const { id_categoria, nombre, descripcion, precio, stock } = req.body;
            
            // Si el admin subió una foto, usamos esa ruta, si no, un placeholder
            let imagen_url = '/img/placeholder.jpg';
            if (req.file) {
                imagen_url = `/img/${req.file.filename}`;
            }
            
            const [resultado] = await pool.query(
                'INSERT INTO Productos (id_categoria, nombre, descripcion, precio, stock, imagen_url) VALUES (?, ?, ?, ?, ?, ?)',
                [id_categoria, nombre, descripcion, precio, stock, imagen_url]
            );
            
            res.status(201).json({ 
                mensaje: "Producto agregado al catálogo exitosamente", 
                id_producto: resultado.insertId 
            });
        } catch (error) {
            console.error('Error al crear:', error);
            res.status(500).json({ error: "Error al crear el producto" });
        }
    },

    // 4. Actualizar un producto existente (MODIFICADO PARA IMÁGENES OPCIONALES)
    actualizarProducto: async (req, res) => {
        try {
            const { id } = req.params;
            const { id_categoria, nombre, descripcion, precio, stock } = req.body;
            
            let query;
            let params;

            // Lógica inteligente: ¿Subió el admin una nueva foto?
            if (req.file) {
                // Sí subió foto: Actualizamos todo incluyendo la nueva URL de imagen
                const imagen_url = `/img/${req.file.filename}`;
                query = `
                    UPDATE Productos 
                    SET id_categoria = ?, nombre = ?, descripcion = ?, precio = ?, stock = ?, imagen_url = ? 
                    WHERE id_producto = ?`;
                params = [id_categoria, nombre, descripcion, precio, stock, imagen_url, id];
            } else {
                // No subió foto: Solo actualizamos los textos y mantenemos la imagen que ya tenía
                query = `
                    UPDATE Productos 
                    SET id_categoria = ?, nombre = ?, descripcion = ?, precio = ?, stock = ? 
                    WHERE id_producto = ?`;
                params = [id_categoria, nombre, descripcion, precio, stock, id];
            }
                
            const [resultado] = await pool.query(query, params);

            if (resultado.affectedRows === 0) {
                return res.status(404).json({ error: "Producto no encontrado para actualizar" });
            }

            res.json({ mensaje: "Producto actualizado con éxito" });
        } catch (error) {
            console.error('Error al actualizar:', error);
            res.status(500).json({ error: "Error al actualizar el producto" });
        }
    },

    // 5. Eliminar un producto (🗑️ Botón de borrar)
    eliminarProducto: async (req, res) => {
        try {
            const { id } = req.params;
            const [resultado] = await pool.query('DELETE FROM Productos WHERE id_producto = ?', [id]);

            if (resultado.affectedRows === 0) {
                return res.status(404).json({ error: "El producto no existe o ya fue eliminado" });
            }

            res.json({ mensaje: "Producto eliminado correctamente del sistema" });
        } catch (error) {
            console.error('Error al eliminar:', error);
            res.status(500).json({ error: "Error al eliminar el producto. Asegúrate de que no esté en pedidos existentes." });
        }
    }
};

module.exports = productosController;

