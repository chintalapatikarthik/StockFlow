const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

const sslConfig = process.env.DB_SSL === 'true' 
  ? { rejectUnauthorized: false } 
  : false;

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'stockflow',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  ssl: sslConfig
});

const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('Database connected successfully.');
    connection.release();
    return true;
  } catch (error) {
    console.error('Database connection failed:', error.message);
    return false;
  }
};

module.exports = {
  pool,
  testConnection
};
