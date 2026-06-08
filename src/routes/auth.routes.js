const express = require('express');
const router = express.Router();

// Importamos el "Cerebro" que acabamos de crear
const authController = require('../controllers/auth.controller');

// ==========================================
// 🚦 RUTAS DE AUTENTICACIÓN
// ==========================================

// Ruta para registrar un nuevo cliente (POST a /api/auth/registro)
router.post('/registro', authController.registrarUsuario);

// Ruta para iniciar sesión (POST a /api/auth/login)
router.post('/login', authController.loginUsuario);

module.exports = router;