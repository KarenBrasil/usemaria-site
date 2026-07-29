import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { Resend } from 'resend';
import prisma from '@/lib/prisma';

const resend = new Resend(process.env.RESEND_API_KEY || 're_placeholder');

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { customer, items, total, paymentMethod } = body;

    // 1. Create or find customer in database
    let dbCustomer = await prisma.customer.findFirst({
      where: { email: customer.email }
    });

    if (!dbCustomer) {
      dbCustomer = await prisma.customer.create({
        data: {
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
        }
      });
    }

    // 2. Create the Order in the database (Status: PENDING)
    const order = await prisma.order.create({
      data: {
        customerId: dbCustomer.id,
        total: total,
        status: 'PENDING',
        items: {
          create: items.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
            size: item.size
          }))
        }
      }
    });

    // Send Email to Admin via Resend (fire and forget)
    if (process.env.RESEND_API_KEY) {
       resend.emails.send({
         from: 'Vendas Use Maria <onboarding@resend.dev>',
         to: process.env.ADMIN_EMAIL || 'karen@kyb.com', // fallback
         subject: `Novo Pedido #${order.id.slice(-6).toUpperCase()} - R$ ${total}`,
         html: `<p>Você recebeu um novo pedido de <strong>${customer.name}</strong> (${customer.phone}).</p>
                <p>Valor total: R$ ${total.toFixed(2)}</p>
                <p>Método: ${paymentMethod}</p>
                <p><a href="https://lojausemaria.com.br/admin">Ver no Painel</a></p>`
       }).catch(console.error);
    }

    // 3. Handle Payment Method
    if (paymentMethod === 'PIX') {
      // For custom PIX, just return the orderId
      // In a real scenario with Resend, we could trigger an email here.
      return NextResponse.json({ orderId: order.id });
    }

    if (paymentMethod === 'CARD') {
      const rawSecret = (process.env.STRIPE_SECRET_KEY || '').trim().replace(/['"]/g, '');

      // Se a chave secreta contiver pk_, o usuário colou a chave errada na Vercel
      if (rawSecret.includes('pk_')) {
        return NextResponse.json({ error: "ERRO GRAVE NA VERCEL: Você colocou a Chave Pública (pk_test...) na variável STRIPE_SECRET_KEY. Por favor, coloque a CHAVE SECRETA (que começa com sk_test...) no painel da Vercel." }, { status: 400 });
      }

      if (!rawSecret) {
         // Return a fake client secret or fail gracefully
         return NextResponse.json({ error: "Stripe não configurado no servidor. Adicione a chave na Vercel." }, { status: 400 });
      }

      // Safe instantiation inside the handler to prevent module-level crash
      const stripe = new Stripe(rawSecret, {
        apiVersion: '2023-10-16',
      } as any);

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(total * 100), // Stripe expects cents
        currency: 'brl',
        metadata: {
          orderId: order.id,
          customerEmail: dbCustomer.email,
        },
      });

      return NextResponse.json({ 
        orderId: order.id,
        clientSecret: paymentIntent.client_secret
      });
    }

    return NextResponse.json({ error: "Invalid payment method" }, { status: 400 });

  } catch (err: any) {
    console.error("Checkout Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
