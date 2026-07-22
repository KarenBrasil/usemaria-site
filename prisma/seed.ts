import 'dotenv/config'
import prisma from '../src/lib/prisma'

const productsToSeed = [
  { name: "T-Shirt Essencial", image: "/images/catalog/page-0004.jpg" },
  { name: "T-Shirt Fé e Devoção", image: "/images/catalog/page-0005.jpg" },
  { name: "Blusa Nossa Senhora", image: "/images/catalog/page-0006.jpg" },
  { name: "T-Shirt Clássica Rosé", image: "/images/catalog/page-0007.jpg" },
  { name: "T-Shirt Minimalista", image: "/images/catalog/page-0008.jpg" },
  { name: "Blusa Sagrado Coração", image: "/images/catalog/page-0009.jpg" },
  { name: "T-Shirt Estampa Divina", image: "/images/catalog/page-0010.jpg" },
  { name: "Blusa Maria Passa na Frente", image: "/images/catalog/page-0011.jpg" },
  { name: "T-Shirt Cruz Minimal", image: "/images/catalog/page-0012.jpg" },
  { name: "Blusa Graça Alcançada", image: "/images/catalog/page-0013.jpg" },
  { name: "T-Shirt Terço Detalhado", image: "/images/catalog/page-0014.jpg" },
  { name: "Blusa Amor e Paz", image: "/images/catalog/page-0015.jpg" },
  { name: "T-Shirt Estampa Floral", image: "/images/catalog/page-0016.jpg" },
  { name: "Blusa Milagres", image: "/images/catalog/page-0017.jpg" },
  { name: "T-Shirt Oração", image: "/images/catalog/page-0018.jpg" },
]

async function main() {
  console.log('Start seeding...')

  for (const p of productsToSeed) {
    const product = await prisma.product.create({
      data: {
        name: p.name,
        price: 89.90, // Default price
        description: "Peça exclusiva da Use Maria, confeccionada com carinho e qualidade. Modelagem confortável e estampa de alta durabilidade que expressa sua fé.",
        image: p.image,
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
