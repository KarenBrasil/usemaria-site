"use server"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function createProduct(formData: FormData) {
  const name = formData.get("name") as string
  const priceStr = formData.get("price") as string
  const price = parseFloat(priceStr.replace(",", "."))
  const image = formData.get("image") as string
  
  const sizes = ["PP", "P", "M", "G", "GG", "U"]
  const sizeData = sizes.map(size => {
    const stockStr = formData.get(`stock_${size}`) as string
    const stock = parseInt(stockStr || "0", 10)
    return { size, stock }
  }).filter(s => s.stock > 0)

  await prisma.product.create({
    data: {
      name,
      price,
      image: image || null,
      isNew: true,
      sizes: {
        create: sizeData
      }
    }
  })
  
  revalidatePath("/admin/produtos")
  revalidatePath("/")
  redirect("/admin/produtos")
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
  const priceStr = formData.get("price") as string
  const price = parseFloat(priceStr.replace(",", "."))
  const image = formData.get("image") as string
  
  await prisma.product.update({
    where: { id },
    data: {
      name,
      price,
      image: image || null,
    }
  })

  // Update sizes
  const sizes = ["PP", "P", "M", "G", "GG", "U"]
  for (const size of sizes) {
    const stockStr = formData.get(`stock_${size}`) as string
    if (stockStr !== null) {
      const stock = parseInt(stockStr || "0", 10)
      
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
  redirect("/admin/produtos")
}

export async function updateOrderStatus(id: string, formData: FormData) {
  const status = formData.get("status") as string
  if (status) {
    await prisma.order.update({
      where: { id },
      data: { status }
    })
  }
  revalidatePath("/admin/vendas")
  revalidatePath("/admin")
}

export async function confirmPixOrder(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId }
  });

  if (!order) throw new Error("Pedido não encontrado");

  await prisma.order.update({
    where: { id: orderId },
    data: { status: 'PAID' }
  });

  revalidatePath("/admin/vendas")
  revalidatePath("/admin")
}

export async function generateShippingLabel(orderId: string) {
  // 1. Get the order with full address details
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { customer: true, items: { include: { product: true } } }
  });

  if (!order) throw new Error("Pedido não encontrado");
  if (!order.customer) throw new Error("Cliente não encontrado para este pedido");
  if (!order.zipcode || !order.street || !order.number) {
    throw new Error("Endereço de entrega incompleto. Não é possível gerar etiqueta.");
  }

  const token = process.env.MELHOR_ENVIO_TOKEN;
  if (!token) throw new Error("Token do Melhor Envio não configurado.");

  try {
    const payload = {
      service: 1, // 1 = PAC, 2 = SEDEX (Idealmente seria dinâmico, mas default 1)
      agency: 1, 
      from: {
        name: "Use Maria Oficial",
        phone: "5585994277446",
        email: "contato@lojausemaria.com.br",
        document: "00000000000000", // CPF/CNPJ da loja
        address: "Rua Exemplo", // Atualizar com endereço real da loja
        number: "123",
        district: "Centro",
        city: "Fortaleza",
        state_abbr: "CE",
        postal_code: process.env.STORE_CEP || "60811660"
      },
      to: {
        name: order.customer.name,
        phone: order.customer.phone || "",
        email: order.customer.email || "",
        document: order.customer.cpf || "00000000000",
        address: order.street,
        number: order.number,
        complement: order.complement || "",
        district: order.neighborhood || "Bairro",
        city: order.city || "Cidade",
        state_abbr: order.state || "SP",
        postal_code: order.zipcode
      },
      products: order.items.map(item => ({
        name: item.product?.name || "Peça Use Maria",
        quantity: item.quantity,
        unitary_value: item.price
      })),
      volumes: [
        {
          height: 10,
          width: 20,
          length: 20,
          weight: order.items.reduce((acc, item) => acc + (item.quantity * 0.3), 0) || 0.3
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
      throw new Error("Falha ao gerar etiqueta no Melhor Envio.");
    }
    
    // Atualizar status para SHIPPED para indicar que a etiqueta foi pro carrinho
    await prisma.order.update({
      where: { id: orderId },
      data: { status: 'SHIPPED' }
    });

  } catch (e) {
    console.error("Erro interno ao integrar com Melhor Envio:", e);
  }

  revalidatePath("/admin/vendas")
  revalidatePath("/admin")
}

