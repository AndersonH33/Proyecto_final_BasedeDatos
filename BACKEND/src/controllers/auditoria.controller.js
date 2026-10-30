import { getOracleConnection } from '../config/oracle.js';
import oracledb from 'oracledb';

export const getAuditoriaClientes = async (req, res) => {
  let connection;
  try {
    connection = await getOracleConnection();
    const result = await connection.execute(
      `SELECT ID_AUDITORIA, ID_CLIENTE, OPERACION, USUARIO_BD, FECHA_CAMBIO, 
              NOMBRE_ANTERIOR, NOMBRE_NUEVO, ESTADO_ANTERIOR, ESTADO_NUEVO
       FROM CXC_ADMIN.AUD_CLIENTES
       ORDER BY FECHA_CAMBIO DESC`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener auditoría de clientes:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  } finally {
    if (connection) {
      try { await connection.close(); } catch (err) { console.error(err); }
    }
  }
};

export const getAuditoriaFacturas = async (req, res) => {
  let connection;
  try {
    connection = await getOracleConnection();
    const result = await connection.execute(
      `SELECT ID_AUDITORIA, ID_FACTURA, OPERACION, USUARIO_BD, FECHA_CAMBIO, 
              TOTAL_ANTERIOR, TOTAL_NUEVO, ESTADO_ANTERIOR, ESTADO_NUEVO
       FROM CXC_ADMIN.AUD_FACTURAS
       ORDER BY FECHA_CAMBIO DESC`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener auditoría de facturas:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  } finally {
    if (connection) {
      try { await connection.close(); } catch (err) { console.error(err); }
    }
  }
};