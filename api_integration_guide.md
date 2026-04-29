# Full-Stack API Integration Guide

This guide explains how to create new APIs in the backend and integrate them into the frontend for the **Navacle Report Studio** project.

## Architecture Overview
- **Backend**: NestJS with Prisma ORM (connected to PostgreSQL).
- **Frontend**: Next.js (App Router) with Axios for API calls.

---

## Part 1: Creating APIs (Backend)

### 1. Update Database Schema
If your new API needs a new table, add it to `backend/prisma/schema.prisma`.

```prisma
// Example: Adding a "Settings" model
model Setting {
  id    String @id @default(uuid())
  key   String @unique
  value String
}
```

Then run:
```bash
npx prisma generate
npx prisma migrate dev --name add-settings
```

### 2. Create the NestJS Module
Create a new folder in `backend/src/` (e.g., `settings`) with three files:

#### A. Service (`settings.service.ts`)
Handles logic and database interaction.
```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.setting.findMany();
  }

  async create(data: { key: string; value: string }) {
    return this.prisma.setting.create({ data });
  }
}
```

#### B. Controller (`settings.controller.ts`)
Defines the HTTP endpoints.
```typescript
import { Controller, Get, Post, Body } from '@nestjs/common';
import { SettingsService } from './settings.service';

@Controller('v1/settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  findAll() {
    return this.settingsService.findAll();
  }

  @Post()
  create(@Body() body: { key: string; value: string }) {
    return this.settingsService.create(body);
  }
}
```

#### C. Module (`settings.module.ts`)
Wires everything together.
```typescript
import { Module } from '@nestjs/common';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';

@Module({
  controllers: [SettingsController],
  providers: [SettingsService],
})
export class SettingsModule {}
```

#### D. Register in App Module
Add `SettingsModule` to the `imports` array in `backend/src/app.module.ts`.

---

## Part 2: Integrating APIs (Frontend)

### 1. The API Client
Reuse the existing client in `frontend/src/lib/api.ts`. It is already configured with the base URL (`http://localhost:3001`).

### 2. Implementation in a Component/Page
Use React hooks to fetch and display data.

```tsx
'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';

export default function SettingsPage() {
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. Fetching Data
  const fetchSettings = async () => {
    try {
      const response = await api.get('/v1/settings');
      setSettings(response.data);
    } catch (error) {
       console.error("Failed to fetch", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // 2. Sending Data (Create)
  const handleAddSetting = async () => {
    await api.post('/v1/settings', { key: 'theme', value: 'dark' });
    fetchSettings(); // Refresh list
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {settings.map(s => <div key={s.id}>{s.key}: {s.value}</div>)}
      <button onClick={handleAddSetting}>Add Setting</button>
    </div>
  );
}
```

---

## Best Practices
1. **Error Handling**: Always wrap API calls in `try/catch` and show user-friendly messages.
2. **Loading States**: Use a `loading` state to prevent empty UI flickers.
3. **DTOs**: In NestJS, use Classes with decorators (like `class-validator`) to validate incoming request bodies.
4. **Environment Variables**: Ensure `baseURL` in `api.ts` is manageable via `.env`.
