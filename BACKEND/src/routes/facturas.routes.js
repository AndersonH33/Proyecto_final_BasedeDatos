import { Router } from 'express';
import { getFacturas, getFacturaById, createFactura } from '../controllers/facturas.controller.js';
import { verificarToken } from '../middleware/auth.middleware.js';
import { requerirPermiso } from '../middleware/permisos.middleware.js';

const router = Router();
const NOMBRE_MENU = 'Facturas';

// Protegidas por token y permisos de SQL Server
router.get('/', verificarToken, requerirPermiso(NOMBRE_MENU, 'PUEDE_VER'), getFacturas);
router.get('/:id', verificarToken, requerirPermiso(NOMBRE_MENU, 'PUEDE_VER'), getFacturaById);
router.post('/', verificarToken, requerirPermiso(NOMBRE_MENU, 'PUEDE_CREAR'), createFactura);

export default router;