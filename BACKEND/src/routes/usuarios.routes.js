import { Router } from 'express';
import { getUsuarios } from '../controllers/usuarios.controller.js';
import { verificarToken } from '../middleware/auth.middleware.js';
import { requerirPermiso } from '../middleware/permisos.middleware.js';

const router = Router();
const NOMBRE_MENU = 'Usuarios';

router.get('/', verificarToken, requerirPermiso(NOMBRE_MENU, 'PUEDE_VER'), getUsuarios);

export default router;