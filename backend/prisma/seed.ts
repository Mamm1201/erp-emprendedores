import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import {
  DocumentType,
  PrismaClient,
  UserRole,
} from '../src/generated/prisma/client';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter: new PrismaPg(pool),
});

const DOCUMENT_TYPES: DocumentType[] = [
  DocumentType.QUOTATION,
  DocumentType.WORK_ORDER,
  DocumentType.INVOICE,
];

async function main(): Promise<void> {
  const year = new Date().getFullYear();

  await prisma.user.upsert({
    where: { email: 'admin@erp.local' },
    create: {
      email: 'admin@erp.local',
      name: 'Administrador del sistema',
      role: UserRole.ADMIN,
    },
    update: {
      name: 'Administrador del sistema',
      role: UserRole.ADMIN,
      isActive: true,
    },
  });

  for (const docType of DOCUMENT_TYPES) {
    await prisma.documentSequence.upsert({
      where: {
        docType_year: { docType, year },
      },
      create: { docType, year, lastValue: 0 },
      update: {},
    });
  }

  console.log(`Seed OK: admin@erp.local + secuencias ${year}`);
}

main()
  .catch((error: unknown) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
