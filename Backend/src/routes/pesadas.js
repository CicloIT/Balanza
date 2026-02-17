import express from 'express';
import {
  getPesadas,
  getPesadasByTicket,
  getPesadaById,
  createPesada,
  updatePesada,
  deletePesada,
  getPesadasAgrupadas,
} from '../controllers/pesadasController.js';

const router = express.Router();

router.get('/', getPesadas);
router.get('/agrupadas', getPesadasAgrupadas);
router.get('/ticket/:ticketId', getPesadasByTicket);
router.get('/:id', getPesadaById);
router.post('/', createPesada);
router.put('/:id', updatePesada);
router.delete('/:id', deletePesada);

export default router;
