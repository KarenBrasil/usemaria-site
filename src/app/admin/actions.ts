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
  // 1. Get the order
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { customer: true, items: { include: { product: true } } }
  });

  if (!order) throw new Error("Pedido não encontrado");

  // 2. Mark as PAID
  await prisma.order.update({
    where: { id: orderId },
    data: { status: 'PAID' }
  });

  // 3. Call Melhor Envio API to add to cart
  const token = process.env.MELHOR_ENVIO_TOKEN;
  if (token && order.customer) {
    try {
      const payload = {
        service: 1, // 1 = PAC, 2 = SEDEX, you can make this dynamic if saved on order
        agency: 1, // Default agency ID
        from: {
          name: "Use Maria Oficial",
          phone: "5585994277446",
          email: "contato@lojausemaria.com.br",
          document: "00000000000000", // CPF/CNPJ da loja
          address: "Rua Exemplo",
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
          address: "Endereço do Cliente", // Should be saved in DB Ideally
          number: "S/N",
          district: "Bairro",
          city: "Cidade",
          state_abbr: "SP",
          postal_code: "01001000" // We need to save address in DB. Hardcoded for MVP if not saved.
        },
        products: order.items.map(item => ({
          name: item.product?.name || "T-shirt",
          quantity: item.quantity,
          unitary_value: item.price
        })),
        volumes: [
          {
            height: 10,
            width: 20,
            length: 20,
            weight: order.items.reduce((acc, item) => acc + (item.quantity * 0.3), 0)
          }
        ],
        options: {
          insurance_value: order.total,
          receipt: false,
          own_hand: false,
          reverse: false,
          non_commercial: true // A MÁGICA PARA PESSOA FÍSICA AQUI (Declaração de Conteúdo Automática)
        }
      };

      await fetch('https://www.melhorenvio.com.br/api/v2/me/cart', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
    } catch (e) {
      console.error("Erro ao integrar com Melhor Envio:", e);
    }
  }

  revalidatePath("/admin/vendas")
  revalidatePath("/admin")
}
