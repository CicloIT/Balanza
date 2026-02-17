import express from 'express';
import {
  getTickets,
  getTicketById,
  getTicketsByEstado,
  createTicket,
  updateTicket,
  closeTicket,
  getTicketsByDateRange,
} from '../controllers/ticketsController.js';

const router = express.Router();

router.get('/', getTickets);
router.get('/estado/:estado', getTicketsByEstado);
router.get('/fecha/rango', getTicketsByDateRange);
router.get('/:id', getTicketById);
router.post('/', createTicket);
router.put('/:id', updateTicket);
router.post('/:id/cerrar', closeTicket);

export default router;
