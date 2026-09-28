import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

async function cleanupTestData() {
  console.log('--- Scanning for test data ---');

  // Find test users matching test patterns
  const testUsers = await prisma.user.findMany({
    where: {
      OR: [
        { email: { endsWith: '@somnera.test' } },
        { email: { contains: 'testuser_' } },
        { email: { contains: 'testadmin_' } },
      ],
    },
    select: { id: true, email: true, firstName: true, lastName: true },
  });

  console.log(`Found ${testUsers.length} test user(s):`);
  testUsers.forEach(u => console.log(`  - [${u.id}] ${u.firstName} ${u.lastName} (${u.email})`));

  if (testUsers.length === 0) {
    console.log('No test users found to delete.');
    await prisma.$disconnect();
    return;
  }

  const userIds = testUsers.map(u => u.id);

  // Find test orders
  const testOrders = await prisma.order.findMany({
    where: {
      userId: { in: userIds },
    },
    select: { id: true, totalAmount: true, orderStatus: true, userId: true },
  });

  console.log(`Found ${testOrders.length} test order(s):`);
  testOrders.forEach(o => console.log(`  - Order #${o.id}: Rs ${o.totalAmount} (${o.orderStatus})`));

  // Delete orders first (even though cascade exists, doing it explicitly is safer)
  const deletedOrders = await prisma.order.deleteMany({
    where: {
      userId: { in: userIds },
    },
  });
  console.log(`Deleted ${deletedOrders.count} test order(s).`);

  // Delete test users
  const deletedUsers = await prisma.user.deleteMany({
    where: {
      id: { in: userIds },
    },
  });
  console.log(`Deleted ${deletedUsers.count} test user(s).`);

  console.log('--- Cleanup complete! ---');
  await prisma.$disconnect();
}

cleanupTestData().catch(err => {
  console.error('Error during cleanup:', err);
  prisma.$disconnect();
  process.exit(1);
});
