import { Router } from 'express';
import { getEntradasSalidas, getRecibos } from '../controllers/movimientos.controller.js';
import { verificarToken } from '../middleware/auth.middleware.js';
import { requerirPermiso } from '../middleware/permisos.middleware.js';

const router = Router();
const NOMBRE_MENU = 'Reportes'; // Usamos permisos del menú reportes

router.get('/historial', verificarToken, requerirPermiso(NOMBRE_MENU, 'PUEDE_VER'), getEntradasSalidas);
router.get('/recibos', verificarToken, requerirPermiso(NOMBRE_MENU, 'PUEDE_VER'), getRecibos);

export default router;