import express from 'express'
import { getConfiguracion, updateConfiguracion } from '../controllers/configuracionControll.js'

const router = express.Router();

router.get('/', getConfiguracion);
router.put('/:tipo', updateConfiguracion);

export default router;