const express = require('express');
const router = express.Router();
const productosController = require('../controllers/productos.controller');

// Importamos a nuestros guardias de seguridad
const { verificarToken, esAdmin } = require('../middlewares/auth.middleware');

// 1. Importar multer y path para manejar los archivos físicos
const multer = require('multer');
const path = require('path');

// ==========================================
// 📦 CONFIGURACIÓN DE MULTER (SUBIDA DE IMÁGENES)
// ==========================================
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // La foto se guardará físicamente en la carpeta public/img de tu proyecto
        cb(null, path.join(__dirname, '../../public/img')); 
    },
    filename: function (req, file, cb) {
        // Le damos un nombre único para evitar que fotos con el mismo nombre se chanquen
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'prod-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// Inicializamos el middleware
const upload = multer({ storage: storage });

// ==========================================
// 🚦 RUTAS DEL CATÁLOGO DE PRODUCTOS
// ==========================================

// 1. Ver todos los productos (Público)
router.get('/', productosController.obtenerTodos);

// 2. Ver un producto por ID (Público)
router.get('/:id', productosController.obtenerPorId);

// 3. Crear producto (SOLO ADMIN + RECIBIR IMAGEN)
// Ojo al orden: Primero verificamos si es admin, y solo si lo es, permitimos subir la foto
router.post('/', verificarToken, esAdmin, upload.single('imagen'), productosController.crearProducto);

// 4. Actualizar producto (SOLO ADMIN + RECIBIR IMAGEN OPCIONAL)
router.put('/:id', verificarToken, esAdmin, upload.single('imagen'), productosController.actualizarProducto);

// 5. Eliminar producto (SOLO ADMIN)
router.delete('/:id', verificarToken, esAdmin, productosController.eliminarProducto);

module.exports = router;