import express from 'express';
import { createReporte, getReportes, getReporteById } from '../controllers/reporteController.js';
import { requireAuth, requirePermission, optionalAuth } from '../middleware/authMiddleware.js';
import { PERMISSIONS } from '../config/rolesConfig.js';

const router = express.Router();

router.post('/', requireAuth, requirePermission(PERMISSIONS.REPORTES_CREATE), createReporte);
router.get('/', optionalAuth, requirePermission(PERMISSIONS.REPORTES_VIEW), getReportes);
router.get('/:id', optionalAuth, requirePermission(PERMISSIONS.REPORTES_VIEW), getReporteById);

export default router;