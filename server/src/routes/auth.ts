import { Router } from 'express';
import { z } from 'zod';
import { authService } from '../services/AuthService';
import { validate } from '../middleware/validate';
import { authMiddleware } from '../middleware/auth';
import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { User } from '../models';

const router = Router();

const registerSchema = z.object({
  email: z.string().email('Invalid email').max(255, 'Email too long'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(255),
  name: z.string().min(1, 'Name is required').max(255, 'Name too long'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});

router.post('/register', validate(registerSchema), asyncHandler(async (req: Request, res: Response) => {
  const { email, password, name } = req.body;
  const result = await authService.register(email, password, name);
  res.status(201).json(result);
}));

router.post('/login', validate(loginSchema), asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const result = await authService.login(email, password);
  res.json(result);
}));

router.get('/me', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findByPk(req.userId, { attributes: ['id', 'email', 'name'] });
  res.json(user);
}));

export default router;
