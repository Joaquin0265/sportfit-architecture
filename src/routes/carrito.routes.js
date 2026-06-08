const router = require('express').Router();
const carritoController = require('../controllers/carrito.controller');
const { verificarToken } = require('../middlewares/auth.middleware');

router.get('/', verificarToken, carritoController.obtenerCarrito);
router.post('/agregar', verificarToken, carritoController.agregarProducto);
module.exports = router;