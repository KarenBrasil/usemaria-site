import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { Resend } from 'resend';
import prisma from '@/lib/prisma';

const resend = new Resend(process.env.RESEND_API_KEY || 're_placeholder');

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { customer, items, total, paymentMethod, address, cartId } = body;

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
          cpf: customer.cpf
        }
      });
    } else if (customer.cpf && !dbCustomer.cpf) {
      dbCustomer = await prisma.customer.update({
        where: { id: dbCustomer.id },
        data: { cpf: customer.cpf }
      });
    }

    // 2. Create the Order in the database (Status: PENDING)
    const order = await prisma.order.create({
      data: {
        customerId: dbCustomer.id,
        total: total,
        status: 'PENDING',
        zipcode: address?.zipcode,
        street: address?.street,
        number: address?.number,
        complement: address?.complement,
        neighborhood: address?.neighborhood,
        city: address?.city,
        state: address?.state,
        shippingMethod: body.shipping?.method,
        shippingCost: body.shipping?.cost,
        shippingServiceId: body.shipping?.serviceId,
        paymentMethod: paymentMethod || "PIX",
        items: {
          create: items.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
            size: item.size,
            color: item.color || "Padrão"
          }))
        }
      }
    });

    // 2.5. Deduct physical stock and remove reservations
    const isWholesaleOrder = items.reduce((acc: number, item: any) => acc + item.quantity, 0) >= 10;
    
    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        include: { sizes: true }
      });
      const isItemWholesale = isWholesaleOrder && product?.isWholesale;
      const itemColor = item.color || "Padrão";
      const pSize = product?.sizes.find(s => s.size === item.size && s.color === itemColor);
      
      if (pSize && !isItemWholesale) {
        await prisma.productSize.update({
          where: { id: pSize.id },
          data: { stock: { decrement: item.quantity } }
        });
      }
    }
    if (cartId) {
      await prisma.reservation.deleteMany({
        where: { cartId }
      });
    }

    // Send Emails via Resend (fire and forget)
    if (process.env.RESEND_API_KEY) {
       // 1. E-mail para o Administrador
       resend.emails.send({
         from: 'Use Maria <contato@lojausemaria.com.br>',
         to: 'usemaria72@gmail.com',
         subject: `Use Maria - Nova Venda! Pedido #${order.id.slice(-6).toUpperCase()} - R$ ${total.toFixed(2)}`,
         html: `
           <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto; color: #333;">
             <h2>Nova Venda Realizada - Use Maria</h2>
             <p>Olá Anny Talyta,</p>
             <p>Você acabou de receber um novo pedido de <strong>${customer.name}</strong>.</p>
             <div style="background: #f4f4f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
               <p style="margin:0 0 10px 0;"><strong>Telefone:</strong> ${customer.phone}</p>
               <p style="margin:0 0 10px 0;"><strong>E-mail:</strong> ${customer.email}</p>
               <p style="margin:0 0 10px 0;"><strong>Valor Total:</strong> R$ ${total.toFixed(2).replace('.', ',')}</p>
               <p style="margin:0 0 10px 0;"><strong>Método de Pagamento:</strong> ${paymentMethod}</p>
               <p style="margin:0 0 10px 0;"><strong>Frete Escolhido:</strong> ${body.shipping?.method || 'Não informado'} (R$ ${body.shipping?.cost ? body.shipping.cost.toFixed(2).replace('.', ',') : '0,00'})</p>
               <p style="margin:0 0 10px 0;"><strong>Endereço de Entrega:</strong> ${address?.street || ''}, ${address?.number || ''} ${address?.complement ? '- ' + address.complement : ''} - ${address?.neighborhood || ''}, ${address?.city || ''}/${address?.state || ''} - CEP: ${address?.zipcode || ''}</p>
               
               <h3 style="margin-top: 20px; margin-bottom: 10px; font-size: 14px; text-transform: uppercase;">Resumo dos Itens:</h3>
               <ul style="margin: 0; padding-left: 20px; font-size: 14px;">
                 ${items.map((item: any) => `<li style="margin-bottom: 5px;">${item.quantity}x (Tamanho: ${item.size}) - R$ ${item.price.toFixed(2).replace('.', ',')}</li>`).join('')}
               </ul>

               ${isWholesaleOrder ? `<p style="margin:15px 0 0 0; color: #b45309; font-weight: bold; background: #fef3c7; padding: 8px; border-radius: 4px;">AVISO: PEDIDO DE ATACADO (PRAZO DE PRODUÇÃO: 5 DIAS)</p>` : ''}
             </div>
             <a href="https://lojausemaria.com.br/admin/vendas" style="background:#000;color:#fff;padding:12px 24px;text-decoration:none;border-radius:4px;font-weight:bold;display:inline-block;">Ver Painel Administrativo</a>
           </div>
         `
       }).catch(console.error);

       // 2. E-mail para o Cliente
       if (customer.email) {
         resend.emails.send({
           from: 'Use Maria <contato@lojausemaria.com.br>',
           to: customer.email,
           subject: `Use Maria - Confirmação do seu Pedido #${order.id.slice(-6).toUpperCase()}`,
           html: `
             <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto; color: #333;">
               <h1 style="text-align: center; letter-spacing: 2px;">USE MARIA</h1>
               <hr style="border: 1px solid #eee; margin: 20px 0;" />
               <h2>Olá, ${customer.name.split(' ')[0]}!</h2>
               <p>Recebemos o seu pedido <strong>#${order.id.slice(-6).toUpperCase()}</strong> com sucesso.</p>
               <p>Estamos muito felizes em ter você como cliente! Seu pedido já está sendo processado com todo o carinho.</p>
               
               <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
                 <p style="margin:0 0 10px 0;"><strong>Valor Total:</strong> R$ ${total.toFixed(2).replace('.', ',')}</p>
                 <p style="margin:0;"><strong>Método de Pagamento:</strong> ${paymentMethod}</p>
                 ${isWholesaleOrder ? `<p style="margin:10px 0 0 0; color: #b45309; font-weight: bold; background: #fef3c7; padding: 8px; border-radius: 4px;">Aviso: Você realizou uma compra no Atacado. O prazo de produção das peças sob encomenda é de 5 dias úteis.</p>` : ''}
               </div>

               ${paymentMethod === 'PIX' ? `<p style="color: #d97706; font-weight: bold;">Lembrete: Como você escolheu PIX, o pedido só será confirmado e enviado após o pagamento. Caso já tenha feito, desconsidere.</p>` : ''}

               <p>Você pode acompanhar o status da entrega clicando no botão abaixo:</p>
               <br/>
               <div style="text-align: center;">
                 <a href="https://lojausemaria.com.br/rastreio?id=${order.id}" style="background:#000;color:#fff;padding:14px 28px;text-decoration:none;border-radius:4px;font-weight:bold;display:inline-block;letter-spacing:1px;text-transform:uppercase;font-size:12px;">Acompanhar Meu Pedido</a>
               </div>
               <br/><br/>
               <hr style="border: 1px solid #eee; margin: 20px 0;" />
               <p style="font-size: 12px; color: #888; text-align: center;">Com carinho,<br/>Equipe Use Maria</p>
             </div>
           `
         }).catch(console.error);
       }
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
        return NextResponse.json({ error: "ERRO GRAVE NA VERCEL: Você colocou a Chave Pública (pk_test/live) na variável STRIPE_SECRET_KEY. Por favor, coloque a CHAVE SECRETA (sk_...) no painel da Vercel." }, { status: 400 });
      }

      if (rawSecret.includes('sk_test_')) {
        return NextResponse.json({ error: "ERRO NA VERCEL: Você salvou a chave de TESTE (sk_test_) no painel da Vercel. Por favor, volte lá, apague essa chave, e cole a chave de PRODUÇÃO (sk_live_)." }, { status: 400 });
      }

      if (!rawSecret) {
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
