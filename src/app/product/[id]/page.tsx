import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductImageZoom from "@/components/ProductImageZoom";
import AddToCartSection from "@/components/AddToCartSection";

export const dynamic = 'force-dynamic';

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const product = await prisma.product.findUnique({
    where: { id: resolvedParams.id },
    include: { sizes: true }
  });

  if (!product) {
    notFound();
  }

  const settings = await prisma.storeSettings.findUnique({ where: { id: "default" } })
  const defaultSettings = settings || {
    storeName: "USE MARIA",
    whatsappNumber: "5585994277446"
  }

  // Calculate real available stock (physical - reserved)
  const now = new Date();
  const activeReservations = await prisma.reservation.groupBy({
    by: ['productSizeId'],
    where: {
      productSize: { productId: product.id },
      expiresAt: { gt: now }
    },
    _sum: { quantity: true }
  });

  const reservationMap = new Map(activeReservations.map(r => [r.productSizeId, r._sum.quantity || 0]));

  const availableSizes = product.sizes.filter(s => {
    const reserved = reservationMap.get(s.id) || 0;
    const available = s.stock - reserved;
    return available > 0 && s.size !== 'GG';
  }).map(s => s.size);

  const phoneNumber = defaultSettings.whatsappNumber; // From StoreSettings
  const waLink = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(`Olá, gostaria de encomendar a peça *${product.name}* (ID: ${product.id}). Qual o valor do frete?`)}`;

  return (
    <div className="flex flex-col min-h-screen bg-white font-sans text-black">
      <Header settings={defaultSettings} />

      {/* PRODUCT DETAILS SECTION */}
      <main className="flex-grow flex flex-col md:flex-row w-full max-w-[1400px] mx-auto px-4 md:px-8 py-12 gap-12 lg:gap-24">
        
        {/* Lado Esquerdo - Galeria de Imagens */}
        <div className="w-full md:w-1/2 flex flex-col gap-4">
          <ProductImageZoom src={product.image || "/images/catalog/page-0001.jpg"} alt={product.name} />
        </div>

        {/* Lado Direito - Informações de Compra */}
        <div className="w-full md:w-1/2 flex flex-col pt-8 md:pt-16 md:sticky md:top-24 h-fit">
          <h1 className="text-3xl md:text-4xl font-serif mb-4">{product.name}</h1>
          <div className="flex flex-col mb-8">
            <p className="text-xl text-zinc-900 font-bold">R$ {product.price.toFixed(2).replace('.', ',')} <span className="text-sm font-normal text-zinc-500">no varejo</span></p>
            <div className="mt-2 text-sm bg-green-50 text-green-700 px-3 py-2 rounded font-medium border border-green-100 flex items-center gap-2 w-fit">
               <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
               Atacado: R$ {product.wholesalePrice ? product.wholesalePrice.toFixed(2).replace('.', ',') : '34,90'} <span className="opacity-70 text-xs">(a partir de 10 peças variadas)</span>
            </div>
          </div>
          
          <AddToCartSection product={product} availableSizes={availableSizes} />

          {/* Acordeão de Informações */}
          <div className="border-t border-zinc-200">
            <div className="py-6 border-b border-zinc-200">
              <h3 className="text-xs uppercase tracking-widest font-bold mb-4">Descrição</h3>
              <p className="text-sm text-zinc-600 leading-relaxed whitespace-pre-wrap">{product.description || "Peça exclusiva com design autoral."}</p>
            </div>
            <div className="py-6 border-b border-zinc-200">
              <h3 className="text-xs uppercase tracking-widest font-bold mb-4">Envio e Devolução</h3>
              <p className="text-sm text-zinc-600 leading-relaxed mb-6">Combine o frete ou retirada pelo WhatsApp. Trocas em até 7 dias após o recebimento.</p>
              
              <h3 className="text-xs uppercase tracking-widest font-bold mb-4 text-center bg-zinc-50 py-2">Tabela de Medidas</h3>
              <div className="relative w-full aspect-[4/5] max-w-sm mx-auto border border-zinc-200 bg-[#FBF9F6]">
                <Image 
                  src="/images/catalog/page-0003.jpg" 
                  alt="Tabela de Tamanhos" 
                  fill 
                  className="object-contain mix-blend-multiply p-4" 
                />
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* FOOTER */}
      <Footer settings={defaultSettings} />
    </div>
  );
}
