import { Router } from 'express';
import { runAuthCheck } from '../controllers/authController';

export const authRouter = Router();

authRouter.post('/test', runAuthCheck);
