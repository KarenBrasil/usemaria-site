import Image from "next/image";
import Link from "next/link";
import prisma from "@/lib/prisma";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const dynamic = 'force-dynamic';

export default async function Home() {
  const products = await prisma.product.findMany({
    include: { sizes: true },
    orderBy: { createdAt: 'desc' },
    take: 50 // Show 50 products on the homepage as requested
  });

  const settings = await prisma.storeSettings.findUnique({ where: { id: "default" } })
  const defaultSettings = settings || {
    storeName: "USE MARIA",
    hero1Title: "Vista Sua Fé",
    hero1Subtitle: "Nova Coleção",
    hero1Image: "/images/catalog/page-0001.jpg", // Needs to be a lifestyle photo later
    hero2Title: "O Look Perfeito",
    hero2Subtitle: "Escolha da Estilista",
    hero2Text: "Capturado por @fotografo",
    hero2Image: "/images/catalog/page-0006.jpg",
    whatsappNumber: "5585994277446",
    instagramUrl: "#",
    tiktokUrl: "#"
  }

  return (
    <div className="flex flex-col min-h-screen font-sans bg-white text-black">
      <Header settings={defaultSettings} />

      {/* HERO SECTION */}
      <section className="relative w-full h-[70vh] md:h-[85vh] bg-[#F5F3EF] overflow-hidden flex items-center">
        {/* Lifestyle background image - offset to right on desktop */}
        <div className="absolute inset-0 md:left-1/4 w-full md:w-3/4 h-full z-0">
          <Image
            src={defaultSettings.hero1Image}
            alt={defaultSettings.hero1Title}
            fill
            className="object-cover object-top opacity-90 mix-blend-multiply"
            priority
          />
        </div>
        
        {/* Hero Content aligned to left */}
        <div className="relative z-10 w-full max-w-[1400px] mx-auto px-8 md:px-12 flex flex-col items-start pt-10">
          <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-[#8B7355] mb-4">
            {defaultSettings.hero1Subtitle}
          </p>
          <h1 className="text-6xl md:text-[100px] font-serif leading-[0.9] text-black mb-6 uppercase tracking-tight flex flex-col">
            {defaultSettings.hero1Title.split(' ').map((word, i) => (
              <span key={i}>{word}</span>
            ))}
          </h1>
          <p className="text-lg md:text-xl text-zinc-800 mb-8 max-w-sm">
            Peças que evangelizam, inspiram e transformam.
          </p>
          <Link href="/colecoes" className="bg-[#1A1A1A] text-white uppercase text-[10px] tracking-widest font-bold py-4 px-8 flex items-center gap-4 hover:bg-black transition-colors">
            Compre Agora <span className="text-lg leading-none">→</span>
          </Link>
        </div>

        {/* Floating 50% off badge */}
        <div className="absolute right-8 top-1/4 z-20 w-32 h-32 bg-[#F5F3EF]/90 rounded-full flex flex-col items-center justify-center shadow-lg border border-white/50 backdrop-blur-sm hidden md:flex">
           <span className="text-xs uppercase tracking-widest text-[#8B7355] font-bold">Até</span>
           <span className="text-3xl font-serif text-[#8B7355]">50%</span>
           <span className="text-xs uppercase tracking-widest text-[#8B7355] font-bold">Off</span>
        </div>
      </section>

      {/* FEATURES BAR */}
      <section className="bg-[#F5F3EF] py-8 px-4 md:px-12 w-full border-t border-zinc-200/50">
        <div className="max-w-[1400px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 divide-x divide-zinc-300/50">
          <div className="flex flex-col items-center text-center px-4">
            <svg className="mb-2 text-zinc-800" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-black">Tendência Agora</h4>
            <p className="text-[10px] text-zinc-500 mt-1">O que está em alta</p>
          </div>
          <div className="flex flex-col items-center text-center px-4">
            <svg className="mb-2 text-zinc-800" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-black">Mais Vendidos</h4>
            <p className="text-[10px] text-zinc-500 mt-1">Favoritos da comunidade</p>
          </div>
          <div className="flex flex-col items-center text-center px-4">
            <svg className="mb-2 text-zinc-800" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.29 7 12 12 20.71 7"/><line x1="12" y1="22" x2="12" y2="12"/></svg>
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-black">Lançamentos</h4>
            <p className="text-[10px] text-zinc-500 mt-1">Novas peças toda semana</p>
          </div>
          <div className="flex flex-col items-center text-center px-4">
            <svg className="mb-2 text-zinc-800" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-black">Envio Nacional</h4>
            <p className="text-[10px] text-zinc-500 mt-1">Com amor e propósito</p>
          </div>
        </div>
      </section>

      {/* COLLECTION GRID */}
      <section className="py-20 px-4 md:px-8 max-w-[1400px] mx-auto w-full">
        <div className="text-center mb-16">
          <span className="text-zinc-400 block mb-2 text-lg">✝</span>
          <h2 className="text-sm font-bold uppercase tracking-[0.3em] text-black px-4">
            Escolhas de Estilo
          </h2>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {products.map((product) => (
            <div key={product.id} className="group flex flex-col text-center">
              <Link href={`/product/${product.id}`} className="relative aspect-[4/5] bg-[#f5f5f5] mb-4 overflow-hidden block">
                <span className="absolute top-3 left-3 z-10 text-[9px] font-bold uppercase tracking-widest bg-white px-3 py-1 shadow-sm">
                  Novo
                </span>
                <Image
                  src={product.image || "/images/catalog/page-0001.jpg"}
                  alt={product.name}
                  fill
                  className="object-cover object-[center_20%] mix-blend-multiply group-hover:scale-110 transition-transform duration-700 ease-in-out"
                />
              </Link>
              <Link href={`/product/${product.id}`} className="flex flex-col items-center">
                <h3 className="text-xs font-bold text-zinc-900 mb-1 tracking-widest uppercase">{product.name}</h3>
                <p className="text-xs text-zinc-500 mb-2 font-medium">R$ {product.price.toFixed(2).replace('.', ',')}</p>
                <div className="flex gap-2 text-[9px] uppercase text-zinc-400 font-bold justify-center flex-wrap">
                  {['P', 'M', 'G', 'GG'].map((s) => (
                    <span key={s} className="px-1">{s}</span>
                  ))}
                </div>
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* BANNERS SECTION */}
      <section className="px-4 md:px-8 max-w-[1400px] mx-auto w-full mb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Black Banner */}
          <div className="bg-[#1A1A1A] text-white p-8 md:p-12 rounded flex items-center justify-between overflow-hidden relative">
            <div className="relative z-10 flex items-center gap-6">
               <div className="w-16 h-16 rounded-full border border-white/20 flex items-center justify-center shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
               </div>
               <div>
                  <p className="text-[10px] uppercase tracking-widest text-white/70 font-bold mb-1">Oferta por tempo limitado</p>
                  <h3 className="text-2xl md:text-3xl font-serif text-[#F5F3EF]">Até 50% OFF</h3>
               </div>
            </div>
            <button className="relative z-10 border border-white/30 px-6 py-3 text-[10px] uppercase tracking-widest font-bold hover:bg-white hover:text-black transition-colors flex items-center gap-2">
              Aproveite <span>→</span>
            </button>
          </div>
          
          {/* Beige Banner */}
          <div className="bg-[#F5F3EF] text-black p-8 md:p-12 rounded flex items-center justify-between">
            <div className="flex items-center gap-6">
               <div className="w-16 h-16 rounded-full border border-black/10 flex items-center justify-center shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>
               </div>
               <div>
                  <h3 className="text-sm font-bold uppercase tracking-widest mb-1">Frete Grátis Nacional</h3>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Em compras acima de R$199</p>
               </div>
            </div>
            <button className="border border-black/20 px-6 py-3 text-[10px] uppercase tracking-widest font-bold hover:bg-black hover:text-white transition-colors flex items-center gap-2">
              Eu quero <span>→</span>
            </button>
          </div>
        </div>
      </section>

      {/* EDITORIAL SECTION */}
      <section className="px-4 md:px-8 max-w-[1400px] mx-auto w-full mb-10">
        <div className="flex items-center justify-between mb-8 border-t border-zinc-200 pt-10">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-black">
            Use Maria no seu dia
          </h2>
          <Link href={defaultSettings.instagramUrl} className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-black flex items-center gap-2">
            Ver Mais <span>→</span>
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

      <Footer settings={defaultSettings} />
    </div>
  );
}
