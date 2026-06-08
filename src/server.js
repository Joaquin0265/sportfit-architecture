const express = require('express');
const cors = require('cors');
const path = require('path'); 
const pool = require('./db'); 
const conectarMongoDB = require('./mongoDb'); // 🔥 Asegúrate de que esté SIN llaves

const app = express();

app.use(cors()); 
app.use(express.json()); 
app.use(express.static(path.join(__dirname, '../public')));

// 🚦 RUTAS DEL SISTEMA
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/productos', require('./routes/productos.routes'));
app.use('/api/pedidos', require('./routes/pedidos.routes'));
app.use('/api/carrito', require('./routes/carrito.routes'));
app.use('/api/admin', require('./routes/admin.routes'));
app.use('/api/resenas', require('./routes/resenas.routes')); // 🔥 Añade esta línea si no la pusiste

app.get('/', (req, res) => {
    res.send('💪 ¡Servidor del E-commerce de Suplementos activo!');
});

async function verificarConexion() {
    try {
        const [rows] = await pool.query('SELECT 1 + 1 AS result');
        console.log('✅ [DB] Conexión a MariaDB (proyectos) exitosa.');
        
        await conectarMongoDB();

    } catch (error) {
        console.error('❌ [DB] Error de conexión:', error.message);
    }
}

verificarConexion();

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🚀 Backend corriendo en http://localhost:${PORT}`);
});