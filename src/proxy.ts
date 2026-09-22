import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { tokenValido } from '@/lib/admin-auth'

export async function proxy(request: NextRequest) {
  const cookie = request.cookies.get('admin_session')?.value
  const autenticado = await tokenValido(cookie)

  if (request.nextUrl.pathname.startsWith('/admin') && request.nextUrl.pathname !== '/admin/login') {
    if (!autenticado) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
  }

  if (request.nextUrl.pathname === '/admin/login' && autenticado) {
    return NextResponse.redirect(new URL('/admin', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin', '/admin/:path*'],
}
