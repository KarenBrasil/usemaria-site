import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const product = await prisma.product.findFirst({ include: { sizes: true } });
  if (!product) return console.log("No product");
  
  const res = await fetch('https://lojausemaria.com.br/api/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      cartId: 'test1234',
      customer: { name: 'Teste Bot', email: 'bot@teste.com' },
      address: { zipcode: '12345678', street: 'Rua', number: '1', neighborhood: 'Bairro', city: 'Cidade', state: 'SP' },
      items: [{ productId: product.id, size: product.sizes[0]?.size || 'M', quantity: 1, price: 50 }],
      total: 50,
      paymentMethod: 'CARD',
      shipping: { method: 'GRATIS', cost: 0 }
    })
  });
  
  const data = await res.json();
  console.log(data);
}
main().catch(console.error);
