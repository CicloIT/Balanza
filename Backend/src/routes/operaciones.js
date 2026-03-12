import express from 'express';
import {
    getOperaciones,
    getOperacionAbiertaByPatente,
    closeOperacion
} from '../controllers/operacionesController.js';

const router = express.Router();

router.get('/', getOperaciones);
router.get('/abierta/:patente', getOperacionAbiertaByPatente);
router.post('/:id/cerrar', closeOperacion);

export default router;
