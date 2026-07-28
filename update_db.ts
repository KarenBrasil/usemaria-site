import 'dotenv/config';
import prisma from './src/lib/prisma';

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
  console.log('Updated store settings.', updatedSettings);
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect()
  })
