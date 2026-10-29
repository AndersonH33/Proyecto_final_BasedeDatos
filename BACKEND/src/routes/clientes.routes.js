import { Router } from 'express';
import { 
  getClientes, 
  getClienteById, 
  createCliente, 
  updateCliente,
  desactivarCliente
} from '../controllers/clientes.controller.js';
import { verificarToken } from '../middleware/auth.middleware.js';
import { requerirPermiso } from '../middleware/permisos.middleware.js';

const router = Router();

// Todas protegidas por el token de sesión
// Asumimos que en la tabla CXC.MENUS de SQL Server existe un menú llamado 'Clientes'
const NOMBRE_MENU = 'Clientes';

// Consultas (Read) - Requieren PUEDE_VER
router.get('/', verificarToken, requerirPermiso(NOMBRE_MENU, 'PUEDE_VER'), getClientes);
router.get('/:id', verificarToken, requerirPermiso(NOMBRE_MENU, 'PUEDE_VER'), getClienteById);

// Creación (Create) - Requiere PUEDE_CREAR
router.post('/', verificarToken, requerirPermiso(NOMBRE_MENU, 'PUEDE_CREAR'), createCliente);

// Actualización (Update) - Requiere PUEDE_EDITAR
router.put('/:id', verificarToken, requerirPermiso(NOMBRE_MENU, 'PUEDE_EDITAR'), updateCliente);

// Desactivación (Delete lógico) - Requiere PUEDE_ELIMINAR
router.patch('/:id/estado', verificarToken, requerirPermiso(NOMBRE_MENU, 'PUEDE_ELIMINAR'), desactivarCliente);

export default router;