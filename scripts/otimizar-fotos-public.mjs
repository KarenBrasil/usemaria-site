/**
 * Recomprime as fotos da pasta public/ (catalogo e novas-pecas).
 *
 * Mesmo padrao do upload do admin: no maximo 1200px de largura, qualidade 80.
 * Mantem nome e formato do arquivo, entao o banco nao precisa mudar.
 * So regrava se o resultado ficar menor. Pode rodar quantas vezes quiser.
 *
 *   node scripts/otimizar-fotos-public.mjs            (simulacao)
 *   node scripts/otimizar-fotos-public.mjs --aplicar  (regrava os arquivos)
 */
import sharp from 'sharp';
import { readdirSync, readFileSync, writeFileSync, statSync } from 'fs';
import { join, extname } from 'path';

const APLICAR = process.argv.includes('--aplicar');
const PASTAS = ['public/images', 'public/novas-pecas'];
const LARGURA_MAX = 1200;
const QUALIDADE = 80;

const kb = (n) => (n / 1024).toFixed(0).padStart(6) + ' KB';

function arquivos(dir) {
  return readdirSync(dir).flatMap((nome) => {
    const caminho = join(dir, nome);
    return statSync(caminho).isDirectory() ? arquivos(caminho) : [caminho];
  });
}

let antes = 0, depois = 0, mudou = 0;

for (const pasta of PASTAS) {
  for (const arq of arquivos(pasta)) {
    const ext = extname(arq).toLowerCase();
    if (!['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) continue;

    const original = readFileSync(arq);
    let img = sharp(original).rotate().resize({ width: LARGURA_MAX, withoutEnlargement: true });
    if (ext === '.webp') img = img.webp({ quality: QUALIDADE });
    else if (ext === '.png') img = img.png({ compressionLevel: 9, palette: true, quality: QUALIDADE });
    else img = img.jpeg({ quality: QUALIDADE, mozjpeg: true });
    const novo = await img.toBuffer();

    antes += original.length;
    if (novo.length < original.length * 0.95) {
      depois += novo.length;
      mudou++;
      if (APLICAR) writeFileSync(arq, novo);
      console.log(`${kb(original.length)} -> ${kb(novo.length)}   ${arq}`);
    } else {
      depois += original.length;
    }
  }
}

console.log('\n======================================');
console.log(`arquivos reduzidos: ${mudou}`);
console.log(`peso total antes  : ${(antes / 1048576).toFixed(2)} MB`);
console.log(`peso total depois : ${(depois / 1048576).toFixed(2)} MB`);
console.log(APLICAR ? '\nPRONTO. Arquivos regravados.' : '\nSIMULACAO. Rode com --aplicar para gravar.');
