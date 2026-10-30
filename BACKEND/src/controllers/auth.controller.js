import { getSqlConnection } from '../config/sqlserver.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

export const login = async (req, res) => {
  const { usuario, password } = req.body;

  try {
    const pool = await getSqlConnection();
    
    // Buscar al usuario y su perfil en SQL Server
    const result = await pool.request()
      .input('usuario', usuario)
      .query(`
        SELECT U.ID_USUARIO, U.NOMBRE, U.APELLIDO, U.USUARIO, U.PASSWORD_HASH, U.ESTADO, P.NOMBRE_PERFIL
        FROM CXC.USUARIOS U
        LEFT JOIN CXC.PERFILES P ON P.ID_PERFIL = U.ID_PERFIL
        WHERE U.USUARIO = @usuario
      `);

    if (result.recordset.length === 0) {
      return res.status(401).json({ message: 'Usuario no encontrado' });
    }

    const user = result.recordset[0];

    // Validar estado (asumiendo que 1 es activo)
    if (user.ESTADO !== true && user.ESTADO !== 1 && user.ESTADO !== '1' && user.ESTADO !== 'Activo') {
      return res.status(403).json({ message: 'Usuario inactivo' });
    }

    // Como tus contraseñas actuales están en texto plano, comparamos directamente
    // Si en el futuro usas bcrypt, aquí usarías bcrypt.compare()
    if (password !== user.PASSWORD_HASH) {
      return res.status(401).json({ message: 'Contraseña incorrecta' });
    }

    // Generar el Token JWT
    const token = jwt.sign(
      { 
        id: user.ID_USUARIO, 
        usuario: user.USUARIO, 
        perfil: user.NOMBRE_PERFIL 
      },
      process.env.JWT_SECRET || 'secreto_universidad_cxc_2025',
      { expiresIn: '8h' }
    );

    res.json({
      message: 'Inicio de sesión exitoso',
      token,
      user: {
        id: user.ID_USUARIO,
        nombre: `${user.NOMBRE} ${user.APELLIDO}`,
        usuario: user.USUARIO,
        perfil: user.NOMBRE_PERFIL
      }
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};