import { CampaignRecipient } from '../models';

export async function simulateSend(campaignId: string): Promise<void> {
  const recipients = await CampaignRecipient.findAll({ where: { campaign_id: campaignId } });

  for (const cr of recipients) {
    await new Promise<void>((resolve) => setTimeout(resolve, 1000 + Math.random() * 2000));

    const isSent = Math.random() < 0.85; // 85% sent, 15% failed
    if (isSent) {
      cr.status = 'sent';
      cr.sent_at = new Date();
      // 60% of sent recipients get opened_at set for demo stats
      if (Math.random() < 0.60) {
        cr.opened_at = new Date(Date.now() + Math.random() * 3600000); // within 1 hour
      }
    } else {
      cr.status = 'failed';
    }
    await cr.save();
  }
}
