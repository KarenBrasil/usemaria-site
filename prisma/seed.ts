import 'dotenv/config'
import prisma from '../src/lib/prisma'

async function main() {
  console.log('Start seeding...')

  // Seed StoreSettings
  await prisma.storeSettings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      storeName: "USE MARIA",
      hero1Image: "/images/catalog/page-0001.jpg",
      hero1Subtitle: "Lançamento Exclusivo Online",
      hero1Title: "A Coleção Divina",
      hero2Image: "/images/catalog/page-0006.jpg",
      hero2Subtitle: "Escolha da Estilista",
      hero2Title: "O Look Perfeito",
      hero2Text: "Capturado por @fotografo",
      whatsappNumber: "5585994277446",
      instagramUrl: "#",
      tiktokUrl: "#"
    }
  })
  console.log('Seeded StoreSettings.')

  // Seed 50 new products from page 19 to 68
  const startPage = 19;
  const numProducts = 50;

  for (let i = 0; i < numProducts; i++) {
    const pageNum = startPage + i;
    const pageStr = pageNum.toString().padStart(4, '0');
    const imagePath = `/images/catalog/page-${pageStr}.jpg`;
    const name = `T-Shirt Modelo ${pageNum}`;

    const product = await prisma.product.create({
      data: {
        name: name,
        price: 89.90, // Default price
        description: "Peça exclusiva da Use Maria, confeccionada com carinho e qualidade. Modelagem confortável e estampa de alta durabilidade que expressa sua fé.",
        image: imagePath,
        isNew: true,
        sizes: {
          create: [
            { size: 'P', stock: 10 },
            { size: 'M', stock: 10 },
            { size: 'G', stock: 10 },
            { size: 'GG', stock: 10 },
          ]
        }
      }
    })
    console.log(`Created product with id: ${product.id}`)
  }

  console.log('Seeding finished.')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
