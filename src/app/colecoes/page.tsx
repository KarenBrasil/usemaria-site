import Image from "next/image";
import Link from "next/link";
import prisma from "@/lib/prisma";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const dynamic = 'force-dynamic';

export default async function ColecoesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const resolvedSearchParams = await searchParams;
  const query = resolvedSearchParams?.q || "";

  const products = await prisma.product.findMany({
    where: {
      name: {
        contains: query,
        mode: 'insensitive',
      }
    },
    include: { sizes: true },
    orderBy: { createdAt: 'desc' }
  });

  const settings = await prisma.storeSettings.findUnique({ where: { id: "default" } })
  const defaultSettings = settings || {
    storeName: "USE MARIA",
    whatsappNumber: "5585994277446",
    instagramUrl: "#",
    tiktokUrl: "#"
  }

  return (
    <div className="flex flex-col min-h-screen font-sans bg-white text-black">
      <Header settings={defaultSettings} />

      <main className="flex-1 py-12 px-4 md:px-8 max-w-[1400px] mx-auto w-full">
        <div className="text-center mb-12">
          <span className="text-zinc-400 block mb-2 text-lg">✝</span>
          <h1 className="text-2xl md:text-3xl font-serif uppercase tracking-widest text-black mb-4">
            Catálogo Completo
          </h1>
          <p className="text-xs text-zinc-500 max-w-xl mx-auto uppercase tracking-widest leading-relaxed">
            Explore todas as nossas peças. Fé que veste, propósito que transforma.
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-md mx-auto mb-16 relative">
          <form action="/colecoes" method="GET" className="flex">
            <input 
              type="text" 
              name="q" 
              defaultValue={query}
              placeholder="Buscar por estampa ou modelo..." 
              className="w-full border-b-2 border-zinc-200 py-3 pl-10 pr-4 focus:outline-none focus:border-black text-sm transition-colors bg-transparent"
            />
            <button type="submit" className="absolute left-0 top-3 text-zinc-400 hover:text-black">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            </button>
          </form>
          {query && (
            <p className="text-xs text-zinc-500 mt-3 text-center">
              Mostrando resultados para: <span className="font-bold text-black">{query}</span> ({products.length})
            </p>
          )}
        </div>

        {products.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-zinc-500">Nenhum produto encontrado com esse nome.</p>
            <Link href="/colecoes" className="inline-block mt-4 border-b border-black text-xs font-bold uppercase tracking-widest pb-1 hover:text-zinc-500 hover:border-zinc-500 transition-colors">Ver todas as peças</Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {products.map((product) => (
              <div key={product.id} className="group flex flex-col text-center">
                <Link href={`/product/${product.id}`} className="relative aspect-[4/5] bg-[#f5f5f5] mb-4 overflow-hidden block">
                  {product.isNew && (
                    <span className="absolute top-3 left-3 z-10 text-[9px] font-bold uppercase tracking-widest bg-white px-3 py-1 shadow-sm">
                      Novo
                    </span>
                  )}
                  <Image
                    src={product.image || "/images/catalog/page-0001.jpg"}
                    alt={product.name}
                    fill
                    className="object-cover object-[center_20%] scale-[1.3] mix-blend-multiply group-hover:scale-[1.4] transition-transform duration-700 ease-in-out"
                  />
                </Link>
                <Link href={`/product/${product.id}`} className="flex flex-col items-center">
                  <h3 className="text-xs font-bold text-zinc-900 mb-1 tracking-widest uppercase">{product.name}</h3>
                  <p className="text-xs text-zinc-500 mb-4 font-medium">R$ {product.price.toFixed(2).replace('.', ',')}</p>
                  <span className="w-full border border-black text-black uppercase text-[10px] tracking-widest font-bold py-2 hover:bg-black hover:text-white transition-colors">
                    Ver Detalhes
                  </span>
                </Link>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer settings={defaultSettings} />
    </div>
  );
}
