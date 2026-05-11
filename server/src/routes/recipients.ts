import { Router } from 'express';
import { z } from 'zod';
import { recipientService } from '../services/RecipientService';
import { authMiddleware } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();
router.use(authMiddleware);

const createSchema = z.object({
  email: z.string().email('Invalid email'),
  name: z.string().min(1, 'Name is required'),
});

// GET /recipients
router.get('/', asyncHandler(async (_req: Request, res: Response) => {
  const recipients = await recipientService.list();
  res.json(recipients);
}));

// POST /recipients
router.post('/', validate(createSchema), asyncHandler(async (req: Request, res: Response) => {
  const { email, name } = req.body;
  const recipient = await recipientService.findOrCreate(email, name);
  res.status(201).json(recipient);
}));

export default router;
