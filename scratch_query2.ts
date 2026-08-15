import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const p = await prisma.product.findFirst({ where: { name: { contains: 'FATIMA' } }, include: { sizes: true } });
  console.log(JSON.stringify(p, null, 2));
}
main();
