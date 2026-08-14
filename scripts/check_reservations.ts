import 'dotenv/config';
import prisma from '../src/lib/prisma';

async function main() {
  const r = await prisma.reservation.findMany({
    include: { productSize: { include: { product: true } } }
  });
  console.log(JSON.stringify(r, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
