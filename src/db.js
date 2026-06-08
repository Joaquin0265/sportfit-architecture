const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: '192.168.1.19',         
    port: 3306,                
    user: 'admin_node',               
    password: '1140',              
    database: 'proyecto',       
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

module.exports = pool;  