import Image from "next/image";
import Link from "next/link";
import prisma from "@/lib/prisma";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const dynamic = 'force-dynamic';

export default async function Home({ searchParams }: { searchParams: { cat?: string, q?: string } }) {
  const categoryId = searchParams.cat;
  const searchQuery = searchParams.q;
  const filterType = searchParams.filter; // 'atacado', 'promocao', 'novidade'

  const products = await prisma.product.findMany({
    where: {
      ...(categoryId ? { categoryId } : {}),
      ...(searchQuery ? { name: { contains: searchQuery, mode: 'insensitive' } } : {}),
      ...(filterType === 'atacado' ? { isWholesale: true } : {}),
      ...(filterType === 'promocao' ? { isPromotion: true } : {}),
      ...(filterType === 'novidade' ? { isNew: true } : {}),
    },
    include: { sizes: true, category: true },
    orderBy: { createdAt: 'desc' },
    take: 50
  });

  const categories = await prisma.category.findMany({
    orderBy: { name: 'asc' }
  });

  const settings = await prisma.storeSettings.findUnique({ where: { id: "default" } })
  const defaultSettings = settings || {
    storeName: "USE MARIA",
    hero1Title: "Vista Sua Fé",
    hero1Subtitle: "Nova Coleção",
    hero1Text: "T-shirts femininas estampadas com delicadeza e propósito. Vista-se de amor e devoção todos os dias.",
    hero1Image: "/images/catalog/page-0001.jpg", 
    feature1Title: "Qualidade Premium",
    feature1Text: "Algodão sustentável",
    feature2Title: "Compre no Atacado",
    feature2Text: "A partir de 10 peças",
    feature3Title: "Design Exclusivo",
    feature3Text: "Estampas católicas",
    feature4Title: "Envio para todo Brasil",
    feature4Text: "Rapidez e segurança",
    collectionTitle: "Nossas Estampas",
    collectionSubtitle: "Escolha a devoção que mais toca o seu coração.",
    editorialTitle: "Devoção em cada detalhe",
    editorialSubtitle: "Acompanhe nosso trabalho no instagram",
    hero2Title: "O Look Perfeito",
    hero2Subtitle: "Escolha da Estilista",
    hero2Text: "Capturado por @fotografo",
    hero2Image: "/images/catalog/page-0006.jpg",
    whatsappNumber: "5585994277446",
    instagramUrl: "#",
    tiktokUrl: "#"
  }

  // Fallbacks seguros se a migração ainda não rodou em prod
  const safeSettings = {
    ...defaultSettings,
    hero1Text: (defaultSettings as any).hero1Text || "T-shirts femininas estampadas com delicadeza e propósito. Vista-se de amor e devoção todos os dias.",
    feature1Title: (defaultSettings as any).feature1Title || "Qualidade Premium",
    feature1Text: (defaultSettings as any).feature1Text || "Algodão sustentável",
    feature2Title: (defaultSettings as any).feature2Title || "Compre no Atacado",
    feature2Text: (defaultSettings as any).feature2Text || "A partir de 10 peças",
    feature3Title: (defaultSettings as any).feature3Title || "Design Exclusivo",
    feature3Text: (defaultSettings as any).feature3Text || "Estampas católicas",
    feature4Title: (defaultSettings as any).feature4Title || "Envio para todo Brasil",
    feature4Text: (defaultSettings as any).feature4Text || "Rapidez e segurança",
    collectionTitle: (defaultSettings as any).collectionTitle || "Nossas Estampas",
    collectionSubtitle: (defaultSettings as any).collectionSubtitle || "Escolha a devoção que mais toca o seu coração.",
    editorialTitle: (defaultSettings as any).editorialTitle || "Devoção em cada detalhe",
    editorialSubtitle: (defaultSettings as any).editorialSubtitle || "Acompanhe nosso trabalho no instagram",
  };

  return (
    <div className="flex flex-col min-h-screen font-sans bg-[#FCFBF9] text-zinc-900">
      <Header 
        settings={safeSettings as any} 
        currentFilter={filterType} 
        currentCat={categoryId} 
      />

      {/* HERO SECTION - ESTÉTICA CATÓLICA */}
      <section className="relative w-full h-[60vh] md:h-[80vh] bg-[#FCFBF9] overflow-hidden flex items-center border-b border-amber-200/30">
        <div className="absolute inset-0 md:left-[30%] w-full md:w-[70%] h-full z-0">
          <Image
            src={safeSettings.hero1Image}
            alt={safeSettings.hero1Title}
            fill
            className="object-cover object-top opacity-90 mix-blend-multiply"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#FCFBF9] via-[#FCFBF9]/80 to-transparent"></div>
        </div>
        
        <div className="relative z-10 w-full max-w-[1400px] mx-auto px-8 md:px-12 flex flex-col items-start pt-10">
          <div className="flex items-center gap-3 mb-6">
            <p className="text-[11px] uppercase tracking-[0.3em] font-medium text-amber-600">
              {safeSettings.hero1Subtitle}
            </p>
          </div>
          
          <h1 className="text-5xl md:text-[80px] font-serif leading-[1.1] text-zinc-900 mb-6 tracking-tight flex flex-col">
            <span className="font-light italic text-zinc-700">{safeSettings.hero1Title.split(' ')[0]}</span>
            <span className="font-medium text-amber-800">{safeSettings.hero1Title.split(' ').slice(1).join(' ')}</span>
          </h1>
          
          <p className="text-base md:text-lg text-zinc-600 mb-10 max-w-md font-light leading-relaxed">
            {safeSettings.hero1Text}
          </p>
          
          <Link href="/colecoes" className="group relative overflow-hidden bg-white border border-amber-200 text-amber-800 uppercase text-[11px] tracking-[0.2em] font-medium py-4 px-10 transition-all hover:bg-amber-50 hover:border-amber-300">
            <span className="relative z-10 flex items-center gap-4">Ver Coleção Completa <span className="text-lg leading-none group-hover:translate-x-1 transition-transform">→</span></span>
          </Link>
        </div>
      </section>

      {/* FEATURES BAR - CLEAN */}
      <section className="bg-white py-10 px-4 md:px-12 w-full border-b border-zinc-100">
        <div className="max-w-[1200px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-zinc-100">
          <div className="flex flex-col items-center text-center px-4">
            <h4 className="text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-800">{safeSettings.feature1Title}</h4>
            <p className="text-[11px] text-zinc-400 mt-2 font-serif italic">{safeSettings.feature1Text}</p>
          </div>
          <div className="flex flex-col items-center text-center px-4">
            <h4 className="text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-800">{safeSettings.feature2Title}</h4>
            <p className="text-[11px] text-zinc-400 mt-2 font-serif italic">{safeSettings.feature2Text}</p>
          </div>
          <div className="flex flex-col items-center text-center px-4">
            <h4 className="text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-800">{safeSettings.feature3Title}</h4>
            <p className="text-[11px] text-zinc-400 mt-2 font-serif italic">{safeSettings.feature3Text}</p>
          </div>
          <div className="flex flex-col items-center text-center px-4">
            <h4 className="text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-800">{safeSettings.feature4Title}</h4>
            <p className="text-[11px] text-zinc-400 mt-2 font-serif italic">{safeSettings.feature4Text}</p>
          </div>
        </div>
      </section>

      {/* COLLECTION GRID */}
      <section className="py-24 px-4 md:px-8 max-w-[1400px] mx-auto w-full">
        <div className="text-center mb-12">
          <span className="text-amber-300 block mb-3 text-xl font-serif">†</span>
          <h2 className="text-2xl md:text-3xl font-serif text-zinc-900 px-4 mb-4">
            {searchQuery ? `Resultados para: "${searchQuery}"` : safeSettings.collectionTitle}
          </h2>
          {!searchQuery && (
            <p className="text-sm text-zinc-500 font-light max-w-md mx-auto">
              {safeSettings.collectionSubtitle}
            </p>
          )}
        </div>

        {/* CATEGORY FILTERS */}
        <div className="flex flex-wrap justify-center gap-4 mb-16 px-4">
          <Link 
            href="/" 
            className={`text-[11px] uppercase tracking-[0.15em] pb-1 border-b-2 transition-colors ${!categoryId && !filterType ? 'border-amber-500 text-zinc-900 font-medium' : 'border-transparent text-zinc-400 hover:text-zinc-600'}`}
          >
            Todas
          </Link>
          <Link 
            href="/?filter=novidade" 
            className={`text-[11px] uppercase tracking-[0.15em] pb-1 border-b-2 transition-colors ${filterType === 'novidade' ? 'border-amber-500 text-zinc-900 font-medium' : 'border-transparent text-zinc-400 hover:text-zinc-600'}`}
          >
            Novidades
          </Link>
          <Link 
            href="/?filter=atacado" 
            className={`text-[11px] uppercase tracking-[0.15em] pb-1 border-b-2 transition-colors ${filterType === 'atacado' ? 'border-amber-500 text-zinc-900 font-medium' : 'border-transparent text-zinc-400 hover:text-zinc-600'}`}
          >
            Atacado
          </Link>
          <Link 
            href="/?filter=promocao" 
            className={`text-[11px] uppercase tracking-[0.15em] pb-1 border-b-2 transition-colors ${filterType === 'promocao' ? 'border-amber-500 text-zinc-900 font-medium' : 'border-transparent text-zinc-400 hover:text-zinc-600'}`}
          >
            Promoção
          </Link>
          <span className="text-zinc-300">|</span>
          {categories.map(cat => (
            <Link 
              key={cat.id}
              href={`/?cat=${cat.id}`} 
              className={`text-[11px] uppercase tracking-[0.15em] pb-1 border-b-2 transition-colors ${categoryId === cat.id ? 'border-amber-500 text-zinc-900 font-medium' : 'border-transparent text-zinc-400 hover:text-zinc-600'}`}
            >
              {cat.name}
            </Link>
          ))}

        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-16">
          {products.map((product) => (
            <div key={product.id} className="group flex flex-col text-center">
              <Link href={`/product/${product.id}`} className="relative aspect-[4/5] bg-white mb-5 overflow-hidden block border border-zinc-100">
                <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
                  {product.isNew && (
                    <span className="text-[9px] font-bold uppercase tracking-[0.2em] bg-white text-zinc-800 px-3 py-1 shadow-sm">
                      Novo
                    </span>
                  )}
                  {product.isPromotion && (
                    <span className="text-[9px] font-bold uppercase tracking-[0.2em] bg-red-600 text-white px-3 py-1 shadow-sm">
                      Promoção
                    </span>
                  )}
                  {product.isWholesale && (
                    <span className="text-[9px] font-bold uppercase tracking-[0.2em] bg-amber-500 text-white px-3 py-1 shadow-sm">
                      Atacado
                    </span>
                  )}
                </div>
                <Image
                  src={product.image || "/images/catalog/page-0001.jpg"}
                  alt={product.name}
                  fill
                  className="object-cover object-[center_20%] mix-blend-multiply transition-transform duration-1000 ease-in-out group-hover:scale-105"
                />
                
                {/* Overlay Hover Suave */}
                <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              </Link>
              
              <div className="flex flex-col items-center flex-1 px-2">
                <Link href={`/product/${product.id}`} className="block w-full">
                  <h3 className="text-[13px] font-serif text-zinc-800 mb-1 line-clamp-1">
                    {product.name}
                  </h3>
                </Link>
                
                <div className="flex items-center gap-2 mb-2">
                  {product.oldPrice && (
                    <span className="text-xs text-zinc-400 line-through">
                      R$ {product.oldPrice.toFixed(2).replace('.', ',')}
                    </span>
                  )}
                  <span className="text-sm font-medium text-zinc-900">
                    R$ {product.price.toFixed(2).replace('.', ',')}
                  </span>
                </div>
                
                {product.wholesalePrice && (
                  <span className="text-[10px] uppercase tracking-widest text-amber-600 font-medium">
                    Atacado: R$ {product.wholesalePrice.toFixed(2).replace('.', ',')}
                  </span>
                )}
              </div>
            </div>
          ))}
          
          {products.length === 0 && (
            <div className="col-span-full text-center py-12 text-zinc-500 font-serif italic">
              Nenhuma peça encontrada nesta categoria.
            </div>
          )}
        </div>
      </section>


      {/* EDITORIAL SECTION */}
      <section className="px-4 md:px-8 max-w-[1400px] mx-auto w-full mb-16">
        <div className="flex flex-col items-center text-center mb-10 border-t border-amber-200/40 pt-16">
          <h2 className="text-2xl font-serif text-zinc-900 mb-2">
            {safeSettings.editorialTitle}
          </h2>
          <p className="text-xs text-zinc-500 font-light mb-6">{safeSettings.editorialSubtitle}</p>
          <Link href={safeSettings.instagramUrl} target="_blank" className="text-[10px] font-medium uppercase tracking-widest text-amber-700 hover:text-amber-900 flex items-center gap-2 border-b border-amber-200 pb-1 transition-colors">
            @{safeSettings.instagramUrl.split('instagram.com/')[1] || 'usemaria'} <span>→</span>
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="relative aspect-square bg-[#F5F3EF]">
            <Image src="/images/catalog/page-0010.jpg" alt="Editorial 1" fill className="object-cover mix-blend-multiply" />
          </div>
          <div className="relative aspect-square bg-[#F5F3EF]">
            <Image src="/images/catalog/page-0015.jpg" alt="Editorial 2" fill className="object-cover mix-blend-multiply" />
          </div>
          <div className="relative aspect-square bg-[#F5F3EF]">
            <Image src="/images/catalog/page-0020.jpg" alt="Editorial 3" fill className="object-cover mix-blend-multiply" />
          </div>
          <div className="relative aspect-square bg-[#F5F3EF]">
            <Image src="/images/catalog/page-0025.jpg" alt="Editorial 4" fill className="object-cover mix-blend-multiply" />
          </div>
        </div>
      </section>

      <Footer settings={safeSettings as any} />
    </div>
  );
}
