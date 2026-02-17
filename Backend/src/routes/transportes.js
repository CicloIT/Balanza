import express from 'express';
import {
  getTransportes,
  getTransporteById,
  createTransporte,
  updateTransporte,
  deleteTransporte,
} from '../controllers/transportesController.js';

const router = express.Router();

router.get('/', getTransportes);
router.get('/:id', getTransporteById);
router.post('/', createTransporte);
router.put('/:id', updateTransporte);
router.delete('/:id', deleteTransporte);

export default router;
