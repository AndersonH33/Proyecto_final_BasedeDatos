import { getOracleConnection } from '../config/oracle.js';
import oracledb from 'oracledb';

// --- MÓDULO NOTAS DE CRÉDITO ---

export const getNotasCredito = async (req, res) => {
  let connection;
  try {
    connection = await getOracleConnection();
    const result = await connection.execute(
      `SELECT NC.ID_NC, NC.FECHA, NC.DESCRIPCION, NC.MONTO, NC.ESTADO, 
              F.NUMERO_FACTURA, C.NOMBRE, C.APELLIDO
       FROM CXC_ADMIN.NOTAS_CREDITO NC
       JOIN CXC_ADMIN.FACTURAS F ON NC.ID_FACTURA = F.ID_FACTURA
       JOIN CXC_ADMIN.CLIENTES C ON NC.ID_CLIENTE = C.ID_CLIENTE
       ORDER BY NC.ID_NC DESC`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener notas de crédito:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  } finally {
    if (connection) {
      try { await connection.close(); } catch (err) { console.error(err); }
    }
  }
};

export const createNotaCredito = async (req, res) => {
  let connection;
  const { id_factura, id_cliente, descripcion, monto } = req.body;

  if (monto <= 0) return res.status(400).json({ message: 'El monto debe ser mayor a cero' });

  try {
    connection = await getOracleConnection();
    
    // 1. Validar saldo actual (FOR UPDATE bloquea la fila)
    const facturaResult = await connection.execute(
      `SELECT SALDO_PENDIENTE FROM CXC_ADMIN.FACTURAS WHERE ID_FACTURA = :id_factura FOR UPDATE`,
      [id_factura],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (facturaResult.rows.length === 0) {
      await connection.close();
      return res.status(404).json({ message: 'Factura no encontrada' });
    }

    const saldoActual = facturaResult.rows[0].SALDO_PENDIENTE;

    // 2. Regla de negocio: La nota no puede superar el saldo
    if (monto > saldoActual) {
      await connection.rollback();
      return res.status(400).json({ message: `La nota (${monto}) supera el saldo pendiente (${saldoActual})` });
    }

    const nuevoSaldo = saldoActual - monto;
    let estadoFactura = nuevoSaldo === 0 ? 'Pagada por Nota' : 'Ajuste parcial';

    // 3. Insertar la Nota de Crédito
    await connection.execute(
      `INSERT INTO CXC_ADMIN.NOTAS_CREDITO (ID_FACTURA, ID_CLIENTE, FECHA, DESCRIPCION, MONTO, ESTADO)
       VALUES (:id_factura, :id_cliente, SYSDATE, :descripcion, :monto, 'Aplicada')`,
      { id_factura, id_cliente, descripcion, monto }
    );

    // 4. Rebajar saldo a la Factura
    await connection.execute(
      `UPDATE CXC_ADMIN.FACTURAS 
       SET SALDO_PENDIENTE = :nuevo_saldo, ESTADO = :estado 
       WHERE ID_FACTURA = :id_factura`,
      { nuevo_saldo: nuevoSaldo, estado: estadoFactura, id_factura }
    );

    // 5. Registrar en el Estado de Cuenta
    await connection.execute(
      `INSERT INTO CXC_ADMIN.ESTADO_CUENTA (ID_FACTURA, FECHA_MOVIMIENTO, TIPO_MOVIMIENTO, MONTO, SALDO, DESCRIPCION)
       VALUES (:id_factura, SYSDATE, 'Nota de Crédito', :monto, :saldo, :descripcion)`,
      { id_factura, monto, saldo: nuevoSaldo, descripcion: `Nota de Crédito: ${descripcion}` }
    );

    // 6. Confirmar la transacción
    await connection.commit();

    res.status(201).json({ message: 'Nota de crédito registrada y saldo actualizado exitosamente' });

  } catch (error) {
    console.error('Error en transacción de nota de crédito:', error);
    if (connection) {
      try { await connection.rollback(); } catch (err) { console.error(err); }
    }
    res.status(500).json({ message: 'Error al registrar la nota, transacción revertida' });
  } finally {
    if (connection) {
      try { await connection.close(); } catch (err) { console.error(err); }
    }
  }
};



// --- MÓDULO NOTAS DE ABONO ---

export const getNotasAbono = async (req, res) => {
  let connection;
  try {
    connection = await getOracleConnection();
    const result = await connection.execute(
      `SELECT NA.ID_NA, NA.NUMERO_NA, NA.FECHA, NA.DESCRIPCION, NA.MONTO, NA.ESTADO, 
              F.NUMERO_FACTURA, C.NOMBRE, C.APELLIDO
       FROM CXC_ADMIN.NOTAS_ABONO NA
       JOIN CXC_ADMIN.FACTURAS F ON NA.ID_FACTURA = F.ID_FACTURA
       JOIN CXC_ADMIN.CLIENTES C ON NA.ID_CLIENTE = C.ID_CLIENTE
       ORDER BY NA.FECHA DESC`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener notas de abono:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  } finally {
    if (connection) {
      try { await connection.close(); } catch (err) { console.error(err); }
    }
  }
};

export const createNotaAbono = async (req, res) => {
  let connection;
  const { id_factura, id_cliente, numero_na, descripcion, monto } = req.body;

  if (monto <= 0) return res.status(400).json({ message: 'El monto debe ser mayor a cero' });

  try {
    connection = await getOracleConnection();
    
    const facturaResult = await connection.execute(
      `SELECT SALDO_PENDIENTE FROM CXC_ADMIN.FACTURAS WHERE ID_FACTURA = :id_factura FOR UPDATE`,
      [id_factura],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (facturaResult.rows.length === 0) {
      await connection.close();
      return res.status(404).json({ message: 'Factura no encontrada' });
    }

    const saldoActual = facturaResult.rows[0].SALDO_PENDIENTE;

    if (monto > saldoActual) {
      await connection.rollback();
      return res.status(400).json({ message: `La nota (${monto}) supera el saldo pendiente (${saldoActual})` });
    }

    const nuevoSaldo = saldoActual - monto;
    let estadoFactura = nuevoSaldo === 0 ? 'Pagada por Abono' : 'Abono parcial';

    // 1. Insertar la Nota de Abono (incluye NUMERO_NA)
    await connection.execute(
      `INSERT INTO CXC_ADMIN.NOTAS_ABONO (ID_FACTURA, ID_CLIENTE, FECHA, NUMERO_NA, DESCRIPCION, MONTO, ESTADO)
       VALUES (:id_factura, :id_cliente, SYSDATE, :numero_na, :descripcion, :monto, 'Aplicada')`,
      { id_factura, id_cliente, numero_na, descripcion, monto }
    );

    // 2. Rebajar saldo a la Factura
    await connection.execute(
      `UPDATE CXC_ADMIN.FACTURAS 
       SET SALDO_PENDIENTE = :nuevo_saldo, ESTADO = :estado 
       WHERE ID_FACTURA = :id_factura`,
      { nuevo_saldo: nuevoSaldo, estado: estadoFactura, id_factura }
    );

    // 3. Registrar en el Estado de Cuenta
    await connection.execute(
      `INSERT INTO CXC_ADMIN.ESTADO_CUENTA (ID_FACTURA, FECHA_MOVIMIENTO, TIPO_MOVIMIENTO, MONTO, SALDO, DESCRIPCION)
       VALUES (:id_factura, SYSDATE, 'Nota de Abono', :monto, :saldo, :descripcion)`,
      { id_factura, monto, saldo: nuevoSaldo, descripcion: `Nota Abono ${numero_na}: ${descripcion}` }
    );

    await connection.commit();
    res.status(201).json({ message: 'Nota de abono registrada exitosamente' });

  } catch (error) {
    console.error('Error en transacción de nota de abono:', error);
    if (connection) {
      try { await connection.rollback(); } catch (err) { console.error(err); }
    }
    res.status(500).json({ message: 'Error al registrar la nota de abono' });
  } finally {
    if (connection) {
      try { await connection.close(); } catch (err) { console.error(err); }
    }
  }
};