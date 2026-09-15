import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { Resend } from 'resend';
import prisma from '@/lib/prisma';

const resend = new Resend(process.env.RESEND_API_KEY || 're_placeholder');

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { customer, items, total, paymentMethod, address, cartId } = body;
    const paymentLabel = paymentMethod === 'WHATSAPP' ? 'A combinar' : paymentMethod;

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

    // WhatsApp da loja para os avisos por e-mail
    const storeSettings = await prisma.storeSettings.findUnique({ where: { id: 'default' } });
    const whatsappNumber = storeSettings?.whatsappNumber || '5585994277446';
    const orderNumber = order.id.slice(-6).toUpperCase();
    const customerFirstName = customer.name.split(' ')[0];
    const customerWaLink = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`Olá! Realizei o pedido #${orderNumber} no site Use Maria e gostaria de combinar o pagamento e a entrega.`)}`;
    // Link para a LOJA chamar o CLIENTE no WhatsApp (usa o telefone informado no pedido)
    const customerPhoneDigits = (customer.phone || '').replace(/\D/g, '');
    const customerPhoneWa = customerPhoneDigits ? (customerPhoneDigits.startsWith('55') ? customerPhoneDigits : `55${customerPhoneDigits}`) : '';
    const storeToCustomerWaLink = customerPhoneWa
      ? `https://wa.me/${customerPhoneWa}?text=${encodeURIComponent(`Olá ${customerFirstName}! Aqui é da Use Maria. Recebemos o seu pedido #${orderNumber} e vamos combinar o pagamento e a entrega.`)}`
      : '';
    const totalFmt = total.toFixed(2).replace('.', ',');
    const freteFmt = `${body.shipping?.method || 'A combinar'}${body.shipping?.cost ? ` (R$ ${body.shipping.cost.toFixed(2).replace('.', ',')})` : ''}`;
    const enderecoFmt = `${address?.street || ''}, ${address?.number || ''}${address?.complement ? ` - ${address.complement}` : ''} - ${address?.neighborhood || ''}, ${address?.city || ''}/${address?.state || ''} - CEP: ${address?.zipcode || ''}`;
    const itensHtml = items.map((item: any) => `<li>${item.quantity}x ${item.name || 'Peça'} (Tam. ${item.size}) - R$ ${item.price.toFixed(2).replace('.', ',')}</li>`).join('');
    const itensText = items.map((item: any) => `- ${item.quantity}x ${item.name || 'Peça'} (Tam. ${item.size}) - R$ ${item.price.toFixed(2).replace('.', ',')}`).join('\n');

    // Send Emails via Resend (fire and forget)
    if (process.env.RESEND_API_KEY) {
       // 1. E-mail para a loja
       resend.emails.send({
         from: 'Use Maria <contato@lojausemaria.com.br>',
         to: 'usemaria72@gmail.com',
         replyTo: customer.email,
         subject: `Nova venda no site #${orderNumber} - ${customer.name} (pagamento a combinar)`,
         text:
`NOVA VENDA NO SITE

Você recebeu um novo pedido de ${customer.name}. Já pode preparar o pedido.

Pagamento e entrega: a combinar via WhatsApp (pagamento independente).
O pedido só é confirmado depois que ${customerFirstName} entrar em contato pelo WhatsApp para acertar o pagamento e combinar o valor da entrega.

Chamar ${customerFirstName} no WhatsApp: ${storeToCustomerWaLink || 'telefone não informado'}

Pedido #${orderNumber}
Cliente: ${customer.name}
Telefone: ${customer.phone}
E-mail: ${customer.email}
Total: R$ ${totalFmt}
Pagamento e entrega: ${paymentLabel}
Frete: ${freteFmt}
Endereço: ${enderecoFmt}

Itens:
${itensText}
${isWholesaleOrder ? '\nPedido de atacado - prazo de produção de 5 dias úteis.\n' : ''}
Ver no painel: https://lojausemaria.com.br/admin/vendas`,
         html: `
           <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #222; font-size: 15px; line-height: 1.6;">
             <p style="font-size:20px; font-weight:bold; margin:0 0 4px 0;">Nova venda no site</p>
             <p style="margin:0 0 20px 0; color:#0b57d0; font-weight:bold;">Pagamento e entrega a combinar via WhatsApp (pagamento independente)</p>
             <p>Você recebeu um novo pedido de <strong>${customer.name}</strong>. Já pode preparar o pedido.</p>
             <p>O pedido só é confirmado depois que ${customerFirstName} entrar em contato pelo WhatsApp para acertar o pagamento e combinar o valor da entrega.</p>
             ${storeToCustomerWaLink ? `<p style="margin:20px 0;"><a href="${storeToCustomerWaLink}" style="background:#128C7E;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;">Chamar ${customerFirstName} no WhatsApp</a></p>` : ''}
             <p style="margin-top:24px;"><strong>Pedido #${orderNumber}</strong></p>
             <p style="margin:0;">
               Cliente: ${customer.name}<br/>
               Telefone: ${customer.phone}<br/>
               E-mail: ${customer.email}<br/>
               Total: R$ ${totalFmt}<br/>
               Pagamento e entrega: ${paymentLabel}<br/>
               Frete: ${freteFmt}<br/>
               Endereço: ${enderecoFmt}
             </p>
             <p style="margin-top:16px;margin-bottom:4px;">Itens:</p>
             <ul style="margin:0;padding-left:20px;">${itensHtml}</ul>
             ${isWholesaleOrder ? `<p>Pedido de atacado - prazo de produção de 5 dias úteis.</p>` : ''}
             <p style="margin-top:24px;"><a href="https://lojausemaria.com.br/admin/vendas" style="color:#0b57d0;">Ver no painel administrativo</a></p>
           </div>
         `
       }).catch(console.error);

       // 2. E-mail para o Cliente
       if (customer.email) {
         resend.emails.send({
           from: 'Use Maria <contato@lojausemaria.com.br>',
           to: customer.email,
           replyTo: 'contato@lojausemaria.com.br',
           subject: `Seu pedido #${orderNumber} - Use Maria`,
           text:
`Olá, ${customerFirstName}!

Recebemos o seu pedido #${orderNumber}.

Seu pedido ainda não está confirmado. Entre em contato pelo WhatsApp para combinarmos o pagamento e o valor da entrega. O envio acontece só depois disso.
Falar no WhatsApp: ${customerWaLink}

Total: R$ ${totalFmt}
Pagamento e entrega: ${paymentLabel}
${isWholesaleOrder ? '\nCompra no atacado - prazo de produção de 5 dias úteis.\n' : ''}
Acompanhar seu pedido: https://lojausemaria.com.br/rastreio?id=${order.id}

Equipe Use Maria`,
           html: `
             <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #222; font-size: 15px; line-height: 1.6;">
               <p style="text-align:center; letter-spacing:2px; font-size:20px; font-weight:bold; margin-bottom:24px;">USE MARIA</p>
               <p>Olá, ${customerFirstName}!</p>
               <p>Recebemos o seu pedido <strong>#${orderNumber}</strong>.</p>
               <p><strong>Seu pedido ainda não está confirmado.</strong> Entre em contato pelo WhatsApp para combinarmos o pagamento e o valor da entrega. O envio acontece só depois disso.</p>
               <p style="margin:20px 0;">
                 <a href="${customerWaLink}" style="background:#128C7E;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;">Falar no WhatsApp sobre meu pedido</a>
               </p>
               <p style="margin:0;">
                 Total: R$ ${totalFmt}<br/>
                 Pagamento e entrega: ${paymentLabel}
               </p>
               ${isWholesaleOrder ? `<p>Compra no atacado - prazo de produção de 5 dias úteis.</p>` : ''}
               <p style="margin-top:20px;">
                 <a href="https://lojausemaria.com.br/rastreio?id=${order.id}" style="color:#0b57d0;">Acompanhar meu pedido</a>
               </p>
               <p style="margin-top:24px; color:#888; font-size:13px;">Equipe Use Maria</p>
             </div>
           `
         }).catch(console.error);
       }
    }

    // 3. Handle Payment Method
    if (paymentMethod === 'PIX' || paymentMethod === 'WHATSAPP') {
      // For custom PIX or WHATSAPP flow, just return the orderId
      // The frontend will handle the redirection.
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
