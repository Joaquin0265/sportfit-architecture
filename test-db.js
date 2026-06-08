const pool = require('./src/db'); // Ajusta la ruta si es necesario

async function probar() {
    try {
        // Intentamos una consulta simple
        const [rows] = await pool.query('SELECT "Conexión Exitosa" AS mensaje');
        console.log('✅ Resultado:', rows[0].mensaje);
        console.log('🚀 Node.js y MariaDB están sincronizados.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error de conexión en Visual Studio:');
        console.error('Mensaje:', error.message);
        process.exit(1);
    }
}

probar();