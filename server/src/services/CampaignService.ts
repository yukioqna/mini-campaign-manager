import { Campaign, CampaignRecipient, User, Recipient } from '../models';
import { AppError } from '../middleware/errorHandler';
import { simulateSend } from '../utils/simulateSend';

export class CampaignService {
  async list(userId: string): Promise<Campaign[]> {
    return Campaign.findAll({
      where: { created_by: userId },
      include: [{ model: User, as: 'creator', attributes: ['id', 'name', 'email'] }],
      order: [['created_at', 'DESC']],
    });
  }

  async create(userId: string, data: { name: string; subject: string; body?: string }): Promise<Campaign> {
    return Campaign.create({ created_by: userId, name: data.name, subject: data.subject, body: data.body ?? null });
  }

  async getById(id: string, userId: string): Promise<Campaign> {
    const campaign = await Campaign.findOne({
      where: { id, created_by: userId },
      include: [
        { model: User, as: 'creator', attributes: ['id', 'name', 'email'] },
        {
          model: CampaignRecipient,
          as: 'campaignRecipients',
          include: [{ model: Recipient, as: 'recipient' }],
        },
      ],
    });
    if (!campaign) throw new AppError(404, 'Campaign not found');
    return campaign;
  }

  async update(id: string, userId: string, data: { name?: string; subject?: string; body?: string }): Promise<Campaign> {
    const campaign = await this.getById(id, userId);
    if (campaign.status !== 'draft') throw new AppError(409, 'Only draft campaigns can be updated');
    await campaign.update({ name: data.name ?? campaign.name, subject: data.subject ?? campaign.subject, body: data.body ?? campaign.body });
    return campaign;
  }

  async delete(id: string, userId: string): Promise<void> {
    const campaign = await this.getById(id, userId);
    if (campaign.status !== 'draft') throw new AppError(409, 'Only draft campaigns can be deleted');
    await campaign.destroy();
  }

  async schedule(id: string, userId: string, scheduledAt: Date): Promise<Campaign> {
    const campaign = await this.getById(id, userId);
    if (campaign.status !== 'draft') throw new AppError(409, 'Only draft campaigns can be scheduled');
    if (scheduledAt <= new Date()) throw new AppError(400, 'Scheduled time must be in the future');
    await campaign.update({ status: 'scheduled', scheduled_at: scheduledAt });
    return campaign;
  }

  async send(id: string, userId: string): Promise<Campaign> {
    const campaign = await Campaign.findOne({ where: { id, created_by: userId } });
    if (!campaign) throw new AppError(404, 'Campaign not found');
    if (campaign.status === 'sent') throw new AppError(409, 'Campaign has already been sent');
    if (campaign.status === 'sending') throw new AppError(409, 'Campaign is already being sent');
    if (campaign.status !== 'draft' && campaign.status !== 'scheduled') {
      throw new AppError(409, 'Campaign can only be sent from draft or scheduled status');
    }

    const recipientCount = await CampaignRecipient.count({ where: { campaign_id: id } });
    if (recipientCount === 0) {
      throw new AppError(400, 'Cannot send a campaign with no recipients');
    }

    await campaign.update({ status: 'sending' });

    // Fire and forget — in production this would be a proper job queue
    simulateSend(id).then(async () => {
      await campaign.update({ status: 'sent', sent_at: new Date() });
    }).catch(async (err) => {
      console.error('simulateSend failed for campaign', id, err);
      await campaign.update({ status: 'draft' }).catch(() => {});
    });

    return campaign;
  }

  async stats(id: string, userId: string): Promise<{ total: number; sent: number; failed: number; opened: number; open_rate: number; send_rate: number }> {
    const campaign = await Campaign.findOne({ where: { id, created_by: userId } });
    if (!campaign) throw new AppError(404, 'Campaign not found');

    const rows = await CampaignRecipient.findAll({ where: { campaign_id: id } });
    const total = rows.length;
    const sent = rows.filter((r) => r.status === 'sent').length;
    const failed = rows.filter((r) => r.status === 'failed').length;
    const opened = rows.filter((r) => r.opened_at !== null).length;
    const open_rate = sent > 0 ? parseFloat((opened / sent).toFixed(4)) : 0;
    const send_rate = total > 0 ? parseFloat((sent / total).toFixed(4)) : 0;

    return { total, sent, failed, opened, open_rate, send_rate };
  }
}

export const campaignService = new CampaignService();
