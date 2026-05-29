import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Injectable()
export class AppService {
  constructor(private readonly prisma: PrismaService) {}

  getHello(): string {
    return 'ERP Emprendedores API';
  }

  async getHealth() {
    const [userCount, sequenceCount] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.documentSequence.count(),
    ]);

    return {
      status: 'ok',
      database: 'connected',
      users: userCount,
      documentSequences: sequenceCount,
    };
  }
}
