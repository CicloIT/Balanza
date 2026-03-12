import express from 'express';
import { capturarTodo } from '../controllers/camarasController.js';

const router = express.Router();

router.get('/capturar-todo', capturarTodo);

export default router;
