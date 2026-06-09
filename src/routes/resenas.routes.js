const express = require('express');
const router = express.Router();
const resenasController = require('../controllers/resenas.controller');
const authMiddleware = require('../middlewares/auth.middleware'); // <-- Asegúrate de importar esto

// 📖 Obtener reseñas (Público - No necesita token)
router.get('/:idProducto', resenasController.obtenerResenasPorProducto);

// 📝 Crear reseña (¡Vuelve a necesitar verificar el Token!)
router.post('/', authMiddleware.verificarToken, resenasController.crearResena);

// 😀 Reaccionar (¡Vuelve a necesitar verificar el Token!)
router.patch('/:idResena/reaccionar', authMiddleware.verificarToken, resenasController.reaccionarAResena);

// 👑 Responder (¡Vuelve a necesitar verificar el Token!)
router.post('/:idResena/responder', authMiddleware.verificarToken, resenasController.responderAResena);

module.exports = router;