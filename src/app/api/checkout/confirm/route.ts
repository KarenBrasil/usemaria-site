import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { orderId, status, errorMsg } = await request.json();

    if (!orderId) {
      return NextResponse.json({ error: "orderId is required" }, { status: 400 });
    }

    if (status === 'PAID') {
      await prisma.order.update({
        where: { id: orderId },
        data: { status: 'PAID', paymentError: null }
      });
      return NextResponse.json({ success: true, status: 'PAID' });
    }

    if (status === 'FAILED') {
      const order = await prisma.order.update({
        where: { id: orderId },
        data: { paymentError: errorMsg || 'Falha ao processar cartão.' },
        include: { customer: true }
      });

      // Send emails
      if (process.env.RESEND_API_KEY && order.customer?.email) {
        const { Resend } = await import('resend');
        const resend = new Resend(process.env.RESEND_API_KEY);
        
        // To Admin
        await resend.emails.send({
          from: 'Use Maria <contato@lojausemaria.com.br>',
          to: 'usemaria72@gmail.com',
          subject: `Aviso: Pagamento Recusado - Pedido #${order.id.slice(-6).toUpperCase()}`,
          html: `<p>O pagamento de ${order.customer.name} (R$ ${order.total.toFixed(2)}) foi recusado pela operadora do cartão.</p><p><strong>Motivo:</strong> ${errorMsg}</p>`
        });

        // To Customer
        await resend.emails.send({
          from: 'Use Maria <contato@lojausemaria.com.br>',
          to: order.customer.email,
          subject: `Ops! Tivemos um problema com o pagamento do pedido #${order.id.slice(-6).toUpperCase()}`,
          html: `<p>Olá ${order.customer.name.split(' ')[0]},</p><p>Seu pagamento de R$ ${order.total.toFixed(2)} não pôde ser processado. O motivo informado pelo banco foi: <strong>${errorMsg || 'Recusado'}</strong>.</p><p>Não se preocupe, suas peças estão reservadas. Por favor, volte ao site e tente novamente com outro cartão ou via PIX:</p><br/><a href="https://lojausemaria.com.br/checkout" style="background:#000;color:#fff;padding:12px 24px;text-decoration:none;">Tentar Novamente</a>`
        });
      }

      return NextResponse.json({ success: true, status: 'FAILED' });
    }

    return NextResponse.json({ error: "Invalid status" }, { status: 400 });

  } catch (err: any) {
    console.error("Confirm Checkout Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
