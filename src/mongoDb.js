const { MongoClient } = require('mongodb');
require('dotenv').config(); // <-- IMPORTANTE: Carga las variables de tu .env de Windows

// Usa la URI del .env si existe, sino, usa la IP actual de tu máquina virtual
const url = process.env.MONGO_URI || 'mongodb://192.168.1.19:27017'; 
const dbName = process.env.MONGO_DB_NAME || 'sportfit_resenas'; 

let dbClient = null;

async function conectarMongoDB() {
    try {
        if (dbClient) return dbClient;
        
        // Le agregamos un margen de tiempo de espera para que no se congele la consola
        const client = new MongoClient(url, { connectTimeoutMS: 5000 }); 
        await client.connect(); 
        console.log('✅ [DB NoSQL] Conexión a MongoDB exitosa.');
        
        dbClient = client.db(dbName);
        return dbClient;
    } catch (error) {
        console.error('❌ [DB NoSQL] Error de conexión a MongoDB:', error.message);
        return null;
    }
}

module.exports = conectarMongoDB;