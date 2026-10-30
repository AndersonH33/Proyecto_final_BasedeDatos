import { getSqlConnection } from '../config/sqlserver.js';

export const getUsuarios = async (req, res) => {
  try {
    const pool = await getSqlConnection();
    const result = await pool.request().query(`
      SELECT U.ID_USUARIO, U.NOMBRE, U.APELLIDO, U.USUARIO, U.CORREO, 
             U.ESTADO, U.FECHA_CREACION, P.NOMBRE_PERFIL
      FROM CXC.USUARIOS U
      LEFT JOIN CXC.PERFILES P ON P.ID_PERFIL = U.ID_PERFIL
      ORDER BY U.ID_USUARIO
    `);
    res.json(result.recordset);
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ message: 'Error al consultar usuarios en SQL Server' });
  }
};