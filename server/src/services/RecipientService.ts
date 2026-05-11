import { Recipient, CampaignRecipient } from '../models';
import { AppError } from '../middleware/errorHandler';

export class RecipientService {
  async list(): Promise<Recipient[]> {
    return Recipient.findAll({ order: [['created_at', 'DESC']] });
  }

  async findOrCreate(email: string, name: string): Promise<Recipient> {
    const normalizedEmail = email.trim().toLowerCase();
    const [recipient] = await Recipient.findOrCreate({
      where: { email: normalizedEmail },
      defaults: { email: normalizedEmail, name: name.trim() },
    });
    return recipient;
  }

  async addToCampaign(campaignId: string, recipientIds: string[]): Promise<CampaignRecipient[]> {
    const existing = await CampaignRecipient.findAll({
      where: { campaign_id: campaignId, recipient_id: recipientIds },
    });
    if (existing.length > 0) {
      const alreadyAttached = await Recipient.findAll({
        where: { id: existing.map((e) => e.recipient_id) },
      });
      const emails = alreadyAttached.map((r) => r.email).join(', ');
      throw new AppError(409, `Recipient already in campaign: ${emails}`);
    }

    const records = recipientIds.map((recipientId) => ({
      campaign_id: campaignId,
      recipient_id: recipientId,
      status: 'pending' as const,
    }));

    return CampaignRecipient.bulkCreate(records);
  }

  async listByCampaign(campaignId: string): Promise<CampaignRecipient[]> {
    return CampaignRecipient.findAll({
      where: { campaign_id: campaignId },
      include: [{ model: Recipient, as: 'recipient' }],
      order: [['created_at', 'DESC']],
    });
  }
}

export const recipientService = new RecipientService();
