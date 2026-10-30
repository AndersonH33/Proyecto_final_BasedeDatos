import { getOracleConnection } from '../config/oracle.js';
import oracledb from 'oracledb';

// Obtener todos los pagos (Read)
export const getPagos = async (req, res) => {
  let connection;
  try {
    connection = await getOracleConnection();
    const result = await connection.execute(
      `SELECT P.ID_PAGO, P.MONTO, P.FECHA_PAGO, P.REFERENCIA, P.ESTADO, 
              F.NUMERO_FACTURA, M.NOMBRE_METODO, C.NOMBRE AS CLIENTE
       FROM CXC_ADMIN.PAGOS P
       JOIN CXC_ADMIN.FACTURAS F ON P.ID_FACTURA = F.ID_FACTURA
       JOIN CXC_ADMIN.CLIENTES C ON F.ID_CLIENTE = C.ID_CLIENTE
       JOIN CXC_ADMIN.METODOS_PAGO M ON P.ID_METODO_PAGO = M.ID_MPAGO
       ORDER BY P.ID_PAGO DESC`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener pagos:', error);
    res.status(500).json({ message: 'Error al consultar pagos' });
  } finally {
    if (connection) {
      try { await connection.close(); } catch (err) { console.error(err); }
    }
  }
};

// Registrar un nuevo pago (Create - Transacción Compleja)
export const createPago = async (req, res) => {
  let connection;
  const { id_factura, id_metodo_pago, monto, referencia } = req.body;

  // 1. Validar que el monto sea positivo
  if (monto <= 0) {
    return res.status(400).json({ message: 'El monto del pago debe ser mayor a cero' });
  }

  try {
    connection = await getOracleConnection();
    
    // 2. Consultar el saldo actual de la factura bloqueando la fila para evitar cobros dobles simultáneos
    const facturaResult = await connection.execute(
      `SELECT SALDO_PENDIENTE FROM CXC_ADMIN.FACTURAS WHERE ID_FACTURA = :id_factura FOR UPDATE`,
      [id_factura],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (facturaResult.rows.length === 0) {
      // Si la factura no existe, cerramos y salimos (no hay nada que hacer rollback aún)
      await connection.close();
      return res.status(404).json({ message: 'Factura no encontrada' });
    }

    const saldoActual = facturaResult.rows[0].SALDO_PENDIENTE;

    // 3. Validar que el pago no supere el saldo
    if (monto > saldoActual) {
      await connection.rollback();
      return res.status(400).json({ message: `El pago (${monto}) supera el saldo pendiente de la factura (${saldoActual})` });
    }

    const nuevoSaldo = saldoActual - monto;
    let estadoFactura = nuevoSaldo === 0 ? 'Pagada' : 'Abono parcial'; // Lógica básica de estados

    // 4. Insertar el pago en CXC_ADMIN.PAGOS
    await connection.execute(
      `INSERT INTO CXC_ADMIN.PAGOS (ID_METODO_PAGO, ID_FACTURA, MONTO, FECHA_PAGO, REFERENCIA, ESTADO)
       VALUES (:id_metodo, :id_factura, :monto, SYSDATE, :referencia, 'Aplicado')`,
      { id_metodo: id_metodo_pago, id_factura, monto, referencia }
    );

    // 5. Actualizar el saldo de la factura en CXC_ADMIN.FACTURAS
    await connection.execute(
      `UPDATE CXC_ADMIN.FACTURAS 
       SET SALDO_PENDIENTE = :nuevo_saldo, ESTADO = :estado 
       WHERE ID_FACTURA = :id_factura`,
      { nuevo_saldo: nuevoSaldo, estado: estadoFactura, id_factura }
    );

    // 6. Registrar el movimiento en el Estado de Cuenta
    await connection.execute(
      `INSERT INTO CXC_ADMIN.ESTADO_CUENTA (ID_FACTURA, FECHA_MOVIMIENTO, TIPO_MOVIMIENTO, MONTO, SALDO, DESCRIPCION)
       VALUES (:id_factura, SYSDATE, 'Pago/Abono', :monto, :saldo, :descripcion)`,
      { 
        id_factura, 
        monto, 
        saldo: nuevoSaldo, 
        descripcion: `Pago registrado. Referencia: ${referencia}` 
      }
    );

    // 7. Si llegamos aquí sin errores, confirmamos la transacción (COMMIT)
    await connection.commit();

    res.status(201).json({ 
      message: 'Pago registrado y saldo actualizado exitosamente',
      nuevo_saldo_factura: nuevoSaldo 
    });

  } catch (error) {
    console.error('Error en transacción de pago:', error);
    // Si algo falló (ej. error de sintaxis, tabla caída), revertimos todo (ROLLBACK)
    if (connection) {
      try { await connection.rollback(); } catch (err) { console.error('Error en rollback:', err); }
    }
    res.status(500).json({ message: 'Error al registrar el pago, transacción revertida' });
  } finally {
    if (connection) {
      try { await connection.close(); } catch (err) { console.error(err); }
    }
  }
};