import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50 font-sans text-black">
      <aside className="w-64 bg-white border-r border-zinc-200 flex flex-col hidden md:flex">
        <div className="p-8 border-b border-zinc-100">
          <h1 className="text-xl font-bold tracking-[0.2em] uppercase">Use Maria</h1>
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">Admin Panel</p>
        </div>
        <nav className="flex flex-col flex-1 py-6 gap-2 px-4">
          <Link href="/admin" className="p-3 bg-zinc-900 text-white rounded text-sm font-medium tracking-wide">Produtos</Link>
          <Link href="#" className="p-3 hover:bg-zinc-100 text-zinc-600 rounded text-sm font-medium tracking-wide transition-colors">Categorias</Link>
          <Link href="#" className="p-3 hover:bg-zinc-100 text-zinc-600 rounded text-sm font-medium tracking-wide transition-colors">Pedidos</Link>
          
          <div className="mt-auto">
            <Link href="/" className="p-3 flex items-center hover:bg-zinc-100 text-red-600 rounded text-sm font-medium tracking-wide transition-colors">
              Sair para Loja
            </Link>
          </div>
        </nav>
      </aside>
      <main className="flex-1 p-8 md:p-12 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
