import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

export const verificarToken = (req, res, next) => {
  // El frontend enviará el token en los "headers" bajo la llave "Authorization"
  const authHeader = req.headers['authorization'];
  
  if (!authHeader) {
    return res.status(403).json({ message: 'No se proporcionó un token de seguridad' });
  }

  // El formato estándar es "Bearer <token>", así que lo separamos
  const token = authHeader.split(' ')[1];

  if (!token) {
    return res.status(403).json({ message: 'Formato de token inválido' });
  }

  try {
    // Verificamos si el token es válido y no ha expirado
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Guardamos los datos del usuario (id, usuario, perfil) en la petición
    // para que el controlador final (ej. crear factura) sepa quién está haciendo la acción
    req.user = decoded;
    
    // Permite que la petición continúe hacia el controlador
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token inválido o expirado' });
  }
};