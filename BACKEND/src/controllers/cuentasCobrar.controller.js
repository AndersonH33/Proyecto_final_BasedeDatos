import { getOracleConnection } from '../config/oracle.js';
import oracledb from 'oracledb';

// 1. Obtener todas las facturas pendientes (Saldos activos)
export const getSaldosPendientes = async (req, res) => {
  let connection;
  try {
    connection = await getOracleConnection();
    const result = await connection.execute(
      `SELECT F.ID_FACTURA, F.NUMERO_FACTURA, C.NOMBRE, C.APELLIDO, 
              F.FECHA_EMISION, F.FECHA_VENCIMIENTO, F.TOTAL, F.SALDO_PENDIENTE,
              TRUNC(SYSDATE) - TRUNC(F.FECHA_VENCIMIENTO) AS DIAS_ATRASO
       FROM CXC_ADMIN.FACTURAS F
       JOIN CXC_ADMIN.CLIENTES C ON F.ID_CLIENTE = C.ID_CLIENTE
       WHERE F.SALDO_PENDIENTE > 0
       ORDER BY F.FECHA_VENCIMIENTO ASC`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error al consultar saldos pendientes:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  } finally {
    if (connection) {
      try { await connection.close(); } catch (err) { console.error(err); }
    }
  }
};

// 2. Reporte de Antigüedad de Saldos (Agrupado por Cliente)
export const getAntiguedadSaldos = async (req, res) => {
  let connection;
  try {
    connection = await getOracleConnection();
    // Esta consulta agrupa la deuda del cliente en tramos de 30 días
    const result = await connection.execute(
      `SELECT C.ID_CLIENTE, C.NOMBRE, C.APELLIDO,
              SUM(F.SALDO_PENDIENTE) AS SALDO_TOTAL,
              SUM(CASE WHEN (TRUNC(SYSDATE) - TRUNC(F.FECHA_VENCIMIENTO)) <= 30 THEN F.SALDO_PENDIENTE ELSE 0 END) AS "DIAS_1_30",
              SUM(CASE WHEN (TRUNC(SYSDATE) - TRUNC(F.FECHA_VENCIMIENTO)) BETWEEN 31 AND 60 THEN F.SALDO_PENDIENTE ELSE 0 END) AS "DIAS_31_60",
              SUM(CASE WHEN (TRUNC(SYSDATE) - TRUNC(F.FECHA_VENCIMIENTO)) BETWEEN 61 AND 90 THEN F.SALDO_PENDIENTE ELSE 0 END) AS "DIAS_61_90",
              SUM(CASE WHEN (TRUNC(SYSDATE) - TRUNC(F.FECHA_VENCIMIENTO)) > 90 THEN F.SALDO_PENDIENTE ELSE 0 END) AS "MAS_DE_90"
       FROM CXC_ADMIN.FACTURAS F
       JOIN CXC_ADMIN.CLIENTES C ON F.ID_CLIENTE = C.ID_CLIENTE
       WHERE F.SALDO_PENDIENTE > 0
       GROUP BY C.ID_CLIENTE, C.NOMBRE, C.APELLIDO
       ORDER BY SALDO_TOTAL DESC`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error al calcular antigüedad:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  } finally {
    if (connection) {
      try { await connection.close(); } catch (err) { console.error(err); }
    }
  }
};

// 3. Estado de Cuenta de un Cliente Específico
export const getEstadoCuentaCliente = async (req, res) => {
  let connection;
  const { id_cliente } = req.params;
  try {
    connection = await getOracleConnection();
    const result = await connection.execute(
      `SELECT E.ID_ESTADO_CUENTA, F.NUMERO_FACTURA, E.FECHA_MOVIMIENTO, 
              E.TIPO_MOVIMIENTO, E.MONTO, E.SALDO, E.DESCRIPCION
       FROM CXC_ADMIN.ESTADO_CUENTA E
       JOIN CXC_ADMIN.FACTURAS F ON E.ID_FACTURA = F.ID_FACTURA
       WHERE F.ID_CLIENTE = :id_cliente
       ORDER BY E.FECHA_MOVIMIENTO DESC, E.ID_ESTADO_CUENTA DESC`,
      [id_cliente],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener estado de cuenta:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  } finally {
    if (connection) {
      try { await connection.close(); } catch (err) { console.error(err); }
    }
  }
};