import express from 'express';
import {
    getLocalidades,
    createLocalidad,
    updateLocalidad,
    deleteLocalidad
} from '../controllers/localidadesController.js';

const router = express.Router();

router.get('/', getLocalidades);
router.post('/', createLocalidad);
router.put('/:id', updateLocalidad);
router.delete('/:id', deleteLocalidad);

export default router;
