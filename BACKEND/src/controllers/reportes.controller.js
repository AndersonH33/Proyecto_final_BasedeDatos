import { getOracleConnection } from '../config/oracle.js';
import oracledb from 'oracledb';

export const getReporteCartera = async (req, res) => {
  let connection;
  try {
    connection = await getOracleConnection();
    
    // Consulta consolidada para exportación de cartera
    const result = await connection.execute(
      `SELECT 
          C.NIT, 
          C.NOMBRE || ' ' || C.APELLIDO AS CLIENTE, 
          F.NUMERO_FACTURA, 
          F.SERIE_FACTURA, 
          TO_CHAR(F.FECHA_EMISION, 'YYYY-MM-DD') AS FECHA_EMISION, 
          TO_CHAR(F.FECHA_VENCIMIENTO, 'YYYY-MM-DD') AS FECHA_VENCIMIENTO, 
          F.TOTAL, 
          F.SALDO_PENDIENTE, 
          F.ESTADO,
          CASE 
            WHEN F.SALDO_PENDIENTE = 0 THEN 0
            WHEN TRUNC(SYSDATE) > TRUNC(F.FECHA_VENCIMIENTO) THEN TRUNC(SYSDATE) - TRUNC(F.FECHA_VENCIMIENTO)
            ELSE 0
          END AS DIAS_ATRASO
       FROM CXC_ADMIN.FACTURAS F
       JOIN CXC_ADMIN.CLIENTES C ON F.ID_CLIENTE = C.ID_CLIENTE
       ORDER BY F.SALDO_PENDIENTE DESC, F.FECHA_VENCIMIENTO ASC`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error al generar reporte de cartera:', error);
    res.status(500).json({ message: 'Error interno al generar el reporte' });
  } finally {
    if (connection) {
      try { await connection.close(); } catch (err) { console.error(err); }
    }
  }
};