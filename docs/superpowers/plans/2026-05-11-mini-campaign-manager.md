# Mini Campaign Manager Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Full-stack Mini Campaign Manager — a MarTech tool for creating, managing, scheduling, sending, and tracking email campaigns.

**Architecture:** Yarn workspace monorepo at root with `/server` (Express + TypeScript + Sequelize + PostgreSQL) and `/client` (React + Vite + TypeScript + Tailwind + React Query + Zustand). Service-layer backend pattern. JWT auth with in-memory Zustand store on frontend.

**Tech Stack:**
- Backend: Express, TypeScript, PostgreSQL, Sequelize (migrations), JWT, zod, Jest
- Frontend: Vite, React 18, TypeScript, Tailwind CSS, React Query (TanStack), Zustand, React Router v6

---

## File Map

### Root files
- `package.json` — yarn workspaces + scripts
- `docker-compose.yml` — PostgreSQL service
- `.env.example` — env var template
- `README.md` — project documentation

### Backend (server/)
```
server/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts              # Express app entry, port binding
│   ├── config/
│   │   └── database.ts       # Sequelize instance from env
│   ├── migrations/
│   │   ├── 001-CreateUsers.ts
│   │   ├── 002-CreateCampaigns.ts
│   │   ├── 003-CreateRecipients.ts
│   │   └── 004-CreateCampaignRecipients.ts
│   ├── models/
│   │   ├── index.ts          # Sequelize init + model associations
│   │   ├── User.ts
│   │   ├── Campaign.ts
│   │   ├── Recipient.ts
│   │   └── CampaignRecipient.ts
│   ├── routes/
│   │   ├── index.ts          # Router aggregator
│   │   ├── auth.ts
│   │   ├── campaigns.ts
│   │   └── recipients.ts
│   ├── services/
│   │   ├── AuthService.ts    # register, login, JWT sign/verify
│   │   ├── CampaignService.ts # CRUD, schedule, send, stats
│   │   └── RecipientService.ts
│   ├── middleware/
│   │   ├── auth.ts           # JWT verification
│   │   ├── errorHandler.ts   # Global error wrapper
│   │   └── validate.ts       # zod middleware factory
│   ├── utils/
│   │   └── simulateSend.ts   # Random sent/failed + opened_at
│   └── types/
│       └── express.ts        # Augment Request with userId
├── tests/
│   ├── auth.test.ts
│   ├── campaignState.test.ts
│   └── campaignSend.test.ts
└── jest.config.js
```

### Frontend (client/)
```
client/
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── index.html
├── src/
│   ├── main.tsx
│   ├── api/
│   │   └── client.ts         # Axios instance + interceptors
│   ├── store/
│   │   └── authStore.ts      # Zustand auth store
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Textarea.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── StatusBadge.tsx
│   │   │   ├── StatCard.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   ├── LoadingSkeleton.tsx
│   │   │   └── ErrorAlert.tsx
│   │   └── layout/
│   │       └── NavHeader.tsx
│   ├── pages/
│   │   ├── LoginPage.tsx
│   │   ├── RegisterPage.tsx
│   │   ├── CampaignsPage.tsx
│   │   ├── NewCampaignPage.tsx
│   │   └── CampaignDetailPage.tsx
│   ├── hooks/
│   │   └── useAuth.ts        # Auth guard hook
│   └── router/
│       └── AppRouter.tsx     # Route definitions with auth guards
```

---

## Task 1: Project Scaffolding (Root + Backend + Frontend)

**Goal:** Create the full directory structure and package.json files for the yarn workspace monorepo.

**Files:**
- Create: `package.json` (root, workspaces config)
- Create: `docker-compose.yml`
- Create: `.env.example`
- Create: `server/package.json`
- Create: `server/tsconfig.json`
- Create: `client/package.json`
- Create: `client/vite.config.ts`
- Create: `client/index.html`
- Create: `client/tailwind.config.js`
- Create: `client/src/vite-env.d.ts`

- [ ] **Step 1: Create root package.json**

```json
{
  "name": "mini-campaign-manager",
  "version": "1.0.0",
  "private": true,
  "workspaces": [
    "server",
    "client"
  ],
  "scripts": {
    "dev": "concurrently \"yarn workspace server dev\" \"yarn workspace client dev\"",
    "build": "yarn workspace server build && yarn workspace client build",
    "test": "yarn workspace server test"
  },
  "devDependencies": {
    "concurrently": "^8.2.0"
  }
}
```

- [ ] **Step 2: Create docker-compose.yml**

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_USER: campaign_user
      POSTGRES_PASSWORD: campaign_password
      POSTGRES_DB: campaign_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
volumes:
  postgres_data:
```

- [ ] **Step 3: Create .env.example**

```
# Server
PORT=3001
NODE_ENV=development
DATABASE_URL=postgresql://campaign_user:campaign_password@localhost:5432/campaign_db
JWT_SECRET=your_jwt_secret_here

# Client
VITE_API_URL=http://localhost:3001
```

- [ ] **Step 4: Create server/package.json**

```json
{
  "name": "server",
  "version": "1.0.0",
  "main": "dist/index.js",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "migrate": "sequelize-cli db:migrate",
    "migrate:undo": "sequelize-cli db:migrate:undo",
    "seed": "sequelize-cli db:seed:all",
    "test": "jest --runInBand"
  },
  "dependencies": {
    "bcrypt": "^5.1.1",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "express": "^4.18.2",
    "jsonwebtoken": "^9.0.2",
    "pg": "^8.11.3",
    "pg-hstore": "^2.3.4",
    "sequelize": "^6.35.2",
    "sequelize-cli": "^6.6.2",
    "zod": "^3.22.4"
  },
  "devDependencies": {
    "@types/bcrypt": "^5.0.2",
    "@types/cors": "^2.8.17",
    "@types/express": "^4.17.21",
    "@types/jest": "^29.5.11",
    "@types/jsonwebtoken": "^9.0.5",
    "@types/node": "^20.10.6",
    "jest": "^29.7.0",
    "ts-jest": "^29.1.1",
    "tsx": "^4.7.0",
    "typescript": "^5.3.3"
  }
}
```

- [ ] **Step 5: Create server/tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 6: Create client/package.json**

```json
{
  "name": "client",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@tanstack/react-query": "^5.17.0",
    "axios": "^1.6.3",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.21.1",
    "zustand": "^4.4.7"
  },
  "devDependencies": {
    "@types/react": "^18.2.46",
    "@types/react-dom": "^18.2.18",
    "@vitejs/plugin-react": "^4.2.1",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.33",
    "tailwindcss": "^3.4.1",
    "typescript": "^5.3.3",
    "vite": "^5.0.10"
  }
}
```

- [ ] **Step 7: Create client/vite.config.ts**

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
});
```

- [ ] **Step 8: Create client/tailwind.config.js**

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
```

- [ ] **Step 9: Create client/index.html**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Campaigns</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 10: Create client/src/vite-env.d.ts**

```ts
/// <reference types="vite/client" />
```

- [ ] **Step 11: Create client/postcss.config.js**

```js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

- [ ] **Step 12: Create client/src/index.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

---

## Task 2: Backend — Config, Models, Migrations

**Goal:** Sequelize setup with all 4 models and their migrations.

**Files:**
- Create: `server/src/config/database.ts`
- Create: `server/.sequelizerc` (Sequelize CLI config)
- Create: `server/src/models/index.ts`
- Create: `server/src/models/User.ts`
- Create: `server/src/models/Campaign.ts`
- Create: `server/src/models/Recipient.ts`
- Create: `server/src/models/CampaignRecipient.ts`
- Create: `server/src/migrations/001-CreateUsers.ts`
- Create: `server/src/migrations/002-CreateCampaigns.ts`
- Create: `server/src/migrations/003-CreateRecipients.ts`
- Create: `server/src/migrations/004-CreateCampaignRecipients.ts`
- Create: `server/src/types/express.ts`

- [ ] **Step 1: Create server/.sequelizerc**

```js
const path = require('path');
module.exports = {
  config: path.resolve('src/config', 'database.json'),
  'migrations-path': path.resolve('src', 'migrations'),
  'models-path': path.resolve('src', 'models'),
  'seeders-path': path.resolve('src', 'seeders'),
};
```

- [ ] **Step 2: Create server/src/config/database.json** (for Sequelize CLI)

```json
{
  "development": {
    "url": "postgresql://campaign_user:campaign_password@localhost:5432/campaign_db",
    "dialect": "postgres",
    "logging": false
  }
}
```

- [ ] **Step 3: Create server/src/config/database.ts** (runtime Sequelize instance)

```ts
import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
dotenv.config();

const sequelize = new Sequelize(process.env.DATABASE_URL!, {
  dialect: 'postgres',
  logging: false,
});

export default sequelize;
```

- [ ] **Step 4: Create server/src/types/express.ts**

```ts
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}
export {};
```

- [ ] **Step 5: Create server/src/migrations/001-CreateUsers.ts**

```ts
'use strict';
import { DataTypes, QueryInterface } from 'sequelize';

export async function up(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.createTable('users', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  });
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.dropTable('users');
}
```

- [ ] **Step 6: Create server/src/migrations/002-CreateCampaigns.ts**

```ts
'use strict';
import { DataTypes, QueryInterface } from 'sequelize';

export async function up(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.createTable('campaigns', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    created_by: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' },
      onDelete: 'CASCADE',
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    subject: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    body: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('draft', 'scheduled', 'sending', 'sent'),
      allowNull: false,
      defaultValue: 'draft',
    },
    scheduled_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    sent_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  });

  await queryInterface.addIndex('campaigns', ['created_by']);
  await queryInterface.addIndex('campaigns', ['status']);
  await queryInterface.addIndex('campaigns', ['created_at']);
  await queryInterface.addIndex('campaigns', ['scheduled_at']);
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.dropTable('campaigns');
}
```

- [ ] **Step 7: Create server/src/migrations/003-CreateRecipients.ts**

```ts
'use strict';
import { DataTypes, QueryInterface } from 'sequelize';

export async function up(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.createTable('recipients', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  });
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.dropTable('recipients');
}
```

- [ ] **Step 8: Create server/src/migrations/004-CreateCampaignRecipients.ts**

```ts
'use strict';
import { DataTypes, QueryInterface } from 'sequelize';

export async function up(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.createTable('campaign_recipients', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    campaign_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'campaigns', key: 'id' },
      onDelete: 'CASCADE',
    },
    recipient_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'recipients', key: 'id' },
      onDelete: 'CASCADE',
    },
    status: {
      type: DataTypes.ENUM('pending', 'sent', 'failed'),
      allowNull: false,
      defaultValue: 'pending',
    },
    sent_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    opened_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  });

  await queryInterface.addIndex('campaign_recipients', ['campaign_id']);
  await queryInterface.addIndex('campaign_recipients', ['recipient_id']);
  await queryInterface.addIndex('campaign_recipients', ['status']);
  await queryInterface.addIndex('campaign_recipients', ['campaign_id', 'recipient_id'], { unique: true });
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.dropTable('campaign_recipients');
}
```

- [ ] **Step 9: Create server/src/models/User.ts**

```ts
import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import bcrypt from 'bcrypt';

interface UserAttributes {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  created_at: Date;
}

class User extends Model<UserAttributes> {
  async checkPassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password_hash);
  }
}

User.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    email: { type: DataTypes.STRING(255), allowNull: false, unique: true },
    password_hash: { type: DataTypes.STRING(255), allowNull: false },
    name: { type: DataTypes.STRING(255), allowNull: false },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  },
  {
    sequelize,
    tableName: 'users',
    underscored: true,
    timestamps: false,
    hooks: {
      beforeCreate: async (user: User) => {
        user.password_hash = await bcrypt.hash(user.password_hash, 10);
      },
    },
  }
);

export default User;
```

- [ ] **Step 10: Create server/src/models/Campaign.ts**

```ts
import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

interface CampaignAttributes {
  id: string;
  created_by: string;
  name: string;
  subject: string;
  body: string | null;
  status: 'draft' | 'scheduled' | 'sending' | 'sent';
  scheduled_at: Date | null;
  sent_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

class Campaign extends Model<CampaignAttributes> {}

Campaign.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    created_by: { type: DataTypes.UUID, allowNull: false },
    name: { type: DataTypes.STRING(255), allowNull: false },
    subject: { type: DataTypes.STRING(500), allowNull: false },
    body: { type: DataTypes.TEXT, allowNull: true },
    status: {
      type: DataTypes.ENUM('draft', 'scheduled', 'sending', 'sent'),
      allowNull: false,
      defaultValue: 'draft',
    },
    scheduled_at: { type: DataTypes.DATE, allowNull: true },
    sent_at: { type: DataTypes.DATE, allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  },
  {
    sequelize,
    tableName: 'campaigns',
    underscored: true,
    timestamps: false,
  }
);

export default Campaign;
```

- [ ] **Step 11: Create server/src/models/Recipient.ts**

```ts
import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

interface RecipientAttributes {
  id: string;
  email: string;
  name: string;
  created_at: Date;
}

class Recipient extends Model<RecipientAttributes> {}

Recipient.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    email: { type: DataTypes.STRING(255), allowNull: false, unique: true },
    name: { type: DataTypes.STRING(255), allowNull: false },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  },
  {
    sequelize,
    tableName: 'recipients',
    underscored: true,
    timestamps: false,
  }
);

export default Recipient;
```

- [ ] **Step 12: Create server/src/models/CampaignRecipient.ts**

```ts
import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

interface CampaignRecipientAttributes {
  id: string;
  campaign_id: string;
  recipient_id: string;
  status: 'pending' | 'sent' | 'failed';
  sent_at: Date | null;
  opened_at: Date | null;
  created_at: Date;
}

class CampaignRecipient extends Model<CampaignRecipientAttributes> {}

CampaignRecipient.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    campaign_id: { type: DataTypes.UUID, allowNull: false },
    recipient_id: { type: DataTypes.UUID, allowNull: false },
    status: {
      type: DataTypes.ENUM('pending', 'sent', 'failed'),
      allowNull: false,
      defaultValue: 'pending',
    },
    sent_at: { type: DataTypes.DATE, allowNull: true },
    opened_at: { type: DataTypes.DATE, allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  },
  {
    sequelize,
    tableName: 'campaign_recipients',
    underscored: true,
    timestamps: false,
  }
);

export default CampaignRecipient;
```

- [ ] **Step 13: Create server/src/models/index.ts**

```ts
import sequelize from '../config/database';
import User from './User';
import Campaign from './Campaign';
import Recipient from './Recipient';
import CampaignRecipient from './CampaignRecipient';

User.hasMany(Campaign, { foreignKey: 'created_by', as: 'campaigns' });
Campaign.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

Campaign.hasMany(CampaignRecipient, { foreignKey: 'campaign_id', as: 'campaignRecipients' });
CampaignRecipient.belongsTo(Campaign, { foreignKey: 'campaign_id', as: 'campaign' });

Recipient.hasMany(CampaignRecipient, { foreignKey: 'recipient_id', as: 'campaignRecipients' });
CampaignRecipient.belongsTo(Recipient, { foreignKey: 'recipient_id', as: 'recipient' });

export { sequelize, User, Campaign, Recipient, CampaignRecipient };
```

---

## Task 3: Backend — Middleware (Auth, Error, Validation)

**Files:**
- Create: `server/src/middleware/auth.ts`
- Create: `server/src/middleware/errorHandler.ts`
- Create: `server/src/middleware/validate.ts`

- [ ] **Step 1: Create server/src/middleware/auth.ts**

```ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ error: 'No token provided' });
    return;
  }
  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    req.userId = payload.userId;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}
```

- [ ] **Step 2: Create server/src/middleware/errorHandler.ts**

```ts
import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  constructor(public statusCode: number, public message: string) {
    super(message);
  }
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
}
```

- [ ] **Step 3: Create server/src/middleware/validate.ts**

```ts
import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ error: result.error.errors[0].message });
      return;
    }
    req.body = result.data;
    next();
  };
}
```

---

## Task 4: Backend — Services

**Files:**
- Create: `server/src/services/AuthService.ts`
- Create: `server/src/services/CampaignService.ts`
- Create: `server/src/services/RecipientService.ts`
- Create: `server/src/utils/simulateSend.ts`

- [ ] **Step 1: Create server/src/utils/simulateSend.ts**

```ts
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
```

- [ ] **Step 2: Create server/src/services/AuthService.ts**

```ts
import jwt from 'jsonwebtoken';
import { User } from '../models';
import { AppError } from '../middleware/errorHandler';

export class AuthService {
  async register(email: string, password: string, name: string): Promise<{ token: string; user: { id: string; email: string; name: string } }> {
    const existing = await User.findOne({ where: { email } });
    if (existing) throw new AppError(400, 'Email already in use');

    const user = await User.create({ email, password_hash: password, name });
    const token = this.signToken(user.id);
    return { token, user: { id: user.id, email: user.email, name: user.name } };
  }

  async login(email: string, password: string): Promise<{ token: string; user: { id: string; email: string; name: string } }> {
    const user = await User.findOne({ where: { email } });
    if (!user || !(await user.checkPassword(password))) {
      throw new AppError(401, 'Invalid credentials');
    }
    const token = this.signToken(user.id);
    return { token, user: { id: user.id, email: user.email, name: user.name } };
  }

  private signToken(userId: string): string {
    return jwt.sign({ userId }, process.env.JWT_SECRET!, { expiresIn: '7d' });
  }
}

export const authService = new AuthService();
```

- [ ] **Step 3: Create server/src/services/RecipientService.ts**

```ts
import { Op } from 'sequelize';
import { Recipient, CampaignRecipient } from '../models';
import { AppError } from '../middleware/errorHandler';

export class RecipientService {
  async list(): Promise<Recipient[]> {
    return Recipient.findAll({ order: [['created_at', 'DESC']] });
  }

  async findOrCreate(email: string, name: string): Promise<Recipient> {
    const [recipient] = await Recipient.findOrCreate({
      where: { email },
      defaults: { email, name },
    });
    return recipient;
  }

  async addToCampaign(campaignId: string, recipientIds: string[]): Promise<CampaignRecipient[]> {
    const records = recipientIds.map((recipientId) => ({
      campaign_id: campaignId,
      recipient_id: recipientId,
      status: 'pending' as const,
    }));

    const results: CampaignRecipient[] = [];
    for (const record of records) {
      const [cr, created] = await CampaignRecipient.findOrCreate({
        where: { campaign_id: record.campaign_id, recipient_id: record.recipient_id },
        defaults: record,
      });
      if (created) results.push(cr);
    }
    return results;
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
```

- [ ] **Step 4: Create server/src/services/CampaignService.ts**

```ts
import { Campaign, CampaignRecipient, User, Recipient } from '../models';
import { AppError } from '../middleware/errorHandler';
import { simulateSend } from '../utils/simulateSend';
import { Op } from 'sequelize';

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
    const campaign = await Campaign.findOne({ where: { id, created_by: userId } });
    if (!campaign) throw new AppError(404, 'Campaign not found');
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

    await campaign.update({ status: 'sending' });

    // Fire and forget — in production this would be a proper job queue
    simulateSend(id).then(async () => {
      await campaign.update({ status: 'sent', sent_at: new Date() });
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
    const send_rate = total > 0 ? parseFloat(((sent + failed) / total).toFixed(4)) : 0;

    return { total, sent, failed, opened, open_rate, send_rate };
  }
}

export const campaignService = new CampaignService();
```

---

## Task 5: Backend — Routes

**Files:**
- Create: `server/src/routes/auth.ts`
- Create: `server/src/routes/campaigns.ts`
- Create: `server/src/routes/recipients.ts`
- Create: `server/src/routes/index.ts`
- Modify: `server/src/index.ts` (app entry)

- [ ] **Step 1: Create server/src/routes/auth.ts**

```ts
import { Router } from 'express';
import { z } from 'zod';
import { authService } from '../services/AuthService';
import { validate } from '../middleware/validate';
import { authMiddleware } from '../middleware/auth';
import { Request, Response } from 'express';

const router = Router();

const registerSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(1, 'Name is required'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});

router.post('/register', validate(registerSchema), async (req: Request, res: Response) => {
  const { email, password, name } = req.body;
  const result = await authService.register(email, password, name);
  res.status(201).json(result);
});

router.post('/login', validate(loginSchema), async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const result = await authService.login(email, password);
  res.json(result);
});

router.get('/me', authMiddleware, async (req: Request, res: Response) => {
  const { User } = require('../models');
  const user = await User.findByPk(req.userId, { attributes: ['id', 'email', 'name'] });
  res.json(user);
});

export default router;
```

- [ ] **Step 2: Create server/src/routes/campaigns.ts**

```ts
import { Router } from 'express';
import { z } from 'zod';
import { campaignService } from '../services/CampaignService';
import { recipientService } from '../services/RecipientService';
import { authMiddleware } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { Request, Response } from 'express';

const router = Router();
router.use(authMiddleware);

const createSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  subject: z.string().min(1, 'Subject is required').max(500),
  body: z.string().optional(),
});

const updateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  subject: z.string().min(1).max(500).optional(),
  body: z.string().optional(),
});

const scheduleSchema = z.object({
  scheduled_at: z.string().datetime('Invalid ISO 8601 datetime').transform((s) => new Date(s)),
});

const addRecipientsSchema = z.object({
  emails: z.array(z.object({ email: z.string().email(), name: z.string().min(1) })),
});

// GET /campaigns
router.get('/', async (req: Request, res: Response) => {
  const campaigns = await campaignService.list(req.userId!);
  res.json(campaigns);
});

// POST /campaigns
router.post('/', validate(createSchema), async (req: Request, res: Response) => {
  const campaign = await campaignService.create(req.userId!, req.body);
  res.status(201).json(campaign);
});

// GET /campaigns/:id
router.get('/:id', async (req: Request, res: Response) => {
  const campaign = await campaignService.getById(req.params.id, req.userId!);
  res.json(campaign);
});

// PATCH /campaigns/:id
router.patch('/:id', validate(updateSchema), async (req: Request, res: Response) => {
  const campaign = await campaignService.update(req.params.id, req.userId!, req.body);
  res.json(campaign);
});

// DELETE /campaigns/:id
router.delete('/:id', async (req: Request, res: Response) => {
  await campaignService.delete(req.params.id, req.userId!);
  res.status(204).send();
});

// POST /campaigns/:id/schedule
router.post('/:id/schedule', validate(scheduleSchema), async (req: Request, res: Response) => {
  const campaign = await campaignService.schedule(req.params.id, req.userId!, req.body.scheduled_at);
  res.json(campaign);
});

// POST /campaigns/:id/send
router.post('/:id/send', async (req: Request, res: Response) => {
  const campaign = await campaignService.send(req.params.id, req.userId!);
  res.json(campaign);
});

// GET /campaigns/:id/stats
router.get('/:id/stats', async (req: Request, res: Response) => {
  const stats = await campaignService.stats(req.params.id, req.userId!);
  res.json(stats);
});

// GET /campaigns/:id/recipients
router.get('/:id/recipients', async (req: Request, res: Response) => {
  const recipients = await recipientService.listByCampaign(req.params.id);
  res.json(recipients);
});

// POST /campaigns/:id/recipients
router.post('/:id/recipients', validate(addRecipientsSchema), async (req: Request, res: Response) => {
  const { emails } = req.body;
  const recipientIds: string[] = [];
  for (const { email, name } of emails) {
    const r = await recipientService.findOrCreate(email, name);
    recipientIds.push(r.id);
  }
  const crs = await recipientService.addToCampaign(req.params.id, recipientIds);
  res.status(201).json(crs);
});

export default router;
```

- [ ] **Step 3: Create server/src/routes/recipients.ts**

```ts
import { Router } from 'express';
import { z } from 'zod';
import { recipientService } from '../services/RecipientService';
import { authMiddleware } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { Request, Response } from 'express';

const router = Router();
router.use(authMiddleware);

const createSchema = z.object({
  email: z.string().email('Invalid email'),
  name: z.string().min(1, 'Name is required'),
});

// GET /recipients
router.get('/', async (_req: Request, res: Response) => {
  const recipients = await recipientService.list();
  res.json(recipients);
});

// POST /recipients
router.post('/', validate(createSchema), async (req: Request, res: Response) => {
  const { email, name } = req.body;
  const recipient = await recipientService.findOrCreate(email, name);
  res.status(201).json(recipient);
});

// POST /recipient (alias)
router.post('/recipient', validate(createSchema), async (req: Request, res: Response) => {
  const { email, name } = req.body;
  const recipient = await recipientService.findOrCreate(email, name);
  res.status(201).json(recipient);
});

export default router;
```

- [ ] **Step 4: Create server/src/routes/index.ts**

```ts
import { Router } from 'express';
import authRouter from './auth';
import campaignsRouter from './campaigns';
import recipientsRouter from './recipients';

const router = Router();
router.use('/auth', authRouter);
router.use('/campaigns', campaignsRouter);
router.use('/recipients', recipientsRouter);

export default router;
```

- [ ] **Step 5: Create server/src/index.ts**

```ts
import 'dotenv/config';
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

app.listen(PORT, async () => {
  await sequelize.sync();
  console.log(`Server running on http://localhost:${PORT}`);
});

export default app;
```

---

## Task 6: Backend — Jest Tests

**Files:**
- Create: `server/jest.config.js`
- Create: `server/tests/auth.test.ts`
- Create: `server/tests/campaignState.test.ts`
- Create: `server/tests/campaignSend.test.ts`

- [ ] **Step 1: Create server/jest.config.js**

```js
/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  forceExit: true,
};
```

- [ ] **Step 2: Create server/tests/setup.ts**

```ts
import { sequelize } from '../src/models';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.test' });

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

afterEach(async () => {
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  await sequelize.close();
});
```

- [ ] **Step 3: Create server/tests/auth.test.ts**

```ts
import request from 'supertest';
import express from 'express';
import authRouter from '../src/routes/auth';
import { errorHandler } from '../src/middleware/errorHandler';
import { sequelize, User } from '../src/models';

const app = express();
app.use(express.json());
app.use('/auth', authRouter);
app.use(errorHandler);

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

