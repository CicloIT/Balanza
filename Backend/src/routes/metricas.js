import { Router } from 'express';
import {
  getMetricasDashboard,
  getMetricasPorFecha,
  getComparativoMensual
} from '../controllers/metricasController.js';

const router = Router();

// GET /api/metricas/dashboard - Métricas completas para el dashboard
router.get('/dashboard', getMetricasDashboard);

// GET /api/metricas/por-fecha - Métricas filtradas por rango de fechas
router.get('/por-fecha', getMetricasPorFecha);

// GET /api/metricas/comparativo-mensual - Comparativo de los últimos 6 meses
router.get('/comparativo-mensual', getComparativoMensual);

export default router;
