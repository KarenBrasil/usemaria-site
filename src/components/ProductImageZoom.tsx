'use client'

import Image from "next/image";
import { useState } from "react";

export default function ProductImageZoom({ images, alt }: { images: string[], alt: string }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);

  const currentImage = images[currentIndex] || "/images/catalog/page-0001.jpg";

  return (
    <div className="flex flex-col md:flex-row-reverse gap-4 w-full">
      
      {/* Main Image */}
      <div 
        className="relative flex-1 aspect-[3/4] bg-[#f5f5f5] overflow-hidden cursor-zoom-in group rounded-xl border border-zinc-100"
        onClick={() => setIsZoomed(true)}
      >
        <Image
          src={currentImage}
          alt={alt}
          fill
          className="object-cover object-[center_20%] scale-[1.05] mix-blend-multiply transition-transform duration-700 ease-in-out group-hover:scale-[1.1]"
          priority
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center">
            <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-white text-black px-4 py-2 text-xs font-bold uppercase tracking-widest shadow-sm rounded-full">
                Ampliar
            </span>
        </div>
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-y-auto no-scrollbar md:w-20 md:h-[calc(100vh-200px)] md:max-h-[800px] shrink-0 pb-2 md:pb-0">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`relative w-16 md:w-20 aspect-[3/4] rounded-lg overflow-hidden border-2 shrink-0 transition-all ${
                currentIndex === idx ? 'border-amber-500 shadow-md' : 'border-transparent hover:border-zinc-300 opacity-70 hover:opacity-100'
              }`}
            >
              <Image 
                src={img} 
                alt={`${alt} - Foto ${idx + 1}`} 
                fill 
                className="object-cover mix-blend-multiply"
              />
            </button>
          ))}
        </div>
      )}

      {/* Zoom Modal */}
      {isZoomed && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center cursor-zoom-out p-4 backdrop-blur-sm"
          onClick={() => setIsZoomed(false)}
        >
          <div className="relative w-full max-w-4xl aspect-[3/4] max-h-[90vh] overflow-hidden rounded-2xl bg-[#f5f5f5]">
            <Image
              src={currentImage}
              alt={alt}
              fill
              className="object-contain scale-[1.05] object-[center_20%] mix-blend-multiply"
              priority
            />
          </div>
          <button 
            className="absolute top-6 right-8 text-white text-sm uppercase tracking-widest font-bold bg-white/10 hover:bg-white hover:text-black border border-white/30 px-6 py-3 rounded-full transition-colors"
            onClick={(e) => { e.stopPropagation(); setIsZoomed(false); }}
          >
            Fechar
          </button>
        </div>
      )}
    </div>
  );
}
