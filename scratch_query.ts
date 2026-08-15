import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const all = await prisma.product.count();
  const ws = await prisma.product.count({ where: { isWholesale: true } });
  console.log('Total:', all, 'Wholesale:', ws);
}

main();
