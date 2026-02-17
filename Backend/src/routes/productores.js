import express from 'express';
import {
  getProductores,
  getProductorById,
  createProductor,
  updateProductor,
  deleteProductor,
} from '../controllers/productoresController.js';

const router = express.Router();

router.get('/', getProductores);
router.get('/:id', getProductorById);
router.post('/', createProductor);
router.put('/:id', updateProductor);
router.delete('/:id', deleteProductor);

export default router;
