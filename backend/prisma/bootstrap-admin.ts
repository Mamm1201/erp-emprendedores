/**
 * Bootstrap del ÚNICO usuario administrador definitivo del ERP.
 *
 * La contraseña NO se hardcodea: se toma de la variable de entorno
 * ADMIN_PASSWORD que define el operador. El operador la cambia desde la
 * aplicación (Usuarios → Cambiar contraseña) tras el primer ingreso.
 *
 * Uso (el operador define la contraseña temporal):
 *   ADMIN_PASSWORD='TuClaveTemporal' npm run bootstrap:admin
 *
 * Variables:
 *   ADMIN_PASSWORD  (obligatoria) — contraseña temporal inicial
 *   ADMIN_EMAIL     (opcional, default mario@stechnodes.com)
 *   ADMIN_NAME      (opcional, default "Mario Márquez")
 *
 * Efecto: crea/actualiza el admin definitivo y ELIMINA cualquier otro usuario,
 * dejando el sistema con un único administrador.
 */
import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { PrismaClient, UserRole } from '../src/generated/prisma/client';

const BCRYPT_ROUNDS = 12;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function main(): Promise<void> {
  const email = (process.env.ADMIN_EMAIL ?? 'mario@stechnodes.com').trim().toLowerCase();
  const name = process.env.ADMIN_NAME ?? 'Mario Márquez';
  const password = process.env.ADMIN_PASSWORD;

  if (!password || password.length < 8) {
    throw new Error(
      'ADMIN_PASSWORD es obligatoria y debe tener al menos 8 caracteres. ' +
        "Ejecuta:  ADMIN_PASSWORD='TuClaveTemporal' npm run bootstrap:admin",
    );
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  const admin = await prisma.user.upsert({
    where: { email },
    update: { name, role: UserRole.ADMIN, isActive: true, passwordHash },
    create: { email, name, role: UserRole.ADMIN, isActive: true, passwordHash },
  });

  // Deja un único administrador: elimina cualquier otro usuario.
  const removed = await prisma.user.deleteMany({ where: { email: { not: email } } });

  console.log(`✓ Admin definitivo listo: ${admin.email} (rol ${admin.role})`);
  console.log(`✓ Otros usuarios eliminados: ${removed.count}`);
  console.log('→ Ingresa con esa contraseña temporal y cámbiala en Usuarios → Cambiar contraseña.');
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
