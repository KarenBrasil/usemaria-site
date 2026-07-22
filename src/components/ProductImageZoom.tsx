'use client'

import Image from "next/image";
import { useState } from "react";

export default function ProductImageZoom({ src, alt }: { src: string, alt: string }) {
  const [isZoomed, setIsZoomed] = useState(false);

  return (
    <>
      <div 
        className="relative aspect-[3/4] w-full bg-[#f5f5f5] overflow-hidden cursor-zoom-in group"
        onClick={() => setIsZoomed(true)}
      >
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover object-[center_20%] scale-[1.3] mix-blend-multiply transition-transform duration-500 group-hover:scale-[1.4]"
          priority
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center">
            <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-white text-black px-4 py-2 text-xs font-bold uppercase tracking-widest shadow-sm rounded-full">
                Ampliar
            </span>
        </div>
      </div>

      {isZoomed && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center cursor-zoom-out p-4"
          onClick={() => setIsZoomed(false)}
        >
          <div className="relative w-full max-w-4xl aspect-[3/4] max-h-screen overflow-hidden">
            <Image
              src={src}
              alt={alt}
              fill
              className="object-contain scale-[1.3] object-[center_20%]"
              priority
            />
          </div>
          <button 
            className="absolute top-6 right-8 text-white text-sm uppercase tracking-widest font-bold border border-white/30 px-4 py-2 rounded-full hover:bg-white hover:text-black transition-colors"
            onClick={(e) => { e.stopPropagation(); setIsZoomed(false); }}
          >
            Fechar
          </button>
        </div>
      )}
    </>
  );
}
