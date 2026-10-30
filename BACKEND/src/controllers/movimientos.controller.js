import { getOracleConnection } from '../config/oracle.js';
import oracledb from 'oracledb';

export const getEntradasSalidas = async (req, res) => {
  let connection;
  try {
    connection = await getOracleConnection();
    
    // Consulta combinada (UNION ALL) para ver todos los movimientos en una sola tabla
    const result = await connection.execute(
      `SELECT 'ENTRADA' AS TIPO, ID_ENTRADA AS ID_MOVIMIENTO, FECHA, DESCRIPCION, MONTO, ESTADO 
       FROM CXC_ADMIN.ENTRADAS
       UNION ALL
       SELECT 'SALIDA' AS TIPO, ID_SALIDA AS ID_MOVIMIENTO, FECHA, DESCRIPCION, MONTO, ESTADO 
       FROM CXC_ADMIN.SALIDAS
       ORDER BY FECHA DESC`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener movimientos:', error);
    res.status(500).json({ message: 'Error al consultar movimientos' });
  } finally {
    if (connection) {
      try { await connection.close(); } catch (err) { console.error(err); }
    }
  }
};

export const getRecibos = async (req, res) => {
  let connection;
  try {
    connection = await getOracleConnection();
    const result = await connection.execute(
      `SELECT R.ID_RECIBO, R.NUMERO_RECIBO, R.FECHA_EMISION, R.IMPORTE, R.ESTADO, F.NUMERO_FACTURA
       FROM CXC_ADMIN.RECIBOS_AUTORIZADOS R
       JOIN CXC_ADMIN.FACTURAS F ON R.ID_FACTURA = F.ID_FACTURA
       ORDER BY R.FECHA_EMISION DESC`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener recibos:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  } finally {
    if (connection) {
      try { await connection.close(); } catch (err) { console.error(err); }
    }
  }
};