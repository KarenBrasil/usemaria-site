import prisma from "@/lib/prisma"
import Image from "next/image"
import Link from "next/link"
import { deleteProduct } from "../../actions"
import Toast from "@/components/Toast"
import { Suspense } from "react"

export const dynamic = 'force-dynamic';

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ q?: string, size?: string, filter?: string }> }) {
  const resolvedParams = await searchParams;
  const searchQuery = resolvedParams.q || '';
  const sizeFilter = resolvedParams.size || 'all';
  const typeFilter = resolvedParams.filter || 'all';

  let allProducts = await prisma.product.findMany({ 
    include: { sizes: true },
    orderBy: { createdAt: 'desc' }
  });

  // Calculate Metrics
  let totalItems = 0;
  let outOfStock = 0;
  let lowStock = 0;
  const sizeCounts: Record<string, number> = {};

  allProducts.forEach(p => {
    p.sizes.forEach(s => {
      totalItems += s.stock;
      if (s.stock === 0) outOfStock++;
      else if (s.stock <= 5 && s.stock > 0) lowStock++;
      
      sizeCounts[s.size] = (sizeCounts[s.size] || 0) + s.stock;
    });
  });

  const sortedSizes = Object.entries(sizeCounts).sort((a, b) => {
    const order = { 'PP': 1, 'P': 2, 'M': 3, 'G': 4, 'GG': 5, 'XG': 6 };
    return (order[a[0] as keyof typeof order] || 99) - (order[b[0] as keyof typeof order] || 99);
  });

  // Apply Search and Filters
  let products = allProducts;

  if (searchQuery) {
    const lowerQ = searchQuery.toLowerCase();
    products = products.filter(p => p.name.toLowerCase().includes(lowerQ));
  }

  if (typeFilter === 'esgotados') {
    products = products.filter(p => p.sizes.some(s => s.stock === 0));
  } else if (typeFilter === 'baixo_estoque') {
    products = products.filter(p => p.sizes.some(s => s.stock > 0 && s.stock <= 5));
  }

  if (sizeFilter !== 'all') {
    products = products.filter(p => p.sizes.some(s => s.size === sizeFilter));
  }
  
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
      
      {/* Filtros e Métricas de Estoque */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <Link href={`/admin/produtos?filter=all&size=${sizeFilter}&q=${searchQuery}`} className={`border p-5 rounded-xl shadow-sm transition-all ${typeFilter === 'all' ? 'bg-zinc-900 border-zinc-900 text-white' : 'bg-white border-zinc-200 hover:border-black text-zinc-900'}`}>
          <p className={`text-[10px] uppercase tracking-widest font-bold mb-2 ${typeFilter === 'all' ? 'text-zinc-400' : 'text-zinc-500'}`}>Total de Peças Físicas</p>
          <p className="text-3xl font-black tracking-tighter">{totalItems}</p>
        </Link>
        <Link href={`/admin/produtos?filter=esgotados&size=${sizeFilter}&q=${searchQuery}`} className={`border p-5 rounded-xl shadow-sm transition-all ${typeFilter === 'esgotados' ? 'bg-red-900 border-red-900 text-white' : 'bg-red-50 border-red-200 text-red-800 hover:border-red-300'}`}>
          <p className={`text-[10px] uppercase tracking-widest font-bold mb-2 ${typeFilter === 'esgotados' ? 'text-red-300' : 'text-red-800'}`}>Modelos com Variação Esgotada</p>
          <p className="text-3xl font-black tracking-tighter">{outOfStock}</p>
        </Link>
        <Link href={`/admin/produtos?filter=baixo_estoque&size=${sizeFilter}&q=${searchQuery}`} className={`border p-5 rounded-xl shadow-sm transition-all ${typeFilter === 'baixo_estoque' ? 'bg-amber-900 border-amber-900 text-white' : 'bg-amber-50 border-amber-200 text-amber-800 hover:border-amber-300'}`}>
          <p className={`text-[10px] uppercase tracking-widest font-bold mb-2 ${typeFilter === 'baixo_estoque' ? 'text-amber-300' : 'text-amber-800'}`}>Modelos c/ Baixo Estoque (≤ 5)</p>
          <p className="text-3xl font-black tracking-tighter">{lowStock}</p>
        </Link>
      </div>

      <div className="flex flex-wrap gap-3 mb-8">
        <Link href={`/admin/produtos?size=all&filter=${typeFilter}&q=${searchQuery}`} className={`px-4 py-3 rounded-xl border flex flex-col items-center justify-center min-w-[80px] transition-all ${sizeFilter === 'all' ? 'bg-zinc-900 text-white border-zinc-900 shadow-md' : 'bg-white text-zinc-600 border-zinc-200 hover:border-black'}`}>
          <span className="text-[10px] font-bold uppercase tracking-widest">Todos</span>
        </Link>
        {sortedSizes.map(([size, count]) => (
          <Link key={size} href={`/admin/produtos?size=${size}&filter=${typeFilter}&q=${searchQuery}`} className={`px-4 py-3 rounded-xl border flex flex-col items-center justify-center min-w-[80px] transition-all ${sizeFilter === size ? 'bg-zinc-900 text-white border-zinc-900 shadow-md' : 'bg-white text-zinc-600 border-zinc-200 hover:border-black'}`}>
            <span className="text-lg font-black leading-none mb-1">{size}</span>
            <span className={`text-[10px] font-bold uppercase tracking-widest ${sizeFilter === size ? 'text-zinc-300' : 'text-zinc-400'}`}>{count} un</span>
          </Link>
        ))}
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
