import sql from 'mssql';
import dotenv from 'dotenv';

dotenv.config();

const dbSettings = {
  user: process.env.SQL_USER,
  password: process.env.SQL_PASSWORD,
  server: process.env.SQL_SERVER,
  database: process.env.SQL_DATABASE,
  options: {
    encrypt: true, // Cambia a false si tu SQL Server local te da error de certificado SSL
    trustServerCertificate: true,
  },
};

export const getSqlConnection = async () => {
  try {
    const pool = await sql.connect(dbSettings);
    return pool;
  } catch (error) {
    console.error('❌ Error conectando a SQL Server:', error.message);
    throw error;
  }
};