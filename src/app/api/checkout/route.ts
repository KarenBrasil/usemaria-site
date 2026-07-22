import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { Resend } from 'resend';
import prisma from '@/lib/prisma';

// Use a placeholder if no key is provided yet
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
  apiVersion: '2026-06-24.dahlia',
});

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
                <p><a href="https://usemaria-site.vercel.app/admin">Ver no Painel</a></p>`
       }).catch(console.error);
    }

    // 3. Handle Payment Method
    if (paymentMethod === 'PIX') {
      // For custom PIX, just return the orderId
      // In a real scenario with Resend, we could trigger an email here.
      return NextResponse.json({ orderId: order.id });
    }

    if (paymentMethod === 'CARD') {
      // If Stripe secret key is the placeholder, mock it (to not break the UI before the client adds the key)
      if (!process.env.STRIPE_SECRET_KEY) {
         // Return a fake client secret or fail gracefully
         return NextResponse.json({ error: "Stripe não configurado no servidor. Adicione a chave na Vercel." }, { status: 400 });
      }

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
