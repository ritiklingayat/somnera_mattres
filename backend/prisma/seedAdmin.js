import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

async function seedAdmin() {
  const email = (process.env.ADMIN_EMAIL || 'somneramattresses@gmail.com').trim().toLowerCase();
  const rawPassword = process.env.ADMIN_PASSWORD || 'admin';
  const firstName = process.env.ADMIN_FIRST_NAME || 'Somnera@123';
  const lastName = process.env.ADMIN_LAST_NAME || 'Admin';

  console.log('----------------------------------------------------');
  console.log('Seeding Somnera Admin Account...');
  console.log(`Target Email: ${email}`);

  // Securely hash the password with bcrypt (salt rounds = 10)
  const hashedPassword = await bcrypt.hash(rawPassword, 10);

  // Idempotent upsert by email
  const adminUser = await prisma.user.upsert({
    where: { email },
    update: {
      password: hashedPassword,
      role: 'ADMIN',
      status: 'ACTIVE',
      isVerified: true,
      updatedAt: new Date(),
    },
    create: {
      id: 'admin',
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role: 'ADMIN',
      status: 'ACTIVE',
      isVerified: true,
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
      status: true,
      isVerified: true,
      updatedAt: true,
    },
  });

  console.log('✓ Admin account successfully seeded!');
  console.log('----------------------------------------------------');
  console.log(`ID:        ${adminUser.id}`);
  console.log(`Email:     ${adminUser.email}`);
  console.log(`Role:      ${adminUser.role}`);
  console.log(`Status:    ${adminUser.status}`);
  console.log(`Verified:  ${adminUser.isVerified}`);
  console.log('----------------------------------------------------');
  console.log('You can now log in at:');
  console.log('• Frontend Admin Page: http://localhost:5173/#admin');
  console.log(`• Credentials: ${adminUser.email} / (your chosen password)`);
  console.log('----------------------------------------------------');
}

seedAdmin()
  .catch((err) => {
    console.error('Failed to seed admin account:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
