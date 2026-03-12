import express from 'express';
import {
    getProvincias,
    createProvincia,
    updateProvincia,
    deleteProvincia
} from '../controllers/provinciasController.js';

const router = express.Router();

router.get('/', getProvincias);
router.post('/', createProvincia);
router.put('/:id', updateProvincia);
router.delete('/:id', deleteProvincia);

export default router;
