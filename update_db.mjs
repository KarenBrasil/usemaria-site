import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const updatedProducts = await prisma.product.updateMany({
    data: {
      price: 54.90,
      wholesalePrice: 34.90
    }
  });
  console.log(`Updated ${updatedProducts.count} products.`);

  const updatedSettings = await prisma.storeSettings.update({
    where: { id: 'default' },
    data: {
      pixKey: '04107666310',
      pixName: 'Anny Talyta de Oliveira Santos'
    }
  });
  console.log('Updated store settings.');
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect()
  })
