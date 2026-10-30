import { Router } from 'express';
import { getAuditoriaClientes, getAuditoriaFacturas } from '../controllers/auditoria.controller.js';
import { verificarToken } from '../middleware/auth.middleware.js';
import { requerirPermiso } from '../middleware/permisos.middleware.js';

const router = Router();
const NOMBRE_MENU = 'Reportes'; 

router.get('/clientes', verificarToken, requerirPermiso(NOMBRE_MENU, 'PUEDE_VER'), getAuditoriaClientes);
router.get('/facturas', verificarToken, requerirPermiso(NOMBRE_MENU, 'PUEDE_VER'), getAuditoriaFacturas);

export default router;