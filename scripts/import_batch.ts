import 'dotenv/config';
import prisma from '../src/lib/prisma';
import fs from 'fs';
import path from 'path';

async function main() {
  const sourceDir = 'C:\\Users\\Karen\\OneDrive\\Área de Trabalho\\KyB\\02-Clientes\\UseMaria\\catalogo em imagens\\peças novas';
  const targetDir = path.join(process.cwd(), 'public', 'novas-pecas');

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const files = fs.readdirSync(sourceDir);
  let count = 1;

  for (const file of files) {
    if (file.match(/\.(jpg|jpeg|png|webp)$/i)) {
      const sourcePath = path.join(sourceDir, file);
      const safeFilename = `nova-peca-${count}-${Date.now()}${path.extname(file)}`;
      const targetPath = path.join(targetDir, safeFilename);

      fs.copyFileSync(sourcePath, targetPath);
      
      const imageUrl = `/novas-pecas/${safeFilename}`;

      await prisma.product.create({
        data: {
          name: `Nova Peça - ${count}`,
          description: '',
          price: 0,
          image: imageUrl,
          images: [imageUrl],
          isNew: true,
          sizes: {
            create: [
              { size: 'P', color: 'Padrão', stock: 0 }
            ]
          }
        }
      });
      console.log(`Produto ${count} importado: ${file}`);
      count++;
    }
  }

  console.log(`Importação concluída! ${count - 1} produtos importados.`);
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
