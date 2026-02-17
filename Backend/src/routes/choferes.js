import express from 'express';
import {
  getChoferes,
  getChoferById,
  createChofer,
  updateChofer,
  deleteChofer,
} from '../controllers/choferesController.js';

const router = express.Router();

router.get('/', getChoferes);
router.get('/:id', getChoferById);
router.post('/', createChofer);
router.put('/:id', updateChofer);
router.delete('/:id', deleteChofer);

export default router;
