"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { criarToken, senhaCorreta } from "@/lib/admin-auth"

export async function login(formData: FormData) {
  if (!senhaCorreta(formData.get("password"))) {
    redirect("/admin/login?error=true")
  }

  const token = await criarToken()
  if (!token) {
    // Sem segredo configurado nao da para criar sessao segura: melhor barrar.
    redirect("/admin/login?error=true")
  }

  const cookieStore = await cookies()
  cookieStore.set("admin_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 1 semana
    path: "/",
  })

  redirect("/admin")
}

export async function logout() {
  const cookieStore = await cookies()
  cookieStore.delete("admin_session")
  redirect("/")
}
