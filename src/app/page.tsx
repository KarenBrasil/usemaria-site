import Image from "next/image";
import Link from "next/link";

import prisma from "@/lib/prisma";

// We will fetch real data from the database inside the component


const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
);

const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
);

const CartIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
);

export default async function Home() {
  const products = await prisma.product.findMany({
    include: { sizes: true },
    orderBy: { createdAt: 'desc' },
    take: 8 // Fetch latest 8 products
  });

  const firstCollection = products.slice(0, 4);
  const secondCollection = products.slice(4, 8);

  return (
    <div className="flex flex-col min-h-screen font-sans bg-white text-black">
      
      {/* HEADER (Transparent, absolute positioned over hero) */}
      <header className="absolute top-0 left-0 w-full z-20 flex items-center justify-between px-8 py-6 text-white uppercase text-xs tracking-[0.15em] font-medium mix-blend-difference">
        <Link href="/" className="text-xl tracking-[0.25em] font-bold">USE MARIA</Link>
        <nav className="hidden lg:flex gap-8">
          <Link href="#" className="hover:opacity-70 transition-opacity">Loja</Link>
          <Link href="#" className="hover:opacity-70 transition-opacity">Novidades</Link>
          <Link href="#" className="hover:opacity-70 transition-opacity">Coleções</Link>
          <Link href="#" className="hover:opacity-70 transition-opacity">Básicos</Link>
          <Link href="#" className="hover:opacity-70 transition-opacity">Mais Vendidos</Link>
        </nav>
        <div className="flex gap-6 items-center">
          <Link href="#" className="hover:opacity-70 transition-opacity hidden md:block">Conta</Link>
          <button className="hover:opacity-70 transition-opacity"><SearchIcon /></button>
          <button className="hover:opacity-70 transition-opacity relative">
            <CartIcon />
            <span className="absolute -top-1 -right-2 bg-white text-black text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">0</span>
          </button>
        </div>
      </header>

      {/* HERO SECTION 1 */}
      <section className="relative w-full h-[85vh] bg-zinc-900 overflow-hidden flex items-center justify-center">
        <Image
          src="/images/catalog/page-0001.jpg"
          alt="Coleção Principal Use Maria"
          fill
          className="object-cover object-top opacity-80"
          priority
        />
        <div className="relative z-10 flex flex-col items-center justify-center text-white text-center mt-20">
          <p className="text-xs uppercase tracking-[0.2em] mb-4 font-semibold">Lançamento Exclusivo Online</p>
          <h1 className="text-6xl md:text-8xl font-serif italic mb-8 drop-shadow-lg">A Coleção Divina</h1>
          <button className="bg-white text-black uppercase text-xs tracking-widest font-bold py-4 px-10 rounded-full hover:bg-black hover:text-white hover:border-transparent border border-white transition-all duration-300">
            Comprar Agora
          </button>
        </div>
      </section>

      {/* FIRST COLLECTION GRID */}
      <section className="py-20 px-4 md:px-8 max-w-[1600px] mx-auto w-full">
        <div className="text-center mb-12 flex items-center justify-center gap-4">
          <div className="h-px bg-zinc-200 flex-1 hidden md:block"></div>
          <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-black px-4">
            Comprar A Coleção Divina
          </h2>
          <div className="h-px bg-zinc-200 flex-1 hidden md:block"></div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {firstCollection.map((product) => (
            <div key={product.id} className="group flex flex-col text-center">
              <Link href={`/product/${product.id}`} className="relative aspect-[3/4] bg-[#f5f5f5] mb-5 overflow-hidden block">
                <span className="absolute top-3 left-3 z-10 text-[10px] font-bold uppercase tracking-wider bg-white px-2 py-1 shadow-sm">
                  Novo
                </span>
                <Image
                  src={product.image || "/images/catalog/page-0001.jpg"}
                  alt={product.name}
                  fill
                  className="object-cover object-top mix-blend-multiply group-hover:scale-105 transition-transform duration-700 ease-in-out"
                />
              </Link>
              <Link href={`/product/${product.id}`} className="flex flex-col items-center px-2">
                <h3 className="text-xs font-bold text-zinc-900 mb-1 tracking-wide">{product.name}</h3>
                <p className="text-xs text-zinc-500 mb-3">R$ {product.price.toFixed(2).replace('.', ',')}</p>
                <div className="flex gap-3 text-[10px] uppercase text-zinc-400 font-medium justify-center flex-wrap">
                  {product.sizes.filter((s: any) => s.stock > 0).map((s: any) => (
                    <span key={s.size} className="hover:text-black cursor-pointer transition-colors border-b border-transparent hover:border-black">{s.size}</span>
                  ))}
                </div>
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* HERO SECTION 2 (EDITORIAL) */}
      <section className="relative w-full h-[70vh] bg-zinc-900 overflow-hidden flex items-center justify-center">
        <Image
          src="/images/catalog/page-0006.jpg"
          alt="Destaque Use Maria"
          fill
          className="object-cover object-center opacity-70"
        />
        <div className="relative z-10 flex flex-col items-center justify-center text-white text-center">
          <p className="text-[10px] uppercase tracking-[0.3em] mb-3">Escolha da Estilista</p>
          <h2 className="text-5xl md:text-6xl font-serif italic mb-4">O Look Perfeito</h2>
          <p className="text-xs tracking-widest uppercase mb-8 opacity-90">Capturado por @fotografo</p>
          <button className="bg-white text-black uppercase text-xs tracking-widest font-bold py-3 px-8 rounded-full hover:bg-black hover:text-white transition-all duration-300">
            Explorar Peças
          </button>
        </div>
      </section>

      {/* SECOND COLLECTION GRID */}
      <section className="py-20 px-4 md:px-8 max-w-[1600px] mx-auto w-full">
        <div className="text-center mb-12 flex items-center justify-center gap-4">
          <div className="h-px bg-zinc-200 flex-1 hidden md:block"></div>
          <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-black px-4">
            Escolhas de Estilo
          </h2>
          <div className="h-px bg-zinc-200 flex-1 hidden md:block"></div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {secondCollection.map((product) => (
            <div key={product.id} className="group flex flex-col text-center">
              <Link href={`/product/${product.id}`} className="relative aspect-[3/4] bg-[#f5f5f5] mb-5 overflow-hidden block">
                <span className="absolute top-3 left-3 z-10 text-[10px] font-bold uppercase tracking-wider bg-white px-2 py-1 shadow-sm">
                  Novo
                </span>
                <Image
                  src={product.image || "/images/catalog/page-0001.jpg"}
                  alt={product.name}
                  fill
                  className="object-cover object-top mix-blend-multiply group-hover:scale-105 transition-transform duration-700 ease-in-out"
                />
              </Link>
              <Link href={`/product/${product.id}`} className="flex flex-col items-center px-2">
                <h3 className="text-xs font-bold text-zinc-900 mb-1 tracking-wide">{product.name}</h3>
                <p className="text-xs text-zinc-500 mb-3">R$ {product.price.toFixed(2).replace('.', ',')}</p>
                <div className="flex gap-3 text-[10px] uppercase text-zinc-400 font-medium justify-center flex-wrap">
                  {product.sizes.filter((s: any) => s.stock > 0).map((s: any) => (
                    <span key={s.size} className="hover:text-black cursor-pointer transition-colors border-b border-transparent hover:border-black">{s.size}</span>
                  ))}
                </div>
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER PREVIEW */}
      <footer className="bg-[#f8f8f8] border-t border-zinc-200 text-black py-16 px-8 flex flex-col items-center mt-auto">
         <div className="text-2xl tracking-[0.2em] font-bold mb-6">USE MARIA</div>
         <div className="flex gap-6 mb-12 text-xs uppercase tracking-widest font-medium">
            <Link href="#" className="hover:text-zinc-500">Instagram</Link>
            <Link href="#" className="hover:text-zinc-500">TikTok</Link>
            <Link href="#" className="hover:text-zinc-500">Contato</Link>
         </div>
         <p className="text-[10px] tracking-widest uppercase mb-4 opacity-40">© 2026 UseMaria. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}
