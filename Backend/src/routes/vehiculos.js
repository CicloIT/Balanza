import express from 'express';
import {
  getVehiculos,
  getVehiculoById,
  createVehiculo,
  updateVehiculo,
  deleteVehiculo,
} from '../controllers/vehiculosController.js';
import { requireAuth, requirePermission, optionalAuth } from '../middleware/authMiddleware.js';
import { PERMISSIONS } from '../config/rolesConfig.js';

const router = express.Router();

router.get('/', optionalAuth, requirePermission(PERMISSIONS.VEHICULOS_VIEW), getVehiculos);
router.get('/:id', optionalAuth, requirePermission(PERMISSIONS.VEHICULOS_VIEW), getVehiculoById);
router.post('/', requireAuth, requirePermission(PERMISSIONS.VEHICULOS_CREATE), createVehiculo);
router.put('/:id', requireAuth, requirePermission(PERMISSIONS.VEHICULOS_UPDATE), updateVehiculo);
router.delete('/:id', requireAuth, requirePermission(PERMISSIONS.VEHICULOS_DELETE), deleteVehiculo);

export default router;
