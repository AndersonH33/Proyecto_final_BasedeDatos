import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { getSqlConnection } from './config/sqlserver.js';
import { getOracleConnection } from './config/oracle.js';
import authRoutes from './routes/auth.routes.js';
import clientesRoutes from './routes/clientes.routes.js';
import facturasRoutes from './routes/facturas.routes.js';
import pagosRoutes from './routes/pagos.routes.js';
import cuentasCobrarRoutes from './routes/cuentasCobrar.routes.js';
import notasRoutes from './routes/notas.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import movimientosRoutes from './routes/movimientos.routes.js';
import auditoriaRoutes from './routes/auditoria.routes.js';
import usuariosRoutes from './routes/usuarios.routes.js';
import seguridadRoutes from './routes/seguridad.routes.js';
import reportesRoutes from './routes/reportes.routes.js';

// Cargar variables de entorno
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/facturas', facturasRoutes);
app.use('/api/pagos', pagosRoutes);
app.use('/api/cuentas-cobrar', cuentasCobrarRoutes);
app.use('/api/notas', notasRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/movimientos', movimientosRoutes);
app.use('/api/auditoria', auditoriaRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/seguridad', seguridadRoutes);
app.use('/api/reportes', reportesRoutes);

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