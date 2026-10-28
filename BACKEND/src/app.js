import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { getSqlConnection } from './config/sqlserver.js';
import { getOracleConnection } from './config/oracle.js';

// Cargar variables de entorno
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Endpoint de verificación de conexiones (Fase 2)
app.get('/api/health', async (req, res) => {
  try {
    // 1. Probar SQL Server
    const sqlPool = await getSqlConnection();
    
    // 2. Probar Oracle
    const oracleConn = await getOracleConnection();
    await oracleConn.close(); // Cerramos la conexión de Oracle tras la prueba
    
    res.json({ 
      status: 'success', 
      message: 'Conexión exitosa a SQL Server (Seguridad) y Oracle (Finanzas)' 
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      message: 'Fallo al conectar con las bases de datos',
      error: error.message 
    });
  }
});

// Iniciar servidor
app.listen(port, () => {
  console.log(`🚀 Servidor backend corriendo en http://localhost:${port}`);
  console.log(`🔍 Verifica las conexiones en http://localhost:${port}/api/health`);
});