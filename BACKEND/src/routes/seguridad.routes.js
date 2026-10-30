import { Router } from 'express';
import { getPerfiles, getPermisosMatriz } from '../controllers/seguridad.controller.js';
import { verificarToken } from '../middleware/auth.middleware.js';
import { requerirPermiso } from '../middleware/permisos.middleware.js';

const router = Router();
const NOMBRE_MENU = 'Seguridad';

router.get('/perfiles', verificarToken, requerirPermiso(NOMBRE_MENU, 'PUEDE_VER'), getPerfiles);
router.get('/permisos', verificarToken, requerirPermiso(NOMBRE_MENU, 'PUEDE_VER'), getPermisosMatriz);

export default router;