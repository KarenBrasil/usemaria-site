import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { tokenValido } from './admin-auth'

/**
 * Trava de seguranca para as paginas do admin.
 *
 * Antes a protecao vivia SO no proxy.ts. Se o proxy nao rodasse (troca de
 * hospedagem, erro de configuracao), o painel inteiro ficava aberto.
 * Agora cada pagina do admin confere por conta propria.
 */
export async function exigirAdmin() {
  const cookieStore = await cookies()
  if (!(await tokenValido(cookieStore.get('admin_session')?.value))) {
    redirect('/admin/login')
  }
}
