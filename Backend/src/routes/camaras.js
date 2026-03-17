import express from 'express';
import { capturarTodo } from '../controllers/camarasController.js';
import { requirePermission, optionalAuth } from '../middleware/authMiddleware.js';
import { PERMISSIONS } from '../config/rolesConfig.js';

const router = express.Router();

router.get('/capturar-todo', optionalAuth, requirePermission(PERMISSIONS.CAMARAS_CAPTURE), capturarTodo);

export default router;