afterEach(async () => {
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  await sequelize.close();
});

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
  });

  it('rejects duplicate email registration', async () => {
    await request(app).post('/auth/register').send({ email: 'dup@example.com', password: 'secret123', name: 'Dup' });
    const res = await request(app)
      .post('/auth/register')
      .send({ email: 'dup@example.com', password: 'secret123', name: 'Dup2' });
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
```

- [ ] **Step 4: Create server/tests/campaignState.test.ts**

```ts
import request from 'supertest';
import express from 'express';
import { Router } from 'express';
import { errorHandler } from '../src/middleware/errorHandler';
import { sequelize, User, Campaign, CampaignRecipient } from '../src/models';
import jwt from 'jsonwebtoken';

const app = express();
app.use(express.json());

async function createTestUser() {
  const user = await User.create({ email: 'owner@test.com', password_hash: 'password', name: 'Owner' });
  return user;
}

function authHeader(userId: string) {
  return { Authorization: `Bearer ${jwt.sign({ userId }, process.env.JWT_SECRET!)}` };
}

beforeAll(async () => {
  await sequelize.sync({ force: true });
});
afterEach(async () => {
  await sequelize.sync({ force: true });
});
afterAll(async () => {
  await sequelize.close();
});

describe('Campaign state transitions', () => {
  it('updates draft campaign succeeds', async () => {
    const user = await createTestUser();
    const { body: { id } } = await request(app)
      .post('/campaigns')
      .set(authHeader(user.id))
      .send({ name: 'Test', subject: 'Subject' });

    const res = await request(app)
      .patch(`/campaigns/${id}`)
      .set(authHeader(user.id))
      .send({ name: 'Updated Name' });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Updated Name');
  });

  it('deletes draft campaign succeeds', async () => {
    const user = await createTestUser();
    const { body: { id } } = await request(app)
      .post('/campaigns')
      .set(authHeader(user.id))
      .send({ name: 'ToDelete', subject: 'Subject' });

    const res = await request(app)
      .delete(`/campaigns/${id}`)
      .set(authHeader(user.id));
    expect(res.status).toBe(204);
  });

  it('rejects update on non-draft campaign', async () => {
    const user = await createTestUser();
    const { body: { id } } = await request(app)
      .post('/campaigns')
      .set(authHeader(user.id))
      .send({ name: 'ToUpdate', subject: 'Subject' });

    await request(app).post(`/campaigns/${id}/send`).set(authHeader(user.id));

    // Poll briefly to allow async send to complete
    await new Promise(r => setTimeout(r, 4000));

    const res = await request(app)
      .patch(`/campaigns/${id}`)
      .set(authHeader(user.id))
      .send({ name: 'Hacked' });
    expect(res.status).toBe(409);
  });

  it('rejects schedule with past time', async () => {
    const user = await createTestUser();
    const { body: { id } } = await request(app)
      .post('/campaigns')
      .set(authHeader(user.id))
      .send({ name: 'PastSchedule', subject: 'Subject' });

    const past = new Date(Date.now() - 3600000).toISOString();
    const res = await request(app)
      .post(`/campaigns/${id}/schedule`)
      .set(authHeader(user.id))
      .send({ scheduled_at: past });
    expect(res.status).toBe(400);
  });

  it('schedules campaign with future time', async () => {
    const user = await createTestUser();
    const { body: { id } } = await request(app)
      .post('/campaigns')
      .set(authHeader(user.id))
      .send({ name: 'FutureSchedule', subject: 'Subject' });

    const future = new Date(Date.now() + 86400000).toISOString();
    const res = await request(app)
      .post(`/campaigns/${id}/schedule`)
      .set(authHeader(user.id))
      .send({ scheduled_at: future });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('scheduled');
  });
});
```

- [ ] **Step 5: Create server/tests/campaignSend.test.ts**

```ts
import request from 'supertest';
import express from 'express';
import { errorHandler } from '../src/middleware/errorHandler';
import { sequelize, User, Campaign, Recipient, CampaignRecipient } from '../src/models';
import jwt from 'jsonwebtoken';

const app = express();
app.use(express.json());

async function createTestUser() {
  return User.create({ email: 'sender@test.com', password_hash: 'pw', name: 'Sender' });
}

function authHeader(userId: string) {
  return { Authorization: `Bearer ${jwt.sign({ userId }, process.env.JWT_SECRET!)}` };
}

beforeAll(async () => { await sequelize.sync({ force: true }); });
afterEach(async () => { await sequelize.sync({ force: true }); });
afterAll(async () => { await sequelize.close(); });

describe('Campaign send + stats', () => {
  it('sends campaign and calculates stats correctly', async () => {
    const user = await createTestUser();

    // Create campaign
    const { body: { id: campaignId } } = await request(app)
      .post('/campaigns')
      .set(authHeader(user.id))
      .send({ name: 'SendTest', subject: 'Hello' });

    // Add 10 recipients
    const recipientIds: string[] = [];
    for (let i = 0; i < 10; i++) {
      const r = await Recipient.create({ email: `r${i}@test.com`, name: `R${i}` });
      recipientIds.push(r.id);
    }
    await CampaignRecipient.bulkCreate(
      recipientIds.map((rid) => ({ campaign_id: campaignId, recipient_id: rid, status: 'pending' }))
    );

    // Send
    await request(app).post(`/campaigns/${campaignId}/send`).set(authHeader(user.id));

    // Wait for simulated send to complete (max 3s delay + buffer)
    await new Promise(r => setTimeout(r, 5000));

    // Check stats
    const statsRes = await request(app)
      .get(`/campaigns/${campaignId}/stats`)
      .set(authHeader(user.id));

    expect(statsRes.status).toBe(200);
    expect(statsRes.body.total).toBe(10);
    expect(statsRes.body.sent + statsRes.body.failed).toBe(10);
    expect(statsRes.body.sent).toBeGreaterThanOrEqual(0);
    expect(statsRes.body.failed).toBeGreaterThanOrEqual(0);
    expect(statsRes.body.open_rate).toBeGreaterThanOrEqual(0);
    expect(statsRes.body.send_rate).toBeGreaterThanOrEqual(0);
  });

  it('cannot send same campaign twice', async () => {
    const user = await createTestUser();
    const { body: { id: campaignId } } = await request(app)
      .post('/campaigns')
      .set(authHeader(user.id))
      .send({ name: 'Twice', subject: 'Test' });

    const r = await Recipient.create({ email: 'twice@test.com', name: 'Twice' });
    await CampaignRecipient.create({ campaign_id: campaignId, recipient_id: r.id, status: 'pending' });

    await request(app).post(`/campaigns/${campaignId}/send`).set(authHeader(user.id));
    await new Promise(r2 => setTimeout(r2, 4000));

    const res = await request(app)
      .post(`/campaigns/${campaignId}/send`)
      .set(authHeader(user.id));
    expect(res.status).toBe(409);
  });
});
```

**Note on supertest:** Add `supertest` to server devDependencies:
```json
"supertest": "^6.3.3",
"@types/supertest": "^6.0.2"
```

---

## Task 7: Frontend — Entry, API Client, Store

**Files:**
- Create: `client/src/main.tsx`
- Create: `client/src/index.css`
- Create: `client/src/api/client.ts`
- Create: `client/src/store/authStore.ts`

- [ ] **Step 1: Create client/src/main.tsx**

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,
      refetchOnWindowFocus: true,
      retry: 2,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
```

- [ ] **Step 2: Create client/src/App.tsx**

```tsx
import { AppRouter } from './router/AppRouter';

export default function App() {
  return <AppRouter />;
}
```

- [ ] **Step 3: Create client/src/api/client.ts**

```tsx
import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const client = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

client.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default client;

// Auth API
export const authApi = {
  register: (data: { email: string; password: string; name: string }) =>
    client.post<{ token: string; user: { id: string; email: string; name: string } }>('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    client.post<{ token: string; user: { id: string; email: string; name: string } }>('/auth/login', data),
};

// Campaign API
export const campaignApi = {
  list: () => client.get('/campaigns'),
  create: (data: { name: string; subject: string; body?: string }) => client.post('/campaigns', data),
  get: (id: string) => client.get(`/campaigns/${id}`),
  update: (id: string, data: { name?: string; subject?: string; body?: string }) =>
    client.patch(`/campaigns/${id}`, data),
  delete: (id: string) => client.delete(`/campaigns/${id}`),
  schedule: (id: string, scheduledAt: string) =>
    client.post(`/campaigns/${id}/schedule`, { scheduled_at: scheduledAt }),
  send: (id: string) => client.post(`/campaigns/${id}/send`),
  stats: (id: string) =>
    client.get<{ total: number; sent: number; failed: number; opened: number; open_rate: number; send_rate: number }>(
      `/campaigns/${id}/stats`
    ),
  addRecipients: (id: string, emails: { email: string; name: string }[]) =>
    client.post(`/campaigns/${id}/recipients`, { emails }),
  listRecipients: (id: string) => client.get(`/campaigns/${id}/recipients`),
};

// Recipient API
export const recipientApi = {
  list: () => client.get('/recipients'),
  create: (data: { email: string; name: string }) => client.post('/recipients', data),
};
```

- [ ] **Step 4: Create client/src/store/authStore.ts**

```tsx
import { create } from 'zustand';
import { authApi } from '../api/client';

interface AuthUser {
  id: string;
  email: string;
  name: string;
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  isAuthenticated: false,

  login: async (email: string, password: string) => {
    const { data } = await authApi.login({ email, password });
    set({ token: data.token, user: data.user, isAuthenticated: true });
  },

  register: async (email: string, password: string, name: string) => {
    const { data } = await authApi.register({ email, password, name });
    set({ token: data.token, user: data.user, isAuthenticated: true });
  },

  logout: () => {
    set({ token: null, user: null, isAuthenticated: false });
  },
}));
```

---

## Task 8: Frontend — UI Components

**Files:**
- Create: `client/src/components/ui/Button.tsx`
- Create: `client/src/components/ui/Input.tsx`
- Create: `client/src/components/ui/Textarea.tsx`
- Create: `client/src/components/ui/Card.tsx`
- Create: `client/src/components/ui/Modal.tsx`
- Create: `client/src/components/ui/StatusBadge.tsx`
- Create: `client/src/components/ui/StatCard.tsx`
- Create: `client/src/components/ui/EmptyState.tsx`
- Create: `client/src/components/ui/LoadingSkeleton.tsx`
- Create: `client/src/components/ui/ErrorAlert.tsx`
- Create: `client/src/components/layout/NavHeader.tsx`

- [ ] **Step 1: Create client/src/components/ui/Button.tsx**

```tsx
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md';
  loading?: boolean;
  children: React.ReactNode;
}

export function Button({ variant = 'primary', size = 'md', loading, disabled, children, className = '', ...props }: ButtonProps) {
  const base = 'inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed';
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50',
    danger: 'bg-red-600 text-white hover:bg-red-700',
  };
  const sizes = {
    sm: 'h-8 px-3 text-sm gap-1.5',
    md: 'h-10 px-4 text-sm gap-2',
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  );
}
```

- [ ] **Step 2: Create client/src/components/ui/Input.tsx**

```tsx
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, id, className = '', ...props }: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-slate-700">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full h-10 px-3 border rounded-md text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-50 disabled:cursor-not-allowed ${error ? 'border-red-500' : 'border-slate-300'} ${className}`}
        {...props}
      />
      {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
    </div>
  );
}
```

- [ ] **Step 3: Create client/src/components/ui/Textarea.tsx**

```tsx
import React from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Textarea({ label, error, id, className = '', ...props }: TextareaProps) {
  const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={textareaId} className="block text-sm font-medium text-slate-700">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <textarea
        id={textareaId}
        className={`w-full px-3 py-2 border rounded-md text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${error ? 'border-red-500' : 'border-slate-300'} ${className}`}
        {...props}
      />
      {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
    </div>
  );
}
```

- [ ] **Step 4: Create client/src/components/ui/Card.tsx**

```tsx
import React from 'react';

export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white border border-slate-200 rounded-lg shadow-sm ${className}`}>
      {children}
    </div>
  );
}

export function CardBody({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`p-6 ${className}`}>{children}</div>;
}
```

- [ ] **Step 5: Create client/src/components/ui/Modal.tsx**

```tsx
import React, { useEffect } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (open) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-lg max-w-md w-full mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">&times;</button>
        </div>
        {children}
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Create client/src/components/ui/StatusBadge.tsx**

```tsx
import React from 'react';

type CampaignStatus = 'draft' | 'scheduled' | 'sending' | 'sent';
type RecipientStatus = 'pending' | 'sent' | 'failed';

type Status = CampaignStatus | RecipientStatus;

const styles: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-700',
  scheduled: 'bg-blue-100 text-blue-700',
  sending: 'bg-amber-100 text-amber-700',
  sent: 'bg-emerald-100 text-emerald-700',
  pending: 'bg-slate-100 text-slate-600',
  failed: 'bg-red-100 text-red-700',
  opened: 'bg-emerald-50 text-emerald-700',
};

const labels: Record<string, string> = {
  draft: 'Draft',
  scheduled: 'Scheduled',
  sending: 'Sending',
  sent: 'Sent',
  pending: 'Pending',
  failed: 'Failed',
  opened: 'Opened',
};

interface StatusBadgeProps {
  status: Status;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium ${styles[status] || styles.draft}`}>
      {labels[status] || status}
    </span>
  );
}
```

- [ ] **Step 7: Create client/src/components/ui/StatCard.tsx**

```tsx
import React from 'react';

export function StatCard({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 text-center">
      <div className="text-xl font-semibold text-slate-900">{value}</div>
      <div className="text-xs text-slate-500 mt-0.5">{label}</div>
    </div>
  );
}
```

- [ ] **Step 8: Create client/src/components/ui/EmptyState.tsx**

```tsx
import React from 'react';
import { Button } from './Button';

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <svg className="w-12 h-12 text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
      <h3 className="text-lg font-semibold text-slate-900 mb-1">{title}</h3>
      <p className="text-sm text-slate-500 mb-4 max-w-sm">{description}</p>
      {actionLabel && onAction && <Button onClick={onAction}>{actionLabel}</Button>}
    </div>
  );
}
```

- [ ] **Step 9: Create client/src/components/ui/LoadingSkeleton.tsx**

```tsx
import React from 'react';

export function LoadingSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 items-center p-4 bg-white border border-slate-200 rounded-lg">
          <div className="h-4 bg-slate-200 rounded animate-pulse w-1/4" />
          <div className="h-4 bg-slate-200 rounded animate-pulse w-1/3" />
          <div className="h-4 bg-slate-200 rounded animate-pulse w-16 ml-auto" />
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 10: Create client/src/components/ui/ErrorAlert.tsx**

```tsx
import React from 'react';
import { Button } from './Button';

export function ErrorAlert({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-lg" role="alert">
      <div className="flex items-center gap-2 text-red-800 text-sm">
        <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
        {message}
      </div>
      {onRetry && <Button size="sm" variant="secondary" onClick={onRetry}>Retry</Button>}
    </div>
  );
}
```

- [ ] **Step 11: Create client/src/components/layout/NavHeader.tsx**

```tsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

export function NavHeader() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 z-40">
      <div className="max-w-6xl mx-auto h-full px-6 flex items-center justify-between">
        <Link to="/campaigns" className="text-lg font-semibold text-slate-900">
          Campaigns
        </Link>
        {user && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-medium">
              {initials}
            </div>
            <span className="text-sm text-slate-600 hidden sm:block">{user.name}</span>
            <button onClick={handleLogout} className="text-sm text-slate-500 hover:text-slate-700">
              Log out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
```

---

## Task 9: Frontend — Pages

**Files:**
- Create: `client/src/pages/LoginPage.tsx`
- Create: `client/src/pages/RegisterPage.tsx`
- Create: `client/src/pages/CampaignsPage.tsx`
- Create: `client/src/pages/NewCampaignPage.tsx`
- Create: `client/src/pages/CampaignDetailPage.tsx`

- [ ] **Step 1: Create client/src/pages/LoginPage.tsx**

```tsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Card, CardBody } from '../components/ui/Card';
import { ErrorAlert } from '../components/ui/ErrorAlert';

export function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/campaigns');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardBody className="space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-slate-900">Campaigns</h1>
            <p className="text-slate-500 mt-1">Sign in to continue</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <ErrorAlert message={error} />}
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
            <Button type="submit" loading={loading} className="w-full">
              Sign In
            </Button>
          </form>
          <p className="text-center text-sm text-slate-500">
            Don't have an account?{' '}
            <Link to="/register" className="text-blue-600 hover:text-blue-700 font-medium">
              Create one
            </Link>
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
```

- [ ] **Step 2: Create client/src/pages/RegisterPage.tsx**

```tsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Card, CardBody } from '../components/ui/Card';
import { ErrorAlert } from '../components/ui/ErrorAlert';

export function RegisterPage() {
  const navigate = useNavigate();
  const register = useAuthStore((s) => s.register);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(email, password, name);
      navigate('/campaigns');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardBody className="space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-slate-900">Campaigns</h1>
            <p className="text-slate-500 mt-1">Create your account</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <ErrorAlert message={error} />}
            <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" />
            <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
            <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="new-password" />
            <Button type="submit" loading={loading} className="w-full">Create Account</Button>
          </form>
          <p className="text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">Sign in</Link>
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
```

- [ ] **Step 3: Create client/src/pages/CampaignsPage.tsx**

```tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { campaignApi } from '../api/client';
import { NavHeader } from '../components/layout/NavHeader';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/StatusBadge';
import { EmptyState } from '../components/ui/EmptyState';
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton';
import { ErrorAlert } from '../components/ui/ErrorAlert';
import { Modal } from '../components/ui/Modal';

export function CampaignsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const { data: campaigns, isLoading, error, refetch } = useQuery({
    queryKey: ['campaigns'],
    queryFn: async () => {
      const res = await campaignApi.list();
      return res.data as any[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => campaignApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      setDeleteTarget(null);
    },
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <NavHeader />
      <main className="max-w-6xl mx-auto px-6 pt-24 pb-12">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Campaigns</h1>
          <Button onClick={() => navigate('/campaigns/new')}>+ New Campaign</Button>
        </div>

        {isLoading && <LoadingSkeleton rows={5} />}
        {error && <ErrorAlert message="Failed to load campaigns" onRetry={refetch} />}

        {!isLoading && !error && campaigns?.length === 0 && (
          <EmptyState
            title="No campaigns yet"
            description="Create your first campaign to start sending emails to your audience."
            actionLabel="Create Campaign"
            onAction={() => navigate('/campaigns/new')}
          />
        )}

        {!isLoading && !error && campaigns && campaigns.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Name</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide hidden md:table-cell">Subject</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide hidden sm:table-cell">Open Rate</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c: any) => (
                  <tr
                    key={c.id}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/campaigns/${c.id}`)}
                  >
                    <td className="px-4 py-4 font-medium text-slate-900">{c.name}</td>
                    <td className="px-4 py-4 text-sm text-slate-500 hidden md:table-cell truncate max-w-xs">{c.subject}</td>
                    <td className="px-4 py-4"><StatusBadge status={c.status} /></td>
                    <td className="px-4 py-4 text-sm text-slate-500 hidden sm:table-cell">
                      {c.status === 'sent' ? '—' : '—'}
                    </td>
                    <td className="px-4 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      {c.status === 'draft' && (
                        <button
                          onClick={() => setDeleteTarget({ id: c.id, name: c.name })}
                          className="text-slate-400 hover:text-red-600 transition-colors"
                          aria-label="Delete campaign"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Campaign"
      >
        <p className="text-sm text-slate-600 mb-4">
          Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? This cannot be undone.
        </p>
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button
            variant="danger"
            loading={deleteMutation.isPending}
            onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
          >
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
}
```

- [ ] **Step 4: Create client/src/pages/NewCampaignPage.tsx**

```tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { campaignApi } from '../api/client';
import { NavHeader } from '../components/layout/NavHeader';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Button } from '../components/ui/Button';
import { ErrorAlert } from '../components/ui/ErrorAlert';

export function NewCampaignPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [recipientEmails, setRecipientEmails] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createMutation = useMutation({
    mutationFn: () => campaignApi.create({ name, subject, body }),
    onSuccess: async (res) => {
      const campaignId = res.data.id;
      // Parse and add recipients
      const lines = recipientEmails.split('\n').filter((l) => l.trim());
      if (lines.length > 0) {
        const emailEntries = lines.map((line) => {
          const [email, ...rest] = line.trim().split(',');
          const name = rest.join(',').trim() || email.trim().split('@')[0];
          return { email: email.trim(), name };
        }).filter((e) => e.email);
        if (emailEntries.length > 0) {
          await campaignApi.addRecipients(campaignId, emailEntries);
        }
      }
      navigate(`/campaigns/${campaignId}`);
    },
  });

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Campaign name is required';
    if (!subject.trim()) errs.subject = 'Subject is required';
    const lines = recipientEmails.split('\n').filter((l) => l.trim());
    if (lines.length === 0) errs.recipients = 'At least one recipient is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    createMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <NavHeader />
      <main className="max-w-2xl mx-auto px-6 pt-24 pb-12">
        <button onClick={() => navigate('/campaigns')} className="text-sm text-slate-500 hover:text-slate-700 mb-6 flex items-center gap-1">
          ← Back to Campaigns
        </button>

        <h1 className="text-2xl font-bold text-slate-900 mb-8">New Campaign</h1>

        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {createMutation.error && (
              <ErrorAlert message={(createMutation.error as any).response?.data?.error || 'Failed to create campaign'} />
            )}

            <Input
              label="Campaign Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={errors.name}
              required
              maxLength={255}
              placeholder="Summer Sale 2026"
            />

            <Input
              label="Email Subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              error={errors.subject}
              required
              maxLength={500}
              placeholder="Don't miss our summer deals!"
            />

            <Textarea
              label="Email Body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={6}
              placeholder="Write your email content here..."
            />

            <Textarea
              label="Recipients"
              value={recipientEmails}
              onChange={(e) => setRecipientEmails(e.target.value)}
              error={errors.recipients}
              required
              rows={5}
              placeholder={`alice@example.com, Alice\nbob@example.com, Bob\ncarlos@example.com`}
            />
            <p className="text-xs text-slate-500 -mt-4">
              One email per line. Format: <code className="bg-slate-100 px-1 rounded">email,name</code> or just <code className="bg-slate-100 px-1 rounded">email</code>
            </p>

            <div className="flex gap-3 justify-end pt-2">
              <Button variant="secondary" type="button" onClick={() => navigate('/campaigns')}>Cancel</Button>
              <Button type="submit" loading={createMutation.isPending}>Save Campaign</Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
```

- [ ] **Step 5: Create client/src/pages/CampaignDetailPage.tsx**

```tsx
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { campaignApi, recipientApi } from '../api/client';
import { NavHeader } from '../components/layout/NavHeader';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Card, CardBody } from '../components/ui/Card';
import { StatusBadge } from '../components/ui/StatusBadge';
import { StatCard } from '../components/ui/StatCard';
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton';
import { ErrorAlert } from '../components/ui/ErrorAlert';
import { Modal } from '../components/ui/Modal';
import { EmptyState } from '../components/ui/EmptyState';

export function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [showEdit, setShowEdit] = useState(false);
  const [editName, setEditName] = useState('');
  const [editSubject, setEditSubject] = useState('');
  const [editBody, setEditBody] = useState('');
  const [showSendConfirm, setShowSendConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [newRecipientEmail, setNewRecipientEmail] = useState('');
  const [newRecipientName, setNewRecipientName] = useState('');
  const [addError, setAddError] = useState('');

  const { data: campaign, isLoading, error, refetch } = useQuery({
    queryKey: ['campaign', id],
    queryFn: async () => {
      const res = await campaignApi.get(id!);
      return res.data as any;
    },
  });

  const { data: stats } = useQuery({
    queryKey: ['campaignStats', id],
    queryFn: async () => {
      const res = await campaignApi.stats(id!);
      return res.data;
    },
    enabled: campaign?.status === 'sent',
  });

  const scheduleMutation = useMutation({
    mutationFn: () => campaignApi.schedule(id!, new Date(scheduleDate).toISOString()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign', id] });
      setShowSchedule(false);
      setScheduleDate('');
    },
  });

  const sendMutation = useMutation({
    mutationFn: () => campaignApi.send(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign', id] });
      setShowSendConfirm(false);
      // Poll for completion
      const interval = setInterval(async () => {
        const res = await campaignApi.get(id!);
        if (res.data.status === 'sent') {
          clearInterval(interval);
          queryClient.invalidateQueries({ queryKey: ['campaign', id] });
        }
      }, 2000);
    },
  });

  const updateMutation = useMutation({
    mutationFn: () => campaignApi.update(id!, { name: editName, subject: editSubject, body: editBody }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign', id] });
      setShowEdit(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => campaignApi.delete(id!),
    onSuccess: () => navigate('/campaigns'),
  });

  const addRecipientMutation = useMutation({
    mutationFn: async () => {
      const email = newRecipientEmail.trim();
      const name = newRecipientName.trim() || email.split('@')[0];
      await recipientApi.create({ email, name });
      await campaignApi.addRecipients(id!, [{ email, name }]);
    },
    onSuccess: () => {
      setNewRecipientEmail('');
      setNewRecipientName('');
      setAddError('');
      queryClient.invalidateQueries({ queryKey: ['campaign', id] });
    },
    onError: (err: any) => setAddError(err.response?.data?.error || 'Failed to add recipient'),
  });

  const canEdit = campaign?.status === 'draft';
  const canDelete = campaign?.status === 'draft';
  const canSchedule = campaign?.status === 'draft';
  const canSend = campaign?.status !== 'sent';

  if (isLoading) return <div className="min-h-screen bg-slate-50"><NavHeader /><div className="pt-24 max-w-6xl mx-auto px-6"><LoadingSkeleton rows={3} /></div></div>;
  if (error) return <div className="min-h-screen bg-slate-50"><NavHeader /><div className="pt-24 max-w-6xl mx-auto px-6"><ErrorAlert message="Failed to load campaign" onRetry={refetch} /></div></div>;
  if (!campaign) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      <NavHeader />
      <main className="max-w-6xl mx-auto px-6 pt-24 pb-12">
        {/* Header */}
        <div className="mb-6">
          <button onClick={() => navigate('/campaigns')} className="text-sm text-slate-500 hover:text-slate-700 mb-2 flex items-center gap-1">
            ← Back to Campaigns
          </button>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{campaign.name}</h1>
              <p className="text-slate-500 mt-0.5">{campaign.subject}</p>
            </div>
            <StatusBadge status={campaign.status} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left column */}
          <div className="space-y-6">
            {/* Stats */}
            {campaign.status === 'sent' && stats && (
              <div className="grid grid-cols-3 gap-3">
                <StatCard value={stats.total} label="Total" />
                <StatCard value={stats.sent} label="Sent" />
                <StatCard value={stats.failed} label="Failed" />
                <StatCard value={stats.opened} label="Opened" />
                <StatCard value={`${(stats.open_rate * 100).toFixed(1)}%`} label="Open Rate" />
                <StatCard value={`${(stats.send_rate * 100).toFixed(1)}%`} label="Send Rate" />
              </div>
            )}

            {/* Action buttons */}
            <Card>
              <CardBody className="space-y-3">
                {campaign.status === 'sent' && campaign.sent_at && (
                  <p className="text-sm text-slate-500">Sent on {new Date(campaign.sent_at).toLocaleString()}</p>
                )}
                <div className="flex flex-wrap gap-2">
                  {canEdit && (
                    <Button size="sm" variant="secondary" onClick={() => { setEditName(campaign.name); setEditSubject(campaign.subject); setEditBody(campaign.body || ''); setShowEdit(true); }}>
                      Edit
                    </Button>
                  )}
                  {canSchedule && (
                    <Button size="sm" variant="secondary" onClick={() => setShowSchedule(true)}>
                      Schedule
                    </Button>
                  )}
                  {canSend && (
                    <Button size="sm" onClick={() => setShowSendConfirm(true)} loading={sendMutation.isPending}>
                      {campaign.status === 'scheduled' ? 'Send Now' : 'Send'}
                    </Button>
                  )}
                  {canDelete && (
                    <Button size="sm" variant="danger" onClick={() => setShowDeleteConfirm(true)}>
                      Delete
                    </Button>
                  )}
                </div>
              </CardBody>
            </Card>

            {/* Edit form */}
            {showEdit && (
              <Card>
                <CardBody className="space-y-4">
                  <h3 className="font-semibold text-slate-900">Edit Campaign</h3>
                  <Input label="Name" value={editName} onChange={(e) => setEditName(e.target.value)} />
                  <Input label="Subject" value={editSubject} onChange={(e) => setEditSubject(e.target.value)} />
                  <Textarea label="Body" value={editBody} onChange={(e) => setEditBody(e.target.value)} rows={4} />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => updateMutation.mutate()} loading={updateMutation.isPending}>Save</Button>
                    <Button size="sm" variant="secondary" onClick={() => setShowEdit(false)}>Cancel</Button>
                  </div>
                  {updateMutation.error && <ErrorAlert message="Failed to update" />}
                </CardBody>
              </Card>
            )}
          </div>

          {/* Right column — Recipients */}
          <div className="space-y-6">
            <Card>
              <CardBody className="space-y-4">
                <h3 className="font-semibold text-slate-900">Recipients</h3>

                {/* Add single recipient */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Email"
                    value={newRecipientEmail}
                    onChange={(e) => setNewRecipientEmail(e.target.value)}
                    className="flex-1"
                  />
                  <Input
                    placeholder="Name (optional)"
                    value={newRecipientName}
                    onChange={(e) => setNewRecipientName(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    size="sm"
                    onClick={() => addRecipientEmail.trim() && addRecipientMutation.mutate()}
                    loading={addRecipientMutation.isPending}
                  >
                    Add
                  </Button>
                </div>
                {addError && <ErrorAlert message={addError} />}

                {/* Recipient list */}
                {campaign.campaignRecipients?.length > 0 ? (
                  <div className="divide-y divide-slate-100">
                    {campaign.campaignRecipients.map((cr: any) => (
                      <div key={cr.id} className="flex items-center justify-between py-2">
                        <div>
                          <div className="text-sm font-medium text-slate-900">{cr.recipient?.name}</div>
                          <div className="text-xs text-slate-500">{cr.recipient?.email}</div>
                        </div>
                        <StatusBadge status={cr.status} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 text-center py-4">No recipients added yet</p>
                )}
              </CardBody>
            </Card>
          </div>
        </div>
      </main>

      {/* Schedule Modal */}
      <Modal open={showSchedule} onClose={() => setShowSchedule(false)} title="Schedule Campaign">
        <div className="space-y-4">
          <Input
            label="Date and Time"
            type="datetime-local"
            value={scheduleDate}
            onChange={(e) => setScheduleDate(e.target.value)}
            min={new Date().toISOString().slice(0, 16)}
          />
          {scheduleMutation.error && <ErrorAlert message="Failed to schedule" />}
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setShowSchedule(false)}>Cancel</Button>
            <Button onClick={() => scheduleMutation.mutate()} loading={scheduleMutation.isPending}>Schedule</Button>
          </div>
        </div>
      </Modal>

      {/* Send Confirm */}
      <Modal open={showSendConfirm} onClose={() => setShowSendConfirm(false)} title="Send Campaign">
        <p className="text-sm text-slate-600 mb-4">
          Send this campaign to {campaign.campaignRecipients?.length || 0} recipients? This cannot be undone.
        </p>
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={() => setShowSendConfirm(false)}>Cancel</Button>
          <Button onClick={() => sendMutation.mutate()} loading={sendMutation.isPending}>Send</Button>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <Modal open={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} title="Delete Campaign">
        <p className="text-sm text-slate-600 mb-4">
          Are you sure you want to delete <strong>{campaign.name}</strong>? This cannot be undone.
        </p>
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
          <Button variant="danger" onClick={() => deleteMutation.mutate()} loading={deleteMutation.isPending}>Delete</Button>
        </div>
      </Modal>
    </div>
  );
}
```

---

## Task 10: Frontend — Router + Auth Guard

**Files:**
- Create: `client/src/router/AppRouter.tsx`
- Create: `client/src/hooks/useAuth.ts`

- [ ] **Step 1: Create client/src/hooks/useAuth.ts**

```tsx
import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export function useAuthGuard() {
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isAuthenticated && location.pathname !== '/login' && location.pathname !== '/register') {
      navigate('/login');
    }
  }, [isAuthenticated, navigate, location.pathname]);
}
```

- [ ] **Step 2: Create client/src/router/AppRouter.tsx**

```tsx
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useAuthGuard } from '../hooks/useAuth';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { CampaignsPage } from '../pages/CampaignsPage';
import { NewCampaignPage } from '../pages/NewCampaignPage';
import { CampaignDetailPage } from '../pages/CampaignDetailPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  useAuthGuard();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return isAuthenticated ? <Navigate to="/campaigns" replace /> : <>{children}</>;
}

export function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
      <Route path="/campaigns" element={<ProtectedRoute><CampaignsPage /></ProtectedRoute>} />
      <Route path="/campaigns/new" element={<ProtectedRoute><NewCampaignPage /></ProtectedRoute>} />
      <Route path="/campaigns/:id" element={<ProtectedRoute><CampaignDetailPage /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/campaigns" replace />} />
    </Routes>
  );
}
```

---

## Task 11: README.md

**Files:**
- Create: `README.md`

- [ ] **Step 1: Create README.md**

```markdown
# Mini Campaign Manager

A simplified MarTech tool for creating, managing, scheduling, sending, and tracking email campaigns.

## Tech Stack

- **Backend:** Express + TypeScript, PostgreSQL, Sequelize, JWT, zod
- **Frontend:** React 18 + TypeScript, Vite, Tailwind CSS, React Query, Zustand
- **Monorepo:** Yarn workspaces

---

## Local Setup

### Prerequisites

- Node.js 18+
- Yarn
- Docker (for PostgreSQL)

### 1. Start PostgreSQL

```bash
docker compose up -d
```

### 2. Install dependencies

```bash
yarn install
```

### 3. Configure environment

```bash
cp .env.example .env
# Edit .env — set JWT_SECRET to a random string
```

### 4. Run migrations

```bash
yarn workspace server migrate
```

### 5. Start development servers

```bash
yarn dev
```

- Backend: http://localhost:3001
- Frontend: http://localhost:5173

---

## API Overview

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | /api/auth/register | Register user |
| POST | /api/auth/login | Login |

### Campaigns
| Method | Endpoint | Description |
|---|---|---|
| GET | /api/campaigns | List campaigns |
| POST | /api/campaigns | Create campaign |
| GET | /api/campaigns/:id | Get campaign details |
| PATCH | /api/campaigns/:id | Update campaign (draft only) |
| DELETE | /api/campaigns/:id | Delete campaign (draft only) |
| POST | /api/campaigns/:id/schedule | Schedule campaign |
| POST | /api/campaigns/:id/send | Send campaign |
| GET | /api/campaigns/:id/stats | Get campaign stats |

### Recipients
| Method | Endpoint | Description |
|---|---|---|
| GET | /api/recipients | List all recipients |
| POST | /api/recipients | Create recipient |

### Stats Response
```json
{
  "total": 100,
  "sent": 70,
  "failed": 10,
  "opened": 45,
  "open_rate": 0.6429,
  "send_rate": 0.80
}
```

---

## Frontend Routes

| Path | Page | Auth |
|---|---|---|
| /login | Login | Public |
| /register | Register | Public |
| /campaigns | Campaign list | Required |
| /campaigns/new | Create campaign | Required |
| /campaigns/:id | Campaign detail | Required |

---

## Test Commands

```bash
yarn workspace server test
```

---

## Walkthrough

1. Register a new account at `/register`
2. Log in at `/login`
3. Click **New Campaign** to create a campaign
4. Add recipient email addresses (one per line)
5. Click **Save Campaign** — you land on the campaign detail page
6. Add more recipients using the form on the right
7. Click **Send** — the campaign enters `sending` state and transitions to `sent` within a few seconds
8. View stats: open rate, send rate, sent/failed counts

---

## How I Used Claude Code

This project was built entirely through an AI-assisted workflow using Claude Code and the Superpowers agentic development framework.

**Workflow:**

1. **Brainstorming** — Used the `superpowers:brainstorming` skill to clarify requirements. Explored scope, tracking granularity, sending simulation strategy, state management, and project structure. Every design decision was validated by the user before proceeding.

2. **Design** — Two documents were created: `CHALLENGE_REQUIREMENTS.md` (backend schema, API, state rules, testing, Docker setup) and `DESIGN.md` (frontend UI design with wireframes, component inventory, color system, interaction details).

3. **Planning** — Used the `superpowers:writing-plans` skill to decompose the implementation into bite-sized, testable tasks. Each task has explicit file paths, complete code, expected command outputs, and commit messages.

4. **Implementation** — Used the `superpowers:subagent-driven-development` skill to dispatch independent agents per task with two-stage review between tasks.

**Key decisions made during brainstorming:**
- Simulated sending only (no real SMTP) to keep scope achievable
- In-memory JWT via Zustand (not localStorage) for the MVP
- Service-layer backend pattern for testability
- Stats computed from CampaignRecipient rows at read time (no pre-aggregation)
```
