const express = require('express');
const router = report = express.Router();
const resenasController = require('../controllers/resenas.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.get('/:idProducto', resenasController.obtenerResenasPorProducto);
router.post('/', authMiddleware.verificarToken, resenasController.crearResena);
router.patch('/:idResena/reaccionar', authMiddleware.verificarToken, resenasController.reaccionarAResena);
router.post('/:idResena/responder', authMiddleware.verificarToken, resenasController.responderAResena);

module.exports = router;