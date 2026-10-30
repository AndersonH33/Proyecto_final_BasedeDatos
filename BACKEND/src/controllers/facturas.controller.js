import { getOracleConnection } from '../config/oracle.js';
import oracledb from 'oracledb';

// 1. Obtener todas las facturas (Read)
export const getFacturas = async (req, res) => {
  let connection;
  try {
    connection = await getOracleConnection();
    const result = await connection.execute(
      `SELECT F.ID_FACTURA, F.NUMERO_FACTURA, F.SERIE_FACTURA, F.FECHA_EMISION, 
              F.TOTAL, F.SALDO_PENDIENTE, F.ESTADO, C.NOMBRE, C.APELLIDO
       FROM CXC_ADMIN.FACTURAS F
       JOIN CXC_ADMIN.CLIENTES C ON F.ID_CLIENTE = C.ID_CLIENTE
       ORDER BY F.ID_FACTURA DESC`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener facturas:', error);
    res.status(500).json({ message: 'Error al consultar facturas' });
  } finally {
    if (connection) {
      try { await connection.close(); } catch (err) { console.error(err); }
    }
  }
};

// 2. Obtener una factura específica con sus detalles
export const getFacturaById = async (req, res) => {
  let connection;
  const { id } = req.params;

  try {
    connection = await getOracleConnection();
    
    // Consultar la cabecera
    const cabeceraResult = await connection.execute(
      `SELECT * FROM CXC_ADMIN.FACTURAS WHERE ID_FACTURA = :id`,
      [id],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (cabeceraResult.rows.length === 0) {
      return res.status(404).json({ message: 'Factura no encontrada' });
    }

    // Consultar los detalles
    const detallesResult = await connection.execute(
      `SELECT * FROM CXC_ADMIN.FACTURAS_DETALLE WHERE ID_FACTURA = :id`,
      [id],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    // Unir ambos resultados en un solo JSON
    const factura = cabeceraResult.rows[0];
    factura.detalles = detallesResult.rows;

    res.json(factura);
  } catch (error) {
    console.error('Error al obtener factura:', error);
    res.status(500).json({ message: 'Error al consultar la factura' });
  } finally {
    if (connection) {
      try { await connection.close(); } catch (err) { console.error(err); }
    }
  }
};

// 3. Crear una Factura (Maestro-Detalle con Transacción)
export const createFactura = async (req, res) => {
  let connection;
  const { 
    id_cliente, numero_factura, serie_factura, fecha_emision, fecha_vencimiento, 
    subtotal, total, saldo_pendiente, detalles 
  } = req.body;

  try {
    connection = await getOracleConnection();
    
    // Iniciar transacción (no ponemos autoCommit: true)
    
    // A. Insertar cabecera y recuperar el ID generado (IDENTITY)
    const sqlCabecera = `
      INSERT INTO CXC_ADMIN.FACTURAS 
      (ID_CLIENTE, NUMERO_FACTURA, SERIE_FACTURA, FECHA_EMISION, FECHA_VENCIMIENTO, SUBTOTAL, TOTAL, SALDO_PENDIENTE, ESTADO) 
      VALUES 
      (:id_cliente, :numero_factura, :serie_factura, TO_DATE(:fecha_emision, 'YYYY-MM-DD'), TO_DATE(:fecha_vencimiento, 'YYYY-MM-DD'), :subtotal, :total, :saldo_pendiente, 'Emitida')
      RETURNING ID_FACTURA INTO :id_factura_out
    `;
    
    const bindsCabecera = {
      id_cliente, numero_factura, serie_factura, fecha_emision, fecha_vencimiento, subtotal, total, saldo_pendiente,
      id_factura_out: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT } // Captura el ID recién creado
    };

    const resultCabecera = await connection.execute(sqlCabecera, bindsCabecera);
    const idFacturaNuevo = resultCabecera.outBinds.id_factura_out[0];

    // B. Insertar cada línea de detalle asociada al nuevo ID
    const sqlDetalle = `
      INSERT INTO CXC_ADMIN.FACTURAS_DETALLE 
      (ID_FACTURA, DESCRIPCION, CANTIDAD, PRECIO_UNITARIO, SUBTOTAL) 
      VALUES 
      (:id_factura, :descripcion, :cantidad, :precio_unitario, :subtotal_detalle)
    `;

    for (const item of detalles) {
      await connection.execute(sqlDetalle, {
        id_factura: idFacturaNuevo,
        descripcion: item.descripcion,
        cantidad: item.cantidad,
        precio_unitario: item.precio_unitario,
        subtotal_detalle: item.subtotal
      });
    }

    // C. Si todo salió bien, guardamos definitivamente (Commit)
    await connection.commit();

    res.status(201).json({ message: 'Factura registrada exitosamente', id_factura: idFacturaNuevo });
  } catch (error) {
    console.error('Error en transacción de factura:', error);
    // Si hubo cualquier error, deshacemos todo lo que se intentó guardar en esta petición
    if (connection) {
      try { await connection.rollback(); } catch (rollbackErr) { console.error('Error en rollback:', rollbackErr); }
    }
    res.status(500).json({ message: 'Error al registrar la factura, transacción revertida' });
  } finally {
    if (connection) {
      try { await connection.close(); } catch (err) { console.error(err); }
    }
  }
};