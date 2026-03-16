import express from 'express';
import { createReporte, getReportes, getReporteById } from '../controllers/reporteController.js';

const router = express.Router();

router.post('/', createReporte);
router.get('/', getReportes);
router.get('/:id', getReporteById);

export default router;