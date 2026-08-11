import Link from "next/link";
import { logout } from "../login/actions";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#f7f7f7] font-sans text-black selection:bg-black selection:text-white">
      <aside className="w-64 bg-white border-r border-zinc-200 flex-col hidden md:flex sticky top-0 h-screen shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
        <div className="p-8 pb-4">
          <Link href="/admin" className="block">
            <h1 className="text-2xl font-black tracking-tighter uppercase text-zinc-900">USE MARIA</h1>
            <p className="text-[10px] text-zinc-400 uppercase tracking-[0.2em] mt-1 font-bold">Admin Panel</p>
          </Link>
        </div>
        
        <nav className="flex flex-col flex-1 py-4 px-3 gap-1">
          <Link href="/admin" className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-100/80 text-zinc-600 hover:text-black rounded-xl text-sm font-bold tracking-wide transition-all group">
            <svg className="w-5 h-5 text-zinc-400 group-hover:text-black transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
            Visão Geral
          </Link>
          
          <Link href="/admin/produtos" className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-100/80 text-zinc-600 hover:text-black rounded-xl text-sm font-bold tracking-wide transition-all group">
            <svg className="w-5 h-5 text-zinc-400 group-hover:text-black transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
            Produtos
          </Link>
          
          <Link href="/admin/vendas" className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-100/80 text-zinc-600 hover:text-black rounded-xl text-sm font-bold tracking-wide transition-all group">
            <svg className="w-5 h-5 text-zinc-400 group-hover:text-black transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Pedidos
          </Link>
          
          <Link href="/admin/configuracoes" className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-100/80 text-zinc-600 hover:text-black rounded-xl text-sm font-bold tracking-wide transition-all group">
            <svg className="w-5 h-5 text-zinc-400 group-hover:text-black transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            Configurações
          </Link>
          
          <div className="mt-auto px-1">
            <form action={logout}>
              <button type="submit" className="w-full flex items-center justify-center gap-2 py-3.5 bg-red-50/50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-bold uppercase tracking-widest transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                Sair
              </button>
            </form>
          </div>
        </nav>
      </aside>
      
      <main className="flex-1 max-w-[1200px] w-full mx-auto p-4 md:p-10 lg:p-12 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
