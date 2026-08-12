'use client'

import { useState } from "react";
import { useCartStore } from "@/contexts/CartContext";

type AddToCartProps = {
  product: {
    id: string;
    name: string;
    price: number;
    wholesalePrice: number | null;
    image: string | null;
  };
  availableSizes: string[];
};

export default function AddToCartSection({ product, availableSizes }: AddToCartProps) {
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const addItem = useCartStore((state) => state.addItem);
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddToCart = async () => {
    if (!selectedSize) return;
    
    setLoading(true);
    setError(null);
    setAdded(false);
    
    try {
      await addItem({
        productId: product.id,
        name: product.name,
        price: product.price,
        wholesalePrice: product.wholesalePrice || 34.90,
        size: selectedSize,
        image: product.image || "/images/catalog/page-0001.jpg",
      });
      
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch (err: any) {
      setError(err.message || "Não foi possível reservar este item.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <span className="text-xs uppercase tracking-widest font-semibold">Tamanho (Disponíveis)</span>
      </div>
      
      {availableSizes.length === 1 && (
         <div className="mb-3 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2 rounded-sm flex items-center gap-2">
           <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
           Só tem 1 unidade disponível! Se você colocar no carrinho, ficará esgotada para os outros.
         </div>
      )}

      <div className="flex gap-3 mb-6">
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
          <span className="text-sm font-bold text-red-500 bg-red-50 px-4 py-2 border border-red-200 w-full text-center">ESGOTADO NO MOMENTO</span>
        )}
      </div>

      {error && (
        <div className="mb-4 text-xs font-bold text-red-600 bg-red-50 border border-red-200 p-3 rounded-sm">
          {error}
        </div>
      )}

      <button 
        onClick={handleAddToCart}
        disabled={!selectedSize || availableSizes.length === 0 || loading}
        className={`w-full uppercase text-sm tracking-widest font-bold py-5 transition-colors flex justify-center items-center text-center ${
          !selectedSize || availableSizes.length === 0 || loading
            ? "bg-zinc-200 text-zinc-500 cursor-not-allowed" 
            : added
              ? "bg-green-600 text-white"
              : "bg-black text-white hover:bg-zinc-800"
        }`}
      >
        {loading ? "Reservando..." : added ? "Reservado no Carrinho!" : "Adicionar à Sacola"}
      </button>
    </div>
  );
}
