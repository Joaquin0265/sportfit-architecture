const { MongoClient } = require('mongodb');

const url = 'mongodb://10.54.192.125:27017'; 
const dbName = 'sportfit_resenas'; 

let dbClient = null;

async function conectarMongoDB() {
    try {
        if (dbClient) return dbClient;
        
        const client = new MongoClient(url); 
        await client.connect(); 
        console.log('✅ [DB NoSQL] Conexión a MongoDB en Docker exitosa.');
        
        dbClient = client.db(dbName);
        return dbClient;
    } catch (error) {
        console.error('❌ [DB NoSQL] Error de conexión a MongoDB:', error.message);
        return null;
    }
}

module.exports = conectarMongoDB;