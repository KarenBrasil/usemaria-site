import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 're_placeholder');

export async function GET(request: Request) {
  try {
    // Verificar token do Vercel Cron para segurança (opcional, mas recomendado)
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
    const fiveHoursAgo = new Date(now.getTime() - 5 * 60 * 60 * 1000);

    // Buscar pedidos PENDENTES criados entre 48h atrás e 5h atrás
    // E que receberam menos de 3 follow-ups
    const pendingOrders = await prisma.order.findMany({
      where: {
        status: 'PENDING',
        createdAt: {
          gte: twoDaysAgo,
          lte: fiveHoursAgo
        },
        followUpCount: {
          lt: 3
        }
      },
      include: { customer: true, items: { include: { product: true } } }
    });

    let emailsSent = 0;

    for (const order of pendingOrders) {
      if (!order.customer?.email) continue;

      // Calcular tempo desde o último envio para não mandar toda hora se o cron rodar muito rápido
      // (Se o cron roda a cada 5h, isso é garantido, mas é bom prevenir)
      // Enviar email
      const itemsHtml = order.items.map(item => `<li>${item.quantity}x ${item.product?.name || 'Produto'} (Tamanho: ${item.size})</li>`).join('');

      await resend.emails.send({
        from: 'Use Maria <contato@lojausemaria.com.br>',
        to: order.customer.email,
        subject: `Seu carrinho te espera! Finalize seu pedido #${order.id.slice(-6).toUpperCase()}`,
        html: `
          <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto; color: #333;">
            <h1 style="text-align: center; letter-spacing: 2px;">USE MARIA</h1>
            <hr style="border: 1px solid #eee; margin: 20px 0;" />
            <h2>Olá, ${order.customer.name.split(' ')[0]}!</h2>
            <p>Notamos que você tentou realizar uma compra conosco mas o pagamento ficou pendente ou não foi aprovado.</p>
            <p>Os seus produtos ainda estão reservados para você!</p>
            
            <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3>Resumo do seu pedido:</h3>
              <ul style="margin: 0; padding-left: 20px;">
                ${itemsHtml}
              </ul>
              <p style="margin-top: 15px;"><strong>Valor Total:</strong> R$ ${order.total.toFixed(2).replace('.', ',')}</p>
            </div>

            <p>Para não perder essas peças, pedimos que você volte ao nosso site e tente realizar o pagamento novamente, utilizando <strong>outro cartão de crédito ou PIX</strong>.</p>
            <br/>
            <div style="text-align: center;">
              <a href="https://lojausemaria.com.br/checkout" style="background:#000;color:#fff;padding:14px 28px;text-decoration:none;border-radius:4px;font-weight:bold;display:inline-block;letter-spacing:1px;text-transform:uppercase;font-size:12px;">Tentar Novamente / Finalizar Compra</a>
            </div>
            <br/><br/>
            <hr style="border: 1px solid #eee; margin: 20px 0;" />
            <p style="font-size: 12px; color: #888; text-align: center;">Com carinho,<br/>Equipe Use Maria</p>
          </div>
        `
      }).catch(console.error);

      // Atualizar contador
      await prisma.order.update({
        where: { id: order.id },
        data: { followUpCount: { increment: 1 } }
      });

      emailsSent++;
    }

    // 2. Cancelar automaticamente pedidos PENDENTES com mais de 48h e restaurar o estoque
    const expiredOrders = await prisma.order.findMany({
      where: {
        status: 'PENDING',
        createdAt: {
          lt: twoDaysAgo
        }
      },
      include: { items: true }
    });

    let autoCanceled = 0;

    for (const order of expiredOrders) {
      // Restaurar estoque (se não for atacado)
      const totalItems = order.items.reduce((acc, item) => acc + item.quantity, 0);
      const isWholesaleOrder = totalItems >= 10;

      if (!isWholesaleOrder) {
        for (const item of order.items) {
          if (item.productId) {
            const pSize = await prisma.productSize.findFirst({
              where: { productId: item.productId, size: item.size, color: item.color }
            });
            if (pSize) {
              await prisma.productSize.update({
                where: { id: pSize.id },
                data: { stock: { increment: item.quantity } }
              });
            }
          }
        }
      }

      // Mudar status para CANCELADO
      await prisma.order.update({
        where: { id: order.id },
        data: { status: 'CANCELLED' }
      });

      autoCanceled++;
    }

    return NextResponse.json({ success: true, emailsSent, autoCanceled });
  } catch (err: any) {
    console.error("Cron Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
