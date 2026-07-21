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
