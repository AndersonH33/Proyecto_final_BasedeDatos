import { getOracleConnection } from '../config/oracle.js';
import oracledb from 'oracledb';

export const getDashboardKPIs = async (req, res) => {
  let connection;
  try {
    connection = await getOracleConnection();
    
    // Ejecutar múltiples consultas ligeras para los KPIs
    const clientesRes = await connection.execute(`SELECT COUNT(*) AS TOTAL FROM CXC_ADMIN.CLIENTES WHERE ESTADO = 'Activo'`);
    const facturasRes = await connection.execute(`SELECT NVL(SUM(TOTAL), 0) AS FACTURADO, NVL(SUM(SALDO_PENDIENTE), 0) AS SALDO FROM CXC_ADMIN.FACTURAS`);
    const pagosRes = await connection.execute(`SELECT NVL(SUM(MONTO), 0) AS PAGADO FROM CXC_ADMIN.PAGOS WHERE ESTADO = 'Aplicado'`);
    const vencidasRes = await connection.execute(`SELECT COUNT(*) AS TOTAL FROM CXC_ADMIN.FACTURAS WHERE SALDO_PENDIENTE > 0 AND TRUNC(SYSDATE) > TRUNC(FECHA_VENCIMIENTO)`);

    const kpis = {
      total_clientes: clientesRes.rows[0][0],
      total_facturado: facturasRes.rows[0][0],
      saldo_pendiente: facturasRes.rows[0][1],
      total_pagado: pagosRes.rows[0][0],
      facturas_vencidas: vencidasRes.rows[0][0]
    };

    res.json(kpis);
  } catch (error) {
    console.error('Error al cargar KPIs del Dashboard:', error);
    res.status(500).json({ message: 'Error interno al calcular indicadores' });
  } finally {
    if (connection) {
      try { await connection.close(); } catch (err) { console.error(err); }
    }
  }
};