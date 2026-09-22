/**
 * Tira as fotos que estao salvas em BASE64 dentro do banco e transforma
 * em arquivos .webp dentro de public/novas-pecas/ (mesmo padrao que os
 * produtos que ja funcionam bem).
 *
 * Por que: uma foto em base64 vai inteira dentro do HTML em TODA visita.
 * Como arquivo, ela vai uma vez e fica no cache do navegador e da CDN.
 *
 * A LOJA ESTA NO AR, entao a ordem importa. Sao 3 passos:
 *
 *   1) node scripts/migrar-imagens-base64.mjs
 *      Simulacao. Nao grava nada. So mostra o que vai acontecer.
 *
 *   2) node scripts/migrar-imagens-base64.mjs --gerar
 *      Cria os arquivos .webp em public/novas-pecas/. NAO mexe no banco.
 *      Depois disto: git add public/novas-pecas && git commit && deploy.
 *
 *   3) node scripts/migrar-imagens-base64.mjs --aplicar
 *      SO depois que o deploy do passo 2 estiver no ar.
 *      Agora sim aponta o banco para os arquivos novos.
 *
 * Fazer o passo 3 antes do 2 deixa 13 produtos sem foto no site.
 */
import 'dotenv/config';
import pg from 'pg';
import sharp from 'sharp';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

const APLICAR = process.argv.includes('--aplicar');
const GERAR = process.argv.includes('--gerar') || APLICAR;
const DESTINO = join(process.cwd(), 'public', 'novas-pecas');
const LARGURA_MAX = 1200;
const QUALIDADE = 80;

const kb = (n) => (n / 1024).toFixed(0) + ' KB';
const slug = (s) => (s || 'peca').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'peca';

if (!existsSync(DESTINO)) mkdirSync(DESTINO, { recursive: true });

const db = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
await db.connect();

const { rows } = await db.query('SELECT id, name, image, images FROM "Product" ORDER BY "createdAt" DESC');

let antes = 0, depois = 0, convertidas = 0, produtosTocados = 0, falhas = 0;

for (const p of rows) {
  const lista = [p.image, ...(p.images || [])];
  if (!lista.some((s) => s && s.startsWith('data:'))) continue;

  // Cada base64 unico vira UM arquivo, mesmo que apareca em image e images[]
  const mapa = new Map();
  for (const item of lista) {
    if (!item || !item.startsWith('data:') || mapa.has(item)) continue;
    const base64 = item.slice(item.indexOf(',') + 1);
    const entrada = Buffer.from(base64, 'base64');
    antes += entrada.length;
    try {
      const saida = await sharp(entrada)
        .rotate()
        .resize({ width: LARGURA_MAX, withoutEnlargement: true })
        .webp({ quality: QUALIDADE })
        .toBuffer();
      const nome = `${slug(p.name)}-${p.id.slice(0, 6)}-${mapa.size}.webp`;
      if (GERAR) writeFileSync(join(DESTINO, nome), saida);
      mapa.set(item, `/novas-pecas/${nome}`);
      depois += saida.length;
      convertidas++;
      console.log(`  ${kb(entrada.length).padStart(8)} -> ${kb(saida.length).padStart(8)}   ${nome}`);
    } catch (e) {
      falhas++;
      console.log(`  ERRO ao converter imagem de "${p.name}": ${e.message}`);
    }
  }
  if (mapa.size === 0) continue;

  const novoImage = p.image && mapa.has(p.image) ? mapa.get(p.image) : p.image;
  const novoImages = (p.images || []).map((s) => (mapa.has(s) ? mapa.get(s) : s));

  if (APLICAR) {
    await db.query('UPDATE "Product" SET image = $1, images = $2 WHERE id = $3', [novoImage, novoImages, p.id]);
  }
  produtosTocados++;
  console.log(`${APLICAR ? 'BANCO ATUALIZADO' : GERAR ? 'ARQUIVO CRIADO  ' : 'SIMULADO        '}  ${p.name}`);
}

console.log('\n======================================');
console.log('produtos afetados :', produtosTocados);
console.log('imagens convertidas:', convertidas, falhas ? `(${falhas} falharam)` : '');
console.log('peso antes        :', (antes / 1024 / 1024).toFixed(2), 'MB');
console.log('peso depois       :', (depois / 1024 / 1024).toFixed(2), 'MB');
if (antes > 0) console.log('reducao           :', (100 - (depois / antes) * 100).toFixed(1) + '%');
if (APLICAR) {
  console.log();
  console.log('PRONTO. O banco agora aponta para os arquivos .webp.');
  console.log('Confira a loja: as 13 pecas acima devem estar com foto.');
} else if (GERAR) {
  console.log();
  console.log('Arquivos criados em public/novas-pecas/. O banco NAO foi tocado.');
  console.log('AGORA FACA O DEPLOY:');
  console.log('   git add public/novas-pecas && git commit -m "fotos webp" && git push');
  console.log('Depois do deploy no ar: node scripts/migrar-imagens-base64.mjs --aplicar');
} else {
  console.log();
  console.log('ISSO FOI SO SIMULACAO. Nada foi gravado.');
  console.log('Proximo passo: node scripts/migrar-imagens-base64.mjs --gerar');
}
await db.end();
