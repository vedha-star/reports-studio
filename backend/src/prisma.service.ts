import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as dotenv from 'dotenv';

dotenv.config();

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    const adapter = new PrismaPg({
      connectionString:
        'postgresql://postgres:12345@localhost:5432/navacle_report_studio',
    });
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }
}
