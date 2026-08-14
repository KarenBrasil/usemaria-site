import 'dotenv/config';
import prisma from '../src/lib/prisma';

async function main() {
  const result = await prisma.product.updateMany({
    where: {
      name: {
        startsWith: 'Nova Peça'
      }
    },
    data: {
      isDraft: true
    }
  });

  console.log(`Atualizados ${result.count} produtos para Rascunho.`);
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
