import { getSqlConnection } from '../config/sqlserver.js';

export const getPerfiles = async (req, res) => {
  try {
    const pool = await getSqlConnection();
    const result = await pool.request().query(`
      SELECT ID_PERFIL, NOMBRE_PERFIL, DESCRIPCION, ESTADO, FECHA_CREACION
      FROM CXC.PERFILES
      ORDER BY ID_PERFIL
    `);
    res.json(result.recordset);
  } catch (error) {
    console.error('Error al obtener perfiles:', error);
    res.status(500).json({ message: 'Error al consultar perfiles en SQL Server' });
  }
};

export const getPermisosMatriz = async (req, res) => {
  try {
    const pool = await getSqlConnection();
    const result = await pool.request().query(`
      SELECT 
        P.NOMBRE_PERFIL,
        M.NOMBRE_MENU,
        PM.PUEDE_VER,
        PM.PUEDE_CREAR,
        PM.PUEDE_EDITAR,
        PM.PUEDE_ELIMINAR
      FROM CXC.PERFILES_MENUS PM
      JOIN CXC.PERFILES P ON P.ID_PERFIL = PM.ID_PERFIL
      JOIN CXC.MENUS M ON M.ID_MENU = PM.ID_MENU
      ORDER BY P.NOMBRE_PERFIL, M.ORDEN
    `);
    res.json(result.recordset);
  } catch (error) {
    console.error('Error al obtener matriz de permisos:', error);
    res.status(500).json({ message: 'Error al consultar permisos en SQL Server' });
  }
};