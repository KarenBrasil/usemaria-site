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
    whatsappNumber: "5585992659192"
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
        <div className="w-full md:w-1/2 flex flex-col gap-4 relative">
          <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
            {product.isNew && (
              <span className="text-[9px] font-bold uppercase tracking-[0.2em] bg-white text-zinc-800 px-3 py-1 shadow-sm w-fit">
                Novo
              </span>
            )}
            {product.isPromotion && (
              <span className="text-[9px] font-bold uppercase tracking-[0.2em] bg-red-600 text-white px-3 py-1 shadow-sm w-fit">
                Promoção
              </span>
            )}
            {product.isWholesale && (
              <span className="text-[9px] font-bold uppercase tracking-[0.2em] bg-amber-500 text-white px-3 py-1 shadow-sm w-fit">
                Atacado
              </span>
            )}
          </div>
          <ProductImageZoom 
            images={product.images && product.images.length > 0 ? product.images : (product.image ? [product.image] : ["/images/catalog/page-0001.jpg"])} 
            alt={product.name} 
          />
        </div>

        {/* Lado Direito - Informações de Compra */}
        <div className="w-full md:w-1/2 flex flex-col pt-8 md:pt-16 md:sticky md:top-24 h-fit">
          <h1 className="text-3xl md:text-4xl font-serif mb-4">{product.name}</h1>
          <div className="flex flex-col mb-8">
            <div className="flex items-center gap-3">
              {product.oldPrice && (
                <span className="text-lg text-zinc-400 line-through font-medium">
                  R$ {product.oldPrice.toFixed(2).replace('.', ',')}
                </span>
              )}
              <p className="text-xl text-zinc-900 font-bold">R$ {product.price.toFixed(2).replace('.', ',')} <span className="text-sm font-normal text-zinc-500">no varejo</span></p>
            </div>
            
            <div className="mt-1">
              <p className="text-[11px] text-zinc-400 tracking-wider">
                Ou <span className="text-zinc-700 font-semibold">R$ {(product.wholesalePrice || 34.90).toFixed(2).replace('.', ',')}</span> no atacado
              </p>
            </div>
          </div>
          
          <AddToCartSection 
            product={{
              id: product.id,
              name: product.name,
              price: product.price,
              wholesalePrice: product.wholesalePrice,
              image: product.image,
              isWholesale: product.isWholesale
            }} 
            sizes={product.sizes} 
            reservationMap={reservationMap} 
          />

          {/* Acordeão de Informações */}
          <div className="border-t border-zinc-200">
            <div className="py-6 border-b border-zinc-200">
              <h3 className="text-xs uppercase tracking-widest font-bold mb-4">Descrição</h3>
              <p className="text-sm text-zinc-600 leading-relaxed whitespace-pre-wrap">{product.description || "Peça exclusiva com design autoral."}</p>
            </div>
            <div className="py-6 border-b border-zinc-200">
              <h3 className="text-xs uppercase tracking-widest font-bold mb-4">Envio e Devolução</h3>
              <p className="text-sm text-zinc-600 leading-relaxed mb-6">Frete por retirada/uber entrega (falar no WhatsApp). Trocas em até 7 dias após o recebimento.</p>
              
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
