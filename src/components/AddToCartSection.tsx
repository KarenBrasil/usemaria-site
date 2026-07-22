'use client'

import { useState } from "react";
import { useCartStore } from "@/contexts/CartContext";

type AddToCartProps = {
  product: {
    id: string;
    name: string;
    price: number;
    image: string | null;
  };
  availableSizes: string[];
};

export default function AddToCartSection({ product, availableSizes }: AddToCartProps) {
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const addItem = useCartStore((state) => state.addItem);
  const [added, setAdded] = useState(false);

  const handleAddToCart = () => {
    if (!selectedSize) return;
    
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      size: selectedSize,
      image: product.image || "/images/catalog/page-0001.jpg",
    });

    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <span className="text-xs uppercase tracking-widest font-semibold">Tamanho (Disponíveis)</span>
        <button className="text-xs text-zinc-400 underline hover:text-black">Guia de Medidas</button>
      </div>
      
      <div className="flex gap-3 mb-8">
        {availableSizes.length > 0 ? availableSizes.map((size) => (
          <button 
            key={size}
            onClick={() => setSelectedSize(size)}
            className={`w-12 h-12 border flex items-center justify-center text-sm transition-all ${
              selectedSize === size 
                ? "border-black bg-black text-white" 
                : "border-zinc-200 hover:border-black"
            }`}
          >
            {size}
          </button>
        )) : (
          <span className="text-sm text-red-500">Esgotado</span>
        )}
      </div>

      <button 
        onClick={handleAddToCart}
        disabled={!selectedSize || availableSizes.length === 0}
        className={`w-full uppercase text-sm tracking-widest font-bold py-5 transition-colors flex justify-center items-center text-center ${
          !selectedSize || availableSizes.length === 0
            ? "bg-zinc-200 text-zinc-500 cursor-not-allowed" 
            : added
              ? "bg-green-600 text-white"
              : "bg-black text-white hover:bg-zinc-800"
        }`}
      >
        {added ? "Adicionado!" : "Adicionar à Sacola"}
      </button>
    </div>
  );
}
