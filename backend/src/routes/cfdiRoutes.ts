import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { requireRole } from '../middleware/roleMiddleware';
import { getCatalogs, getFiscalConfig, updateFiscalConfig } from '../controllers/cfdiController';

const router = Router();

// Todos los endpoints requieren autenticación
router.use(authMiddleware);

// Catálogos SAT — cualquier rol autenticado puede consultar
router.get('/catalogs', getCatalogs);

// Configuración fiscal — solo admin y finanzas
const adminRoles = ['admin', 'director_general', 'jefe_finanzas', 'jefe_admin'] as const;
router.get('/config', requireRole(...adminRoles), getFiscalConfig);
router.put('/config', requireRole(...adminRoles), updateFiscalConfig);

export default router;
