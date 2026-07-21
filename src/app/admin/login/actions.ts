"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"

export async function login(formData: FormData) {
  const password = formData.get("password")
  const correctPassword = process.env.ADMIN_PASSWORD || "usemaria123"

  if (password === correctPassword) {
    const cookieStore = await cookies()
    cookieStore.set("admin_session", "true", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/",
    })
    
    redirect("/admin")
  } else {
    redirect("/admin/login?error=true")
  }
}

export async function logout() {
  const cookieStore = await cookies()
  cookieStore.delete("admin_session")
  redirect("/")
}
