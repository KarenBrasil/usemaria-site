/**
 * Mostra quanto peso as fotos dos produtos estao colocando em CADA visita.
 * Rode sempre que desconfiar que o site esta pesado de novo.
 *   node scripts/auditar-imagens.mjs
 */
import 'dotenv/config';
import pg from 'pg';

const db = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
await db.connect();
const { rows } = await db.query('SELECT id, name, image, images FROM "Product" ORDER BY "createdAt" DESC');

let base64 = 0, arquivo = 0, semFoto = 0, peso = 0;
const culpados = [];
for (const p of rows) {
  const todas = [p.image, ...(p.images || [])].filter(Boolean);
  const temBase64 = todas.some((s) => s.startsWith('data:'));
  if (temBase64) base64++; else if (todas.length) arquivo++; else semFoto++;
  let pesoProduto = 0;
  for (const s of todas) if (s.startsWith('data:')) pesoProduto += s.length;
  if (pesoProduto) { peso += pesoProduto; culpados.push([Math.round(pesoProduto / 1024), p.name]); }
}

console.log('produtos no total        :', rows.length);
console.log('com foto em ARQUIVO (ok) :', arquivo);
console.log('com foto em BASE64 (ruim):', base64);
console.log('sem foto                 :', semFoto);
console.log('peso extra por visita    :', (peso / 1024 / 1024).toFixed(2), 'MB');

if (culpados.length) {
  console.log();
  console.log('Produtos pesando em toda visita:');
  for (const [kb, nome] of culpados.sort((a, b) => b[0] - a[0])) {
    console.log(String(kb).padStart(6) + ' KB  ' + nome);
  }
  console.log();
  console.log('Para consertar: node scripts/migrar-imagens-base64.mjs');
} else {
  console.log();
  console.log('Tudo certo: nenhuma foto em base64.');
}
await db.end();
