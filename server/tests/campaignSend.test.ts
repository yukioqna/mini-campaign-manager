import request from 'supertest';
import express from 'express';
import { errorHandler } from '../src/middleware/errorHandler';
import { User, Recipient, CampaignRecipient } from '../src/models';
import campaignsRouter from '../src/routes/campaigns';
import jwt from 'jsonwebtoken';

const app = express();
app.use(express.json());
app.use('/campaigns', campaignsRouter);
app.use(errorHandler);

async function createTestUser() {
  return User.create({ email: 'sender@test.com', password_hash: 'pw', name: 'Sender' });
}

function authHeader(userId: string) {
  return { Authorization: `Bearer ${jwt.sign({ userId }, process.env.JWT_SECRET || 'test-secret')}` };
}

describe('Campaign send + stats', () => {
  it('sends campaign and calculates stats correctly', async () => {
    const user = await createTestUser();

    // Create campaign with one recipient so validation passes
    const { body: campaign } = await request(app)
      .post('/campaigns')
      .set(authHeader(user.id))
      .send({ name: 'SendTest', subject: 'Hello', emails: [{ email: 'placeholder@test.com', name: 'Placeholder' }] });

    // Add 10 more recipients directly via models (faster than API)
    const recipientIds: string[] = [];
    for (let i = 0; i < 10; i++) {
      const r = await Recipient.create({ email: `r${i}@test.com`, name: `R${i}` });
      recipientIds.push(r.id);
    }
    await CampaignRecipient.bulkCreate(
      recipientIds.map((rid) => ({ campaign_id: campaign.id, recipient_id: rid, status: 'pending' as const }))
    );

    // Trigger send
    const sendRes = await request(app)
      .post(`/campaigns/${campaign.id}/send`)
      .set(authHeader(user.id));
    expect(sendRes.status).toBe(200);

    // Wait for simulateSend to finish (up to ~30s for 10 recipients at 1-3s each)
    let stats: { total: number; sent: number; failed: number; opened: number; open_rate: number; send_rate: number } | null = null;
    for (let attempt = 0; attempt < 12; attempt++) {
      await new Promise(r => setTimeout(r, 5000));
      const statsRes = await request(app)
        .get(`/campaigns/${campaign.id}/stats`)
        .set(authHeader(user.id));
      if (statsRes.body.sent + statsRes.body.failed === 11) {
        stats = statsRes.body;
        break;
      }
    }

    expect(stats).not.toBeNull();
    expect(stats!.total).toBe(11);
    expect(stats!.sent + stats!.failed).toBe(11);
    expect(stats!.open_rate).toBeGreaterThanOrEqual(0);
    // send_rate = sent/total; open_rate = opened/sent
    expect(stats!.send_rate).toBeLessThanOrEqual(1);
    expect(stats!.send_rate).toBeCloseTo(stats!.sent / stats!.total, 4);
  }, 90000);

  it('cannot send same campaign twice', async () => {
    const user = await createTestUser();
    const { body: campaign } = await request(app)
      .post('/campaigns')
      .set(authHeader(user.id))
      .send({ name: 'Twice', subject: 'Test', emails: [{ email: 'twice@test.com', name: 'Twice' }] });

    await request(app).post(`/campaigns/${campaign.id}/send`).set(authHeader(user.id));

    // Wait for send to complete
    await new Promise(r2 => setTimeout(r2, 8000));

    const res = await request(app)
      .post(`/campaigns/${campaign.id}/send`)
      .set(authHeader(user.id));
    expect(res.status).toBe(409);
  }, 30000);

  it('cannot send campaign with zero recipients (400)', async () => {
    const user = await createTestUser();
    const { body: campaign } = await request(app)
      .post('/campaigns')
      .set(authHeader(user.id))
      .send({ name: 'NoRecipients', subject: 'Test', emails: [{ email: 'temp@test.com', name: 'Temp' }] });

    // Remove all recipients via direct DB access to simulate a zero-recipient state
    await CampaignRecipient.destroy({ where: { campaign_id: campaign.id } });

    const res = await request(app)
      .post(`/campaigns/${campaign.id}/send`)
      .set(authHeader(user.id));
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('no recipients');
  });
});
