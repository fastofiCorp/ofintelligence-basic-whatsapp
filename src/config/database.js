const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

// Create a connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'whatsapp_app',
    waitForConnections: true,
    connectionLimit: process.env.DB_POOL_LIMIT || 10,
    queueLimit: 0
});

/**
 * Get a connection from the pool
 * @returns {Promise<mysql.PoolConnection>}
 */
const getConnection = async () => {
    try {
        return await pool.getConnection();
    } catch (error) {
        console.error('Error getting database connection:', error);
        throw error;
    }
};

/**
 * Initialize database connection
 */
const initDatabase = async () => {
    try {
        const connection = await pool.getConnection();
        console.log('Database connection established successfully');
        connection.release();
        return true;
    } catch (error) {
        console.error('Failed to connect to the database:', error);
        throw error;
    }
};

module.exports = {
    pool,
    getConnection,
    initDatabase
};
