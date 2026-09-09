import Image from "next/image";
import Link from "next/link";
import prisma from "@/lib/prisma";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CategoryFilters from "@/components/CategoryFilters";

export const dynamic = 'force-dynamic';

export default async function Home({ searchParams }: { searchParams: Promise<{ cat?: string, q?: string, filter?: string }> }) {
  const resolvedParams = await searchParams;
  const categoryId = resolvedParams.cat;
  const searchQuery = resolvedParams.q;
  const filterType = resolvedParams.filter; // 'atacado', 'promocao', 'novidade'

  const products = await prisma.product.findMany({
    where: {
      ...(categoryId ? { categoryId } : {}),
      ...(searchQuery ? { name: { contains: searchQuery, mode: 'insensitive' } } : {}),
      ...(filterType === 'atacado' ? { isWholesale: true } : {}),
      ...(filterType === 'promocao' ? { isPromotion: true } : {}),
      ...(filterType === 'novidade' ? { isNew: true } : {}),
      isDraft: false
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
    hero2Image: "/images/catalog/page-0006.jpg",
    whatsappNumber: "5585992659192",
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

      {/* HERO SECTION */}
      <section className="relative isolate w-full min-h-[620px] md:min-h-[720px] bg-[#F9F6F1] overflow-hidden border-b border-[#E7DDD1]">
        <div className="absolute inset-y-0 right-0 w-full md:w-[57%]">
          <Image
            src={safeSettings.hero1Image}
            alt={safeSettings.hero1Title}
            fill
            className="object-cover object-center"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#F9F6F1] via-[#F9F6F1]/75 to-transparent"></div>
          <div className="absolute inset-0 bg-[#2E2018]/5"></div>
        </div>

        <div className="relative z-10 flex min-h-[620px] md:min-h-[720px] w-full max-w-[1440px] mx-auto px-7 sm:px-10 md:px-16 lg:px-24 items-center">
          <div className="max-w-[680px] pt-12 md:pt-0">
            <div className="flex items-center gap-3 mb-8">
              <span className="h-px w-10 bg-[#B55412]"></span>
              <p className="text-[10px] md:text-[11px] uppercase tracking-[0.34em] font-semibold text-[#B55412]">
              {safeSettings.hero1Subtitle}
              </p>
            </div>

            <h1 className="font-serif tracking-[-0.045em] leading-[0.91] text-[#343239] mb-7">
              <span className="block text-[72px] sm:text-[90px] md:text-[116px] font-light italic text-[#4B4850]">
                {safeSettings.hero1Title.split(' ')[0]}
              </span>
              <span className="block text-[52px] sm:text-[68px] md:text-[92px] font-medium text-[#A54309]">
                {safeSettings.hero1Title.split(' ').slice(1).join(' ')}
              </span>
            </h1>

            <div className="w-12 h-px bg-[#D8B999] mb-7"></div>
            <p className="text-[15px] md:text-[17px] text-[#68636A] mb-10 max-w-[460px] leading-[1.75] font-normal">
              {safeSettings.hero1Text}
            </p>

          </div>

          <p className="absolute bottom-8 right-7 md:right-16 text-[9px] uppercase tracking-[0.3em] text-[#756B64]/80">Use Maria · fé vestida de propósito</p>
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
      <section id="catalogo" className="py-24 px-4 md:px-8 max-w-[1400px] mx-auto w-full">
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
        <CategoryFilters 
          categories={categories}
          currentFilter={filterType}
          currentCat={categoryId}
        />

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
                
                <div className="flex flex-col items-center gap-1 mb-2">
                  <div className="flex items-center gap-2">
                    {product.oldPrice && (
                      <span className="text-xs text-zinc-400 line-through">
                        R$ {product.oldPrice.toFixed(2).replace('.', ',')}
                      </span>
                    )}
                    <span className="text-sm font-medium text-zinc-900">
                      R$ {product.price.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                  {product.isWholesale && (
                    <span className="text-[10px] text-zinc-400 tracking-wider mt-0.5">
                      Ou <span className="text-zinc-700 font-semibold">R$ {(product.wholesalePrice || 34.90).toFixed(2).replace('.', ',')}</span> (Atacado)
                    </span>
                  )}
                </div>
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
