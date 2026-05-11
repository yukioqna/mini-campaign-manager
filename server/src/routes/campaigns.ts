import { Router } from 'express';
import { z } from 'zod';
import { recipientService } from '../services/RecipientService';
import { campaignService } from '../services/CampaignService';
import { authMiddleware } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { AppError } from '../middleware/errorHandler';
import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();
router.use(authMiddleware);

// email regex: basic format validation
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// UUID v4 validation
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const validateId = (id: string) => {
  if (!UUID_REGEX.test(id)) throw new AppError(400, 'Invalid campaign ID');
};

const createSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name too long'),
  subject: z.string().min(1, 'Subject is required').max(500, 'Subject too long'),
  body: z.string().optional(),
  emails: z
    .array(z.object({ email: z.string().min(1), name: z.string().min(1) }))
    .min(1, 'At least one recipient is required'),
});

const updateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  subject: z.string().min(1).max(500).optional(),
  body: z.string().optional(),
});

const scheduleSchema = z.object({
  scheduled_at: z
    .string()
    .datetime('Invalid ISO 8601 datetime')
    .transform((s) => new Date(s)),
});

const addRecipientsSchema = z.object({
  emails: z
    .array(z.object({ email: z.string().min(1, 'Email is required'), name: z.string().min(1, 'Name is required') }))
    .min(1, 'At least one recipient is required'),
});

function validateEmails(recipients: { email: string; name: string }[]): string[] {
  const invalid: string[] = [];
  for (const r of recipients) {
    const email = r.email.trim().toLowerCase();
    if (!EMAIL_REGEX.test(email)) {
      invalid.push(r.email);
    }
  }
  return invalid;
}

// GET /campaigns
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const campaigns = await campaignService.list(req.userId!);
  res.json(campaigns);
}));

// POST /campaigns
router.post('/', validate(createSchema), asyncHandler(async (req: Request, res: Response) => {
  const { name, subject, body, emails } = req.body as {
    name: string;
    subject: string;
    body?: string;
    emails: { email: string; name: string }[];
  };

  // Validate all email formats before creating anything
  const invalidEmails = validateEmails(emails);
  if (invalidEmails.length > 0) {
    throw new AppError(400, `Invalid recipient email: ${invalidEmails[0]}`);
  }

  // Normalize and dedupe emails
  const seen = new Set<string>();
  const uniqueRecipients: { email: string; name: string }[] = [];
  for (const r of emails) {
    const email = r.email.trim().toLowerCase();
    if (!seen.has(email)) {
      seen.add(email);
      uniqueRecipients.push({ email, name: r.name.trim() });
    }
  }

  const campaign = await campaignService.create(req.userId!, { name: name.trim(), subject: subject.trim(), body: body?.trim() });

  // Attach recipients (if any)
  if (uniqueRecipients.length > 0) {
    const recipientIds: string[] = [];
    for (const r of uniqueRecipients) {
      const rec = await recipientService.findOrCreate(r.email, r.name);
      recipientIds.push(rec.id);
    }
    await recipientService.addToCampaign(campaign.id, recipientIds);
  }

  res.status(201).json(campaign);
}));

// GET /campaigns/:id
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  validateId(req.params.id);
  const campaign = await campaignService.getById(req.params.id, req.userId!);
  res.json(campaign);
}));

// PATCH /campaigns/:id
router.patch('/:id', validate(updateSchema), asyncHandler(async (req: Request, res: Response) => {
  validateId(req.params.id);
  const campaign = await campaignService.update(req.params.id, req.userId!, req.body);
  res.json(campaign);
}));

// DELETE /campaigns/:id
router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  validateId(req.params.id);
  await campaignService.delete(req.params.id, req.userId!);
  res.status(204).send();
}));

// POST /campaigns/:id/schedule
router.post('/:id/schedule', validate(scheduleSchema), asyncHandler(async (req: Request, res: Response) => {
  validateId(req.params.id);
  const scheduledAt = req.body.scheduled_at as Date;
  if (Number.isNaN(scheduledAt.getTime())) {
    throw new AppError(400, 'Invalid date format');
  }
  const campaign = await campaignService.schedule(req.params.id, req.userId!, scheduledAt);
  res.json(campaign);
}));

// POST /campaigns/:id/send
router.post('/:id/send', asyncHandler(async (req: Request, res: Response) => {
  validateId(req.params.id);
  const campaign = await campaignService.send(req.params.id, req.userId!);
  res.json(campaign);
}));

// GET /campaigns/:id/stats
router.get('/:id/stats', asyncHandler(async (req: Request, res: Response) => {
  validateId(req.params.id);
  const stats = await campaignService.stats(req.params.id, req.userId!);
  res.json(stats);
}));

// GET /campaigns/:id/recipients
router.get('/:id/recipients', asyncHandler(async (req: Request, res: Response) => {
  validateId(req.params.id);
  const recipients = await recipientService.listByCampaign(req.params.id);
  res.json(recipients);
}));

// POST /campaigns/:id/recipients
router.post('/:id/recipients', validate(addRecipientsSchema), asyncHandler(async (req: Request, res: Response) => {
  validateId(req.params.id);
  const campaign = await campaignService.getById(req.params.id, req.userId!);
  if (campaign.status !== 'draft') {
    throw new AppError(409, 'Recipients can only be added to draft campaigns');
  }

  const emails = req.body.emails as { email: string; name: string }[];

  // Validate email formats
  const invalidEmails = validateEmails(emails);
  if (invalidEmails.length > 0) {
    throw new AppError(400, `Invalid recipient email: ${invalidEmails[0]}`);
  }

  // Normalize
  const normalized = emails.map((r) => ({
    email: r.email.trim().toLowerCase(),
    name: r.name.trim(),
  }));

  // Find or create recipients
  const recipientIds: string[] = [];
  for (const r of normalized) {
    const rec = await recipientService.findOrCreate(r.email, r.name);
    recipientIds.push(rec.id);
  }

  await recipientService.addToCampaign(req.params.id, recipientIds);
  // Return the full updated recipient list for the campaign
  const recipients = await recipientService.listByCampaign(req.params.id);
  res.status(201).json(recipients);
}));

export default router;
