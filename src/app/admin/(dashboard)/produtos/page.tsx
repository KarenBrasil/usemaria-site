import prisma from "@/lib/prisma"
import Image from "next/image"
import Link from "next/link"
import { deleteProduct } from "../../actions"
import Toast from "@/components/Toast"
import { Suspense } from "react"

export const dynamic = 'force-dynamic';

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const resolvedParams = await searchParams;
  const searchQuery = resolvedParams.q;

  const products = await prisma.product.findMany({ 
    where: {
      ...(searchQuery ? { name: { contains: searchQuery, mode: 'insensitive' } } : {})
    },
    include: { sizes: true },
    orderBy: { createdAt: 'desc' }
  })
  
  return (
    <div className="pb-20">
      <Suspense fallback={null}>
        <Toast />
      </Suspense>
      <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900">Gestão de Produtos</h2>
          <p className="text-sm text-zinc-500 mt-1">Cadastre novas peças, gerencie o estoque e defina os preços.</p>
        </div>
        
        <div className="flex gap-3">
          <form className="relative">
            <input 
              type="text" 
              name="q" 
              defaultValue={searchQuery || ""}
              placeholder="Buscar pelo nome..." 
              className="bg-white border border-zinc-300 rounded-xl px-4 py-3.5 pl-10 text-xs font-bold w-full md:w-64 focus:outline-none focus:border-black"
            />
            <svg className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </form>
          
          <Link href="/admin/produtos/novo" className="bg-zinc-900 shrink-0 text-white uppercase text-[11px] font-bold tracking-widest px-6 py-3.5 rounded-xl hover:bg-zinc-800 transition-colors shadow-sm flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
            Adicionar Peça
          </Link>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {products.length === 0 ? (
          <div className="col-span-full bg-white rounded-2xl border border-zinc-200 p-16 text-center shadow-sm">
            <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-zinc-100">
               <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
            </div>
            <h3 className="text-lg font-bold text-zinc-900">Nenhum produto cadastrado</h3>
            <p className="text-zinc-500 mt-1 text-sm">Clique em "Adicionar Peça" para começar a montar seu catálogo.</p>
          </div>
        ) : (
          products.map((p: any) => (
            <div key={p.id} className="bg-white border border-zinc-200 rounded-2xl p-5 flex flex-col hover:shadow-md hover:border-zinc-300 transition-all group">
              <div className="flex items-start gap-5 mb-4">
                {/* Imagem */}
                <div className="relative w-24 h-28 bg-zinc-100 rounded-xl overflow-hidden shrink-0 border border-zinc-100">
                  {p.image ? (
                    <Image src={p.image} alt={p.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-400 text-xs">Sem foto</div>
                  )}
                </div>
                
                {/* Infos Básicas */}
                <div className="flex-1">
                  <div className="flex justify-between items-start gap-2 mb-1">
                    <h3 className="font-bold text-lg leading-tight text-zinc-900 line-clamp-2">{p.name}</h3>
                    {p.isNew && <span className="shrink-0 bg-zinc-900 text-white text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full font-bold">Novo</span>}
                    {p.isDraft && <span className="shrink-0 bg-zinc-100 text-zinc-600 border border-zinc-200 text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full font-bold">Rascunho</span>}
                  </div>
                  <p className="font-bold text-zinc-500 mb-3">R$ {p.price.toFixed(2).replace('.', ',')}</p>
                  
                  {/* Estoque */}
                  <div className="flex flex-wrap gap-1">
                    {p.sizes.length === 0 ? (
                      <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-100 uppercase tracking-wider">Esgotado</span>
                    ) : (
                      p.sizes.map((s: any) => (
                        <span key={s.size} className="text-[10px] font-bold text-zinc-600 bg-zinc-50 px-2 py-0.5 rounded border border-zinc-200">
                          {s.size} <span className="text-zinc-400 font-normal">({s.stock})</span>
                        </span>
                      ))
                    )}
                  </div>
                </div>
              </div>
              
              {/* Ações */}
              <div className="mt-auto flex items-center justify-between pt-4 border-t border-zinc-100">
                <form action={deleteProduct.bind(null, p.id)}>
                  <button type="submit" className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg font-medium text-xs uppercase tracking-widest transition-colors flex items-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </form>
                
                <Link href={`/admin/produtos/${p.id}/editar`} className="bg-zinc-50 hover:bg-zinc-100 text-zinc-700 px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-widest transition-colors flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                  Editar
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
