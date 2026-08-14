import 'dotenv/config';
import prisma from '../src/lib/prisma';

async function main() {
  const products = await prisma.product.findMany({
    where: { name: { contains: "CRUZ" } },
    include: { sizes: true }
  });
  console.log(JSON.stringify(products, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
