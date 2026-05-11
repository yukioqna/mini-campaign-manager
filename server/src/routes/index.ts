import { Router } from 'express';
import { z } from 'zod';
import authRouter from './auth';
import campaignsRouter from './campaigns';
import recipientsRouter from './recipients';
import { recipientService } from '../services/RecipientService';
import { authMiddleware } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();
router.use('/auth', authRouter);
router.use('/campaigns', campaignsRouter);
router.use('/recipients', recipientsRouter);

// POST /recipient — top-level alias required by challenge spec (resolves to POST /api/recipient)
const recipientCreateSchema = z.object({
  email: z.string().email('Invalid email'),
  name: z.string().min(1, 'Name is required'),
});
router.post('/recipient', authMiddleware, validate(recipientCreateSchema), asyncHandler(async (req, res) => {
  const { email, name } = req.body;
  const recipient = await recipientService.findOrCreate(email, name);
  res.status(201).json(recipient);
}));

export default router;
