import { Router } from 'express';
import { 
  getSaldosPendientes, 
  getAntiguedadSaldos, 
  getEstadoCuentaCliente 
} from '../controllers/cuentasCobrar.controller.js';
import { verificarToken } from '../middleware/auth.middleware.js';
import { requerirPermiso } from '../middleware/permisos.middleware.js';

const router = Router();
const NOMBRE_MENU = 'Cuentas por cobrar'; // Coincide con SQL Server

// Rutas analíticas (todas requieren permiso de solo lectura 'PUEDE_VER')
router.get('/pendientes', verificarToken, requerirPermiso(NOMBRE_MENU, 'PUEDE_VER'), getSaldosPendientes);
router.get('/antiguedad', verificarToken, requerirPermiso(NOMBRE_MENU, 'PUEDE_VER'), getAntiguedadSaldos);
router.get('/estado-cuenta/:id_cliente', verificarToken, requerirPermiso(NOMBRE_MENU, 'PUEDE_VER'), getEstadoCuentaCliente);

export default router;