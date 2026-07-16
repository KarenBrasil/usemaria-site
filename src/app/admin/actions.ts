"use server"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function createProduct(formData: FormData) {
  const name = formData.get("name") as string
  const price = parseFloat((formData.get("price") as string).replace(",", "."))
  const image = formData.get("image") as string
  
  await prisma.product.create({
    data: {
      name,
      price,
      image: image || null,
      isNew: true,
      sizes: {
        create: [
          { size: "P", stock: 10 },
          { size: "M", stock: 10 },
          { size: "G", stock: 10 },
        ]
      }
    }
  })
  
  revalidatePath("/admin")
  revalidatePath("/")
  redirect("/admin")
}
