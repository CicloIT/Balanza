import express from 'express';
import {
  getBalanzas,
  getBalanzaById,
  createBalanza,
  updateBalanza,
  deleteBalanza,
} from '../controllers/balanzasController.js';

const router = express.Router();

router.get('/', getBalanzas);
router.get('/:id', getBalanzaById);
router.post('/', createBalanza);
router.put('/:id', updateBalanza);
router.delete('/:id', deleteBalanza);

export default router;
