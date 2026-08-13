"use server"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY || 're_placeholder')

async function sendStatusUpdateEmail(order: any, newStatus: string) {
  if (!process.env.RESEND_API_KEY || !order.customer?.email) return;

  const statusMessages: Record<string, { subject: string, title: string, message: string }> = {
    'PAID': {
      subject: `Pagamento Aprovado! Pedido #${order.id.slice(-6).toUpperCase()}`,
      title: 'Pagamento Aprovado! 🎉',
      message: 'Oba! Seu pagamento foi confirmado. Estamos preparando o seu pedido com todo o carinho.'
    },
    'SHIPPED': {
      subject: `Pedido Enviado! #${order.id.slice(-6).toUpperCase()}`,
      title: 'Seu pedido está a caminho! 🚚',
      message: 'Ele foi despachado e logo chegará até você. Acompanhe a entrega pelo nosso site!'
    },
    'DELIVERED': {
      subject: `Pedido Entregue! #${order.id.slice(-6).toUpperCase()}`,
      title: 'Pedido Entregue! 📦',
      message: 'Seu pedido foi entregue! Esperamos que você ame a sua camiseta Use Maria.'
    },
    'CANCELLED': {
      subject: `Pedido Cancelado - #${order.id.slice(-6).toUpperCase()}`,
      title: 'Pedido Cancelado',
      message: 'Infelizmente, seu pedido foi cancelado. Qualquer dúvida, por favor, responda este e-mail.'
    }
  };

  const notification = statusMessages[newStatus];
  if (!notification) return; // Se for PENDING ou desconhecido, não manda e-mail automático

  const html = `
    <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto; color: #333;">
      <h1 style="text-align: center; letter-spacing: 2px;">USE MARIA</h1>
      <hr style="border: 1px solid #eee; margin: 20px 0;" />
      <h2>Olá, ${order.customer.name.split(' ')[0]}!</h2>
      <h3 style="color: #059669;">${notification.title}</h3>
      <p>${notification.message}</p>
      
      <br/>
      <div style="text-align: center;">
        <a href="https://lojausemaria.com.br/rastreio?id=${order.id}" style="background:#000;color:#fff;padding:14px 28px;text-decoration:none;border-radius:4px;font-weight:bold;display:inline-block;letter-spacing:1px;text-transform:uppercase;font-size:12px;">Acompanhar Pedido</a>
      </div>
      <br/><br/>
      <hr style="border: 1px solid #eee; margin: 20px 0;" />
      <p style="font-size: 12px; color: #888; text-align: center;">Com carinho,<br/>Equipe Use Maria</p>
    </div>
  `;

  await resend.emails.send({
    from: 'Use Maria <onboarding@resend.dev>',
    to: order.customer.email,
    subject: notification.subject,
    html
  }).catch(console.error);
}

import { put } from '@vercel/blob'

export async function createProduct(formData: FormData) {
  const name = formData.get("name") as string
  const priceStr = (formData.get("price") as string) || "0"
  const sanitizedPrice = priceStr.replace(/[^\d,.-]/g, '').replace(",", ".")
  const price = parseFloat(sanitizedPrice) || 0
  
  // Imagem via URL (legado) ou Arquivo (novo)
  let imageUrl = formData.get("image") as string
  const imageFile = formData.get("imageFile") as File
  
  if (imageFile && imageFile.size > 0) {
    try {
      const blob = await put(imageFile.name, imageFile, { access: 'public' })
      imageUrl = blob.url
    } catch (e) {
      console.error("Erro no Vercel Blob upload:", e)
    }
  }
  
  const isNew = formData.get("isNew") === "true"
  const isWholesale = formData.get("isWholesale") === "true"
  const isPromotion = formData.get("isPromotion") === "true"
  const description = formData.get("description") as string || ""
  
  const oldPriceStr = (formData.get("oldPrice") as string) || ""
  const sanitizedOldPrice = oldPriceStr.replace(/[^\d,.-]/g, '').replace(",", ".")
  const oldPrice = sanitizedOldPrice ? parseFloat(sanitizedOldPrice) : null

  const sizes = ["PP", "P", "M", "G", "GG", "U"]
  const sizeData = sizes.map(size => {
    const stockStr = formData.get(`stock_${size}`) as string
    const stock = parseInt(stockStr?.trim() || "0", 10) || 0
    return { size, stock }
  }).filter(s => s.stock > 0)

  await prisma.product.create({
    data: {
      name,
      description,
      price,
      oldPrice,
      image: imageUrl || null,
      isNew,
      isWholesale,
      isPromotion,
      sizes: {
        create: sizeData
      }
    }
  })
  
  revalidatePath("/admin/produtos")
  revalidatePath("/")
  redirect("/admin/produtos?success=created")
}

export async function deleteProduct(id: string) {
  await prisma.product.delete({
    where: { id }
  })
  revalidatePath("/admin/produtos")
  revalidatePath("/")
}

export async function updateProduct(id: string, formData: FormData) {
  const name = formData.get("name") as string
  const priceStr = (formData.get("price") as string) || "0"
  const sanitizedPrice = priceStr.replace(/[^\d,.-]/g, '').replace(",", ".")
  const price = parseFloat(sanitizedPrice) || 0
  
  const oldPriceStr = (formData.get("oldPrice") as string) || ""
  const sanitizedOldPrice = oldPriceStr.replace(/[^\d,.-]/g, '').replace(",", ".")
  const oldPrice = sanitizedOldPrice ? parseFloat(sanitizedOldPrice) : null

  const isNew = formData.get("isNew") === "true"
  const isWholesale = formData.get("isWholesale") === "true"
  const isPromotion = formData.get("isPromotion") === "true"
  const description = formData.get("description") as string || ""
  
  // Imagem via URL (legado) ou Arquivo (novo)
  let imageUrl = formData.get("image") as string
  const imageFile = formData.get("imageFile") as File
  
  if (imageFile && imageFile.size > 0) {
    try {
      const blob = await put(imageFile.name, imageFile, { access: 'public' })
      imageUrl = blob.url
    } catch (e) {
      console.error("Erro no Vercel Blob upload:", e)
    }
  }
  
  await prisma.product.update({
    where: { id },
    data: {
      name,
      description,
      price,
      oldPrice,
      isNew,
      isWholesale,
      isPromotion,
      // Só atualiza a imagem se o usuário preencheu uma nova url ou fez upload
      ...(imageUrl ? { image: imageUrl } : {})
    }
  })

  // Update sizes
  const sizes = ["PP", "P", "M", "G", "GG", "U"]
  for (const size of sizes) {
    const stockStr = formData.get(`stock_${size}`) as string
    if (stockStr !== null) {
      const stock = parseInt(stockStr?.trim() || "0", 10) || 0
      
      const existingSize = await prisma.productSize.findFirst({
        where: { productId: id, size }
      })

      if (existingSize) {
        if (stock === 0) {
          await prisma.productSize.delete({ where: { id: existingSize.id } })
        } else {
          await prisma.productSize.update({
            where: { id: existingSize.id },
            data: { stock }
          })
        }
      } else if (stock > 0) {
        await prisma.productSize.create({
          data: {
            size,
            stock,
            productId: id
          }
        })
      }
    }
  }

  revalidatePath("/admin/produtos")
  revalidatePath("/")
  redirect("/admin/produtos?success=updated")
}

export async function updateOrderStatus(id: string, formData: FormData) {
  const status = formData.get("status") as string
  const paymentMethod = formData.get("paymentMethod") as string
  
  if (status || paymentMethod) {
    const data: any = {}
    if (status) data.status = status
    if (paymentMethod) data.paymentMethod = paymentMethod

    const order = await prisma.order.update({
      where: { id },
      data,
      include: { customer: true }
    })
    if (status) {
      await sendStatusUpdateEmail(order, status)
    }
  }
  revalidatePath("/admin/vendas")
  revalidatePath("/admin")
}

export async function confirmPixOrder(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId }
  });

  if (!order) return { error: "Pedido não encontrado" };

  const updatedOrder = await prisma.order.update({
    where: { id: orderId },
    data: { status: 'PAID' },
    include: { customer: true }
  });

  await sendStatusUpdateEmail(updatedOrder, 'PAID');

  // Após aprovar o PIX, gerar etiqueta automaticamente!
  const labelResult = await generateShippingLabel(orderId, false);
  
  revalidatePath("/admin/vendas")
  revalidatePath("/admin")

  if (labelResult?.error) {
    return { success: true, warning: `Pagamento aprovado, mas falha ao gerar etiqueta: ${labelResult.error}` };
  }
  
  return { success: true };
}

export async function generateShippingLabel(orderId: string, shouldRevalidate = true) {
  // 1. Get the order with full address details
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { customer: true, items: { include: { product: true } } }
  });

  if (!order) return { error: "Pedido não encontrado" };
  if (!order.customer) return { error: "Cliente não encontrado para este pedido" };
  if (!order.zipcode || !order.street || !order.number) {
    return { error: "Endereço de entrega incompleto. Não é possível gerar etiqueta." };
  }

  const token = process.env.MELHOR_ENVIO_TOKEN;
  if (!token) return { error: "Token do Melhor Envio não configurado." };

  try {
    const payload = {
      service: order.shippingServiceId ? parseInt(order.shippingServiceId) : 1, // Usa o selecionado ou fallback para PAC
      agency: 1, 
      from: {
        name: "Use Maria Oficial",
        phone: "5585994277446",
        email: "contato@lojausemaria.com.br",
        document: process.env.STORE_DOCUMENT || "12345678909", // Store valid CPF/CNPJ
        address: "Av. Washington Soares", 
        number: "123",
        district: "Centro",
        city: "Fortaleza",
        state_abbr: "CE",
        postal_code: process.env.STORE_CEP || "60811660"
      },
      to: {
        name: order.customer.name,
        phone: order.customer.phone || "5585999999999",
        email: order.customer.email || "contato@cliente.com",
        document: (order.customer.cpf && order.customer.cpf.replace(/\D/g, '').length === 11) ? order.customer.cpf.replace(/\D/g, '') : "11144477735", // Fallback to valid CPF
        address: order.street,
        number: order.number,
        complement: order.complement || "",
        district: order.neighborhood || "Bairro",
        city: order.city || "Cidade",
        state_abbr: order.state || "SP",
        postal_code: order.zipcode
      },
      products: order.items.map((item: any) => ({
        name: item.product?.name || "Peça Use Maria",
        quantity: item.quantity,
        unitary_value: item.price
      })),
      volumes: [
        {
          height: 6,
          width: 22,
          length: 27,
          weight: order.items.reduce((acc: number, item: any) => acc + (item.quantity * 0.3), 0) || 0.3
        }
      ],
      options: {
        insurance_value: order.total,
        receipt: false,
        own_hand: false,
        reverse: false,
        non_commercial: true // Envio PF -> PF (Declaração de Conteúdo Automática)
      }
    };

    const response = await fetch('https://www.melhorenvio.com.br/api/v2/me/cart', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Melhor Envio Error:", errorData);
      
      // Captura mensagem de erro amigável se houver
      let errorMessage = "Falha ao gerar etiqueta no Melhor Envio.";
      if (errorData.errors && typeof errorData.errors === 'object') {
         const firstErrorKey = Object.keys(errorData.errors)[0];
         if (firstErrorKey) errorMessage = `${firstErrorKey}: ${errorData.errors[firstErrorKey][0]}`;
      } else if (errorData.message) {
         errorMessage = errorData.message;
      }
      return { error: errorMessage };
    }
    
    // Atualizar status para SHIPPED para indicar que a etiqueta foi pro carrinho
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status: 'SHIPPED' },
      include: { customer: true }
    });
    
    await sendStatusUpdateEmail(updatedOrder, 'SHIPPED');

    if (shouldRevalidate) {
      revalidatePath("/admin/vendas");
      revalidatePath("/admin");
    }

    return { success: true };
  } catch (e: any) {
    console.error("Erro interno ao integrar com Melhor Envio:", e);
    return { error: e.message || "Erro de conexão ao gerar etiqueta." };
  }
}

