import dotenv from 'dotenv';
import path from 'path';
const envFile = process.env.NODE_ENV === 'test' ? '.env.test' : '.env';
dotenv.config({ path: path.resolve(__dirname, '..', envFile) });

import express from 'express';
import cors from 'cors';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';
import { sequelize } from './models';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use('/api', routes);
app.use(errorHandler);

// Health check — used by Playwright to confirm server is ready
app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.listen(PORT, async () => {
  await sequelize.authenticate();
  console.log(`Server running on http://localhost:${PORT}`);
});

export default app;
