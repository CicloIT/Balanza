import express from 'express';
import { capturarTodo, getConfig } from '../controllers/camarasController.js';
import { requirePermission, optionalAuth } from '../middleware/authMiddleware.js';
import { PERMISSIONS } from '../config/rolesConfig.js';

const router = express.Router();

router.get('/config', optionalAuth, requirePermission(PERMISSIONS.CAMARAS_CAPTURE), getConfig);
router.get('/capturar-todo', optionalAuth, requirePermission(PERMISSIONS.CAMARAS_CAPTURE), capturarTodo);

export default router;
