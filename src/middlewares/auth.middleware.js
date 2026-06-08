const jwt = require('jsonwebtoken');

// La misma llave secreta que usamos en el auth.controller.js
const SECRET_KEY = 'Secreto_Fitness_Ecommerce_2026'; 

const authMiddleware = {
    // 🛡️ GUARDIA 1: Verifica si el usuario inició sesión (Tiene un Token válido)
    verificarToken: (req, res, next) => {
        // Buscamos el token en las cabeceras de la petición
        const token = req.header('Authorization');
        
        if (!token) {
            return res.status(401).json({ error: 'Acceso denegado. Debes iniciar sesión primero.' });
        }

        try {
            // Normalmente los tokens se envían con la palabra "Bearer " antes. La quitamos para leer solo el código.
            const tokenLimpio = token.replace('Bearer ', '');
            
            // Verificamos si el token es real y no ha sido alterado
            const decodificado = jwt.verify(tokenLimpio, SECRET_KEY);
            
            // Guardamos los datos del usuario (id, rol) dentro de 'req' para usarlos en el siguiente paso
            req.usuario = decodificado; 
            
            next(); // Todo en orden, le decimos "puedes pasar" a la ruta que pidió
        } catch (error) {
            res.status(400).json({ error: 'Token no válido o ha expirado. Vuelve a iniciar sesión.' });
        }
    },

    // 👑 GUARDIA 2: Verifica si el usuario es el Administrador de la tienda
    esAdmin: (req, res, next) => {
        // Asumimos que este guardia SIEMPRE se pone DESPUÉS del guardia 1 (verificarToken)
        if (req.usuario.id_rol !== 1) { // Recuerda: en tu BD el id_rol 1 es Administrador
            return res.status(403).json({ error: 'Acceso denegado. Esta zona es exclusiva para administradores.' });
        }
        
        next(); // Es admin, lo dejamos pasar al panel de control
    }
};

module.exports = authMiddleware;