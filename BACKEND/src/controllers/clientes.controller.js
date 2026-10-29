import { getOracleConnection } from '../config/oracle.js';
import oracledb from 'oracledb';

// Obtener todos los clientes (Read)
export const getClientes = async (req, res) => {
  let connection;
  try {
    connection = await getOracleConnection();
    
    // outFormat: oracledb.OUT_FORMAT_OBJECT es crucial para que Express devuelva 
    // un JSON con los nombres de las columnas como llaves, en lugar de un arreglo simple.
    const result = await connection.execute(
      `SELECT ID_CLIENTE, NOMBRE, APELLIDO, NIT, TELEFONO, CORREO, DIRECCION, DIAS_CREDITO, ESTADO 
       FROM CXC_ADMIN.CLIENTES`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener clientes:', error);
    res.status(500).json({ message: 'Error al consultar la base de datos operativa' });
  } finally {
    if (connection) {
      try {
        await connection.close(); // Siempre cerrar la conexión para no saturar Oracle
      } catch (err) {
        console.error('Error al cerrar la conexión:', err);
      }
    }
  }
};

// Crear un nuevo cliente (Create)
export const createCliente = async (req, res) => {
  const { nombre, apellido, nit, telefono, correo, direccion, dias_credito } = req.body;
  let connection;

  try {
    connection = await getOracleConnection();
    
    await connection.execute(
      `INSERT INTO CXC_ADMIN.CLIENTES 
       (NOMBRE, APELLIDO, NIT, TELEFONO, CORREO, DIRECCION, DIAS_CREDITO, ESTADO) 
       VALUES (:nombre, :apellido, :nit, :telefono, :correo, :direccion, :dias_credito, 'Activo')`,
      {
        nombre,
        apellido,
        nit,
        telefono,
        correo,
        direccion,
        dias_credito
      },
      { autoCommit: true } // AutoCommit en true para que la transacción se guarde inmediatamente
    );

    res.status(201).json({ message: 'Cliente registrado exitosamente' });
  } catch (error) {
    console.error('Error al crear cliente:', error);
    res.status(500).json({ message: 'Error al registrar el cliente' });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error(err);
      }
    }
  }
};



// Obtener un cliente específico por su ID
export const getClienteById = async (req, res) => {
  const { id } = req.params;
  let connection;

  try {
    connection = await getOracleConnection();
    
    const result = await connection.execute(
      `SELECT ID_CLIENTE, NOMBRE, APELLIDO, NIT, TELEFONO, CORREO, DIRECCION, DIAS_CREDITO, ESTADO 
       FROM CXC_ADMIN.CLIENTES 
       WHERE ID_CLIENTE = :id`,
      [id],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al obtener cliente:', error);
    res.status(500).json({ message: 'Error al consultar la base de datos' });
  } finally {
    if (connection) {
      try { await connection.close(); } catch (err) { console.error(err); }
    }
  }
};

// Editar un cliente existente (Update)
export const updateCliente = async (req, res) => {
  const { id } = req.params;
  const { nombre, apellido, nit, telefono, correo, direccion, dias_credito, estado } = req.body;
  let connection;

  try {
    connection = await getOracleConnection();
    
    const result = await connection.execute(
      `UPDATE CXC_ADMIN.CLIENTES 
       SET NOMBRE = :nombre, 
           APELLIDO = :apellido, 
           NIT = :nit, 
           TELEFONO = :telefono, 
           CORREO = :correo, 
           DIRECCION = :direccion, 
           DIAS_CREDITO = :dias_credito, 
           ESTADO = :estado
       WHERE ID_CLIENTE = :id`,
      { nombre, apellido, nit, telefono, correo, direccion, dias_credito, estado, id },
      { autoCommit: true }
    );

    if (result.rowsAffected === 0) {
      return res.status(404).json({ message: 'Cliente no encontrado o no hubo cambios' });
    }

    res.json({ message: 'Cliente actualizado exitosamente' });
  } catch (error) {
    console.error('Error al actualizar cliente:', error);
    res.status(500).json({ message: 'Error al actualizar el cliente' });
  } finally {
    if (connection) {
      try { await connection.close(); } catch (err) { console.error(err); }
    }
  }
};

// Desactivar un cliente (Delete lógico)
export const desactivarCliente = async (req, res) => {
  const { id } = req.params;
  let connection;

  try {
    connection = await getOracleConnection();
    
    // Solo cambiamos el estado en lugar de hacer un DELETE para no romper relaciones financieras
    const result = await connection.execute(
      `UPDATE CXC_ADMIN.CLIENTES SET ESTADO = 'Inactivo' WHERE ID_CLIENTE = :id`,
      [id],
      { autoCommit: true }
    );

    if (result.rowsAffected === 0) {
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }

    res.json({ message: 'Cliente desactivado exitosamente' });
  } catch (error) {
    console.error('Error al desactivar cliente:', error);
    res.status(500).json({ message: 'Error al desactivar el cliente' });
  } finally {
    if (connection) {
      try { await connection.close(); } catch (err) { console.error(err); }
    }
  }
};


