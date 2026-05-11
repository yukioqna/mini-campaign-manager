import request from 'supertest';
import express from 'express';
import authRouter from '../src/routes/auth';
import { errorHandler } from '../src/middleware/errorHandler';

const app = express();
app.use(express.json());
app.use('/auth', authRouter);
app.use(errorHandler);

describe('Auth', () => {
  it('registers a user and returns JWT', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ email: 'alice@example.com', password: 'secret123', name: 'Alice' });

    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('alice@example.com');
    expect(res.body.user.name).toBe('Alice');
  });

  it('logs in with valid credentials', async () => {
    await request(app).post('/auth/register').send({ email: 'bob@example.com', password: 'secret123', name: 'Bob' });
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'bob@example.com', password: 'secret123' });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  it('returns 401 for invalid credentials', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'nobody@example.com', password: 'wrong' });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid email or password');
  });

  it('returns 401 for wrong password', async () => {
    await request(app).post('/auth/register').send({ email: 'wrongpw@example.com', password: 'secret123', name: 'WrongPw' });
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'wrongpw@example.com', password: 'notmypassword' });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid email or password');
  });

  it('rejects duplicate email registration with 409', async () => {
    await request(app).post('/auth/register').send({ email: 'dup@example.com', password: 'secret123', name: 'Dup' });
    const res = await request(app)
      .post('/auth/register')
      .send({ email: 'dup@example.com', password: 'secret123', name: 'Dup2' });
    expect(res.status).toBe(409);
    expect(res.body.error).toBe('Email already in use');
  });

  it('rejects duplicate email case-insensitively', async () => {
    await request(app).post('/auth/register').send({ email: 'case@example.com', password: 'secret123', name: 'Case' });
    const res = await request(app)
      .post('/auth/register')
      .send({ email: 'Case@Example.COM', password: 'secret123', name: 'Case2' });
    expect(res.status).toBe(409);
    expect(res.body.error).toBe('Email already in use');
  });

  it('rejects register with invalid email (400)', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ email: 'notanemail', password: 'secret123', name: 'BadEmail' });
    expect(res.status).toBe(400);
  });

  it('rejects register with missing name (400)', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ email: 'noname@example.com', password: 'secret123' });
    expect(res.status).toBe(400);
  });

  it('rejects register with missing password (400)', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ email: 'nopw@example.com', name: 'NoPw' });
    expect(res.status).toBe(400);
  });

  it('rejects register with short password (400)', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ email: 'shortpw@example.com', password: '12345', name: 'ShortPw' });
    expect(res.status).toBe(400);
  });

  it('protects routes without token', async () => {
    const res = await request(app).get('/auth/me');
    expect(res.status).toBe(401);
  });

  it('accesses protected route with valid token', async () => {
    const { body: { token } } = await request(app)
      .post('/auth/register')
      .send({ email: 'authed@example.com', password: 'secret123', name: 'Authed' });

    const res = await request(app)
      .get('/auth/me')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.email).toBe('authed@example.com');
  });
});
