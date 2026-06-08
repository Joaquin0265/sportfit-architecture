    const bcrypt = require('bcryptjs');
    const jwt = require('jsonwebtoken');
    const pool = require('../db'); 

    const SECRET_KEY = 'Secreto_Fitness_Ecommerce_2026'; 

    const authController = {
        // 📝 1. REGISTRO DE USUARIO
        registrarUsuario: async (req, res) => {
            try {
                const { nombre, correo, password } = req.body;

                if (!nombre || !correo || !password) {
                    return res.status(400).json({ error: "Todos los campos son obligatorios" });
                }

                const [usuarioExistente] = await pool.query('SELECT * FROM Usuarios WHERE correo = ?', [correo]);
                if (usuarioExistente.length > 0) {
                    return res.status(400).json({ error: "Este correo ya está registrado" });
                }

                const salt = await bcrypt.genSalt(10);
                const passwordHash = await bcrypt.hash(password, salt);

                const id_rol_cliente = 2; 
                const [resultadoInsert] = await pool.query(
                    'INSERT INTO Usuarios (id_rol, nombre, correo, password_hash) VALUES (?, ?, ?, ?)',
                    [id_rol_cliente, nombre, correo, passwordHash]
                );

                const nuevoUsuarioId = resultadoInsert.insertId;
                await pool.query('INSERT INTO Carritos (id_usuario) VALUES (?)', [nuevoUsuarioId]);

                res.status(201).json({ 
                    mensaje: "¡Usuario registrado con éxito y carrito creado!",
                    usuario: { id: nuevoUsuarioId, nombre, correo }
                });

            } catch (error) {
                console.error("Error en registro:", error);
                res.status(500).json({ error: "Error interno del servidor" });
            }
        },

        // 🔐 2. INICIO DE SESIÓN (LOGIN)
        loginUsuario: async (req, res) => {
            try {
                const { correo, password } = req.body;

                const [usuarios] = await pool.query('SELECT * FROM Usuarios WHERE correo = ?', [correo]);
                
                if (usuarios.length === 0) {
                    return res.status(401).json({ error: "Correo o contraseña incorrectos" });
                }

                const usuario = usuarios[0];
                const passwordValida = await bcrypt.compare(password, usuario.password_hash);
                
                if (!passwordValida) {
                    return res.status(401).json({ error: "Correo o contraseña incorrectos" });
                }

                const token = jwt.sign(
                    { id_usuario: usuario.id_usuario, id_rol: usuario.id_rol }, 
                    SECRET_KEY, 
                    { expiresIn: '24h' }
                );

                res.json({
                    mensaje: "¡Login exitoso!",
                    token: token,
                    rol: usuario.id_rol === 1 ? 'Admin' : 'Cliente', 
                    usuario: {
                        id: usuario.id_usuario,
                        nombre: usuario.nombre
                    }
                });

            } catch (error) {
                console.error("Error en login:", error);
                res.status(500).json({ error: "Error interno del servidor" });
            }
        }
    };

    module.exports = authController;