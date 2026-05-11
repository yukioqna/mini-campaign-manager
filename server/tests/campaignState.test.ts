import request from 'supertest';
import express from 'express';
import { errorHandler } from '../src/middleware/errorHandler';
import { User, Recipient, Campaign, CampaignRecipient } from '../src/models';
import campaignsRouter from '../src/routes/campaigns';
import jwt from 'jsonwebtoken';

const app = express();
app.use(express.json());
app.use('/campaigns', campaignsRouter);
app.use(errorHandler);

async function createTestUser(email = 'owner@test.com') {
  return User.create({ email, password_hash: 'pw', name: 'Owner' });
}

function authHeader(userId: string) {
  return { Authorization: `Bearer ${jwt.sign({ userId }, process.env.JWT_SECRET || 'test-secret')}` };
}

describe('Campaign state transitions', () => {
  it('updates draft campaign succeeds', async () => {
    const user = await createTestUser();
    const { body: campaign } = await request(app)
      .post('/campaigns')
      .set(authHeader(user.id))
      .send({ name: 'Test', subject: 'Subject', emails: [{ email: 't1@test.com', name: 'T1' }] });

    const res = await request(app)
      .patch(`/campaigns/${campaign.id}`)
      .set(authHeader(user.id))
      .send({ name: 'Updated Name' });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Updated Name');
  });

  it('deletes draft campaign succeeds', async () => {
    const user = await createTestUser();
    const { body: campaign } = await request(app)
      .post('/campaigns')
      .set(authHeader(user.id))
      .send({ name: 'ToDelete', subject: 'Subject', emails: [{ email: 'td1@test.com', name: 'TD1' }] });

    const res = await request(app)
      .delete(`/campaigns/${campaign.id}`)
      .set(authHeader(user.id));
    expect(res.status).toBe(204);
  });

  it('rejects update on sent campaign', async () => {
    const user = await createTestUser();
    const { body: campaign } = await request(app)
      .post('/campaigns')
      .set(authHeader(user.id))
      .send({ name: 'ToSend', subject: 'Subject', emails: [{ email: 'ts1@test.com', name: 'TS1' }] });

    const { Campaign } = await import('../src/models');
    await Campaign.update({ status: 'sent' }, { where: { id: campaign.id } });

    const res = await request(app)
      .patch(`/campaigns/${campaign.id}`)
      .set(authHeader(user.id))
      .send({ name: 'Hacked' });
    expect(res.status).toBe(409);
  });

  it('rejects schedule with past time', async () => {
    const user = await createTestUser();
    const { body: campaign } = await request(app)
      .post('/campaigns')
      .set(authHeader(user.id))
      .send({ name: 'PastSchedule', subject: 'Subject', emails: [{ email: 'ps1@test.com', name: 'PS1' }] });

    const past = new Date(Date.now() - 3600000).toISOString();
    const res = await request(app)
      .post(`/campaigns/${campaign.id}/schedule`)
      .set(authHeader(user.id))
      .send({ scheduled_at: past });
    expect(res.status).toBe(400);
  });

  it('rejects schedule with invalid datetime format', async () => {
    const user = await createTestUser();
    const { body: campaign } = await request(app)
      .post('/campaigns')
      .set(authHeader(user.id))
      .send({ name: 'BadDate', subject: 'Subject', emails: [{ email: 'bd1@test.com', name: 'BD1' }] });

    const res = await request(app)
      .post(`/campaigns/${campaign.id}/schedule`)
      .set(authHeader(user.id))
      .send({ scheduled_at: 'not-a-date' });
    expect(res.status).toBe(400);
  });

  it('schedules campaign with future time', async () => {
    const user = await createTestUser();
    const { body: campaign } = await request(app)
      .post('/campaigns')
      .set(authHeader(user.id))
      .send({ name: 'FutureSchedule', subject: 'Subject', emails: [{ email: 'fs1@test.com', name: 'FS1' }] });

    const future = new Date(Date.now() + 86400000).toISOString();
    const res = await request(app)
      .post(`/campaigns/${campaign.id}/schedule`)
      .set(authHeader(user.id))
      .send({ scheduled_at: future });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('scheduled');
  });

  it('adds recipients to draft campaign succeeds', async () => {
    const user = await createTestUser();
    const { body: campaign } = await request(app)
      .post('/campaigns')
      .set(authHeader(user.id))
      .send({ name: 'DraftForRecipients', subject: 'Subject', emails: [{ email: 'df1@test.com', name: 'DF1' }] });

    const res = await request(app)
      .post(`/campaigns/${campaign.id}/recipients`)
      .set(authHeader(user.id))
      .send({ emails: [{ email: 'new@test.com', name: 'New Recipient' }] });
    expect(res.status).toBe(201);
    expect(res.body).toHaveLength(2); // 1 existing + 1 new
  });

  it('rejects adding recipients to scheduled campaign', async () => {
    const user = await createTestUser();
    const { body: campaign } = await request(app)
      .post('/campaigns')
      .set(authHeader(user.id))
      .send({ name: 'ScheduledForRecipients', subject: 'Subject', emails: [{ email: 'sr1@test.com', name: 'SR1' }] });

    const future = new Date(Date.now() + 86400000).toISOString();
    await request(app)
      .post(`/campaigns/${campaign.id}/schedule`)
      .set(authHeader(user.id))
      .send({ scheduled_at: future });

    const res = await request(app)
      .post(`/campaigns/${campaign.id}/recipients`)
      .set(authHeader(user.id))
      .send({ emails: [{ email: 'late@test.com', name: 'Late Recipient' }] });
    expect(res.status).toBe(409);
    expect(res.body.error).toContain('draft');
  });

  it('rejects adding recipients to sent campaign', async () => {
    const user = await createTestUser();
    const { body: campaign } = await request(app)
      .post('/campaigns')
      .set(authHeader(user.id))
      .send({ name: 'SentForRecipients', subject: 'Subject', emails: [{ email: 'sfr1@test.com', name: 'SFR1' }] });

    const { Campaign } = await import('../src/models');
    await Campaign.update({ status: 'sent' }, { where: { id: campaign.id } });

    const res = await request(app)
      .post(`/campaigns/${campaign.id}/recipients`)
      .set(authHeader(user.id))
      .send({ emails: [{ email: 'verylate@test.com', name: 'Very Late Recipient' }] });
    expect(res.status).toBe(409);
    expect(res.body.error).toContain('draft');
  });

  it('rejects adding invalid email to campaign (400)', async () => {
    const user = await createTestUser();
    const { body: campaign } = await request(app)
      .post('/campaigns')
      .set(authHeader(user.id))
      .send({ name: 'BadEmailInCampaign', subject: 'Subject', emails: [{ email: 'bei1@test.com', name: 'BEI1' }] });

    const res = await request(app)
      .post(`/campaigns/${campaign.id}/recipients`)
      .set(authHeader(user.id))
      .send({ emails: [{ email: 'not-an-email', name: 'Bad' }] });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Invalid recipient email');
  });

  it('rejects adding duplicate recipient to the same campaign (409)', async () => {
    const user = await createTestUser();
    const { body: campaign } = await request(app)
      .post('/campaigns')
      .set(authHeader(user.id))
      .send({ name: 'DupRecipient', subject: 'Subject', emails: [{ email: 'dup@test.com', name: 'Dup' }] });

    // Add same recipient again
    const res = await request(app)
      .post(`/campaigns/${campaign.id}/recipients`)
      .set(authHeader(user.id))
      .send({ emails: [{ email: 'dup@test.com', name: 'Dup Again' }] });
    expect(res.status).toBe(409);
    expect(res.body.error).toContain('already in campaign');
  });
});

describe('Campaign validation', () => {
  it('rejects create with missing name (400)', async () => {
    const user = await createTestUser();
    const res = await request(app)
      .post('/campaigns')
      .set(authHeader(user.id))
      .send({ subject: 'Subject', emails: [{ email: 'x@y.com', name: 'X' }] });
    expect(res.status).toBe(400);
  });

  it('rejects create with missing subject (400)', async () => {
    const user = await createTestUser();
    const res = await request(app)
      .post('/campaigns')
      .set(authHeader(user.id))
      .send({ name: 'No Subject', emails: [{ email: 'x@y.com', name: 'X' }] });
    expect(res.status).toBe(400);
  });

  it('rejects create with empty recipients array (400)', async () => {
    const user = await createTestUser();
    const res = await request(app)
      .post('/campaigns')
      .set(authHeader(user.id))
      .send({ name: 'NoRecipients', subject: 'Subject', emails: [] });
    expect(res.status).toBe(400);
  });

  it('rejects create with invalid recipient email (400)', async () => {
    const user = await createTestUser();
    const res = await request(app)
      .post('/campaigns')
      .set(authHeader(user.id))
      .send({
        name: 'BadRecipient',
        subject: 'Subject',
        emails: [{ email: 'bad-email', name: 'Bad' }],
      });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Invalid recipient email');
  });

  it('rejects create when any one recipient email is invalid (400)', async () => {
    const user = await createTestUser();
    const res = await request(app)
      .post('/campaigns')
      .set(authHeader(user.id))
      .send({
        name: 'PartialBad',
        subject: 'Subject',
        emails: [
          { email: 'good@example.com', name: 'Good' },
          { email: 'bad-email', name: 'Bad' },
        ],
      });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Invalid recipient email');
  });

  it('deduplicates duplicate emails in create request', async () => {
    const user = await createTestUser();
    const { body: campaign } = await request(app)
      .post('/campaigns')
      .set(authHeader(user.id))
      .send({
        name: 'DupEmails',
        subject: 'Subject',
        emails: [
          { email: 'dedup@test.com', name: 'First' },
          { email: 'dedup@test.com', name: 'Second' },
        ],
      });

    // Fetch the campaign to verify recipients were deduplicated
    const getRes = await request(app)
      .get(`/campaigns/${campaign.id}`)
      .set(authHeader(user.id));
    expect(getRes.body.campaignRecipients).toHaveLength(1);
  });

  it('user cannot access another user\'s campaign (404)', async () => {
    const userA = await createTestUser('usera@test.com');
    const userB = await createTestUser('userb@test.com');

    const { body: campaign } = await request(app)
      .post('/campaigns')
      .set(authHeader(userA.id))
      .send({ name: 'UserACampaign', subject: 'Subject', emails: [{ email: 'ua1@test.com', name: 'UA1' }] });

    const res = await request(app)
      .get(`/campaigns/${campaign.id}`)
      .set(authHeader(userB.id));
    expect(res.status).toBe(404);
  });

  it('user cannot update another user\'s campaign (404)', async () => {
    const userA = await createTestUser('usera2@test.com');
    const userB = await createTestUser('userb2@test.com');

    const { body: campaign } = await request(app)
      .post('/campaigns')
      .set(authHeader(userA.id))
      .send({ name: 'UserACampaign', subject: 'Subject', emails: [{ email: 'ua2@test.com', name: 'UA2' }] });

    const res = await request(app)
      .patch(`/campaigns/${campaign.id}`)
      .set(authHeader(userB.id))
      .send({ name: 'Hacked' });
    expect(res.status).toBe(404);
  });

  it('user cannot delete another user\'s campaign (404)', async () => {
    const userA = await createTestUser('usera3@test.com');
    const userB = await createTestUser('userb3@test.com');

    const { body: campaign } = await request(app)
      .post('/campaigns')
      .set(authHeader(userA.id))
      .send({ name: 'UserACampaign', subject: 'Subject', emails: [{ email: 'ua3@test.com', name: 'UA3' }] });

    const res = await request(app)
      .delete(`/campaigns/${campaign.id}`)
      .set(authHeader(userB.id));
    expect(res.status).toBe(404);
  });

  it('user cannot send another user\'s campaign (404)', async () => {
    const userA = await createTestUser('usera4@test.com');
    const userB = await createTestUser('userb4@test.com');

    const { body: campaign } = await request(app)
      .post('/campaigns')
      .set(authHeader(userA.id))
      .send({ name: 'UserACampaign', subject: 'Subject', emails: [{ email: 'a@b.com', name: 'A' }] });

    const res = await request(app)
      .post(`/campaigns/${campaign.id}/send`)
      .set(authHeader(userB.id));
    expect(res.status).toBe(404);
  });
});
