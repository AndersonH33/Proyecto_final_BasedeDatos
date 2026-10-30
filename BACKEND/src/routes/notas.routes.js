import { Router } from 'express';
import { getNotasCredito, createNotaCredito, getNotasAbono, createNotaAbono } from '../controllers/notas.controller.js';
import { verificarToken } from '../middleware/auth.middleware.js';
import { requerirPermiso } from '../middleware/permisos.middleware.js';

const router = Router();

// Notas de Crédito
router.get('/credito', verificarToken, requerirPermiso('Notas de credito', 'PUEDE_VER'), getNotasCredito);
router.post('/credito', verificarToken, requerirPermiso('Notas de credito', 'PUEDE_CREAR'), createNotaCredito);

// Notas de Abono 
router.get('/abono', verificarToken, requerirPermiso('Notas de abono', 'PUEDE_VER'), getNotasAbono);
router.post('/abono', verificarToken, requerirPermiso('Notas de abono', 'PUEDE_CREAR'), createNotaAbono);

export default router;