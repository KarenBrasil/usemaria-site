import 'dotenv/config';
import prisma from '../src/lib/prisma';

async function main() {
  await prisma.storeSettings.updateMany({
    data: {
      whatsappNumber: "5585992659192"
    }
  });

  console.log("WhatsApp number updated.");
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
