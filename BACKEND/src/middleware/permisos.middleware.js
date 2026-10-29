import { getSqlConnection } from '../config/sqlserver.js';

/**
 * Middleware para validar permisos operativos desde SQL Server.
 * @param {string} nombreMenu - El nombre del menú según la tabla CXC.MENUS (ej. 'Clientes', 'Facturas').
 * @param {string} operacion - La acción a validar: 'PUEDE_VER', 'PUEDE_CREAR', 'PUEDE_EDITAR', 'PUEDE_ELIMINAR'.
 */
export const requerirPermiso = (nombreMenu, operacion) => {
  return async (req, res, next) => {
    // req.user viene del middleware anterior (verificarToken)
    const { perfil } = req.user;

    try {
      const pool = await getSqlConnection();

      // Consultar los permisos específicos del perfil en SQL Server
      const result = await pool.request()
        .input('nombrePerfil', perfil)
        .input('nombreMenu', nombreMenu)
        .query(`
          SELECT PM.PUEDE_VER, PM.PUEDE_CREAR, PM.PUEDE_EDITAR, PM.PUEDE_ELIMINAR
          FROM CXC.PERFILES_MENUS PM
          JOIN CXC.PERFILES P ON P.ID_PERFIL = PM.ID_PERFIL
          JOIN CXC.MENUS M ON M.ID_MENU = PM.ID_MENU
          WHERE P.NOMBRE_PERFIL = @nombrePerfil AND M.NOMBRE_MENU = @nombreMenu
        `);

      if (result.recordset.length === 0) {
        return res.status(403).json({ message: `No se encontraron permisos configurados para el perfil ${perfil} en el módulo ${nombreMenu}` });
      }

      const permisos = result.recordset[0];

      // Validar si el permiso solicitado tiene un valor de 1 (Concedido)
      if (permisos[operacion] !== 1 && permisos[operacion] !== true) {
        return res.status(403).json({ 
          message: `Acceso denegado: El perfil ${perfil} carece de permiso para '${operacion}' en el módulo ${nombreMenu}` 
        });
      }

      // Si tiene permiso, permite que la petición continúe al controlador de Oracle
      next();
    } catch (error) {
      console.error(`Error al validar permisos de ${perfil} para ${nombreMenu}:`, error);
      res.status(500).json({ message: 'Error interno al validar autorización' });
    }
  };
};