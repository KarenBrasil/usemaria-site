'use client'

import { useState, useMemo } from "react";
import { useCartStore } from "@/contexts/CartContext";

type ProductSize = {
  id: string;
  size: string;
  color: string;
  stock: number;
};

type AddToCartProps = {
  product: {
    id: string;
    name: string;
    price: number;
    wholesalePrice: number | null;
    image: string | null;
    isWholesale: boolean;
  };
  sizes: ProductSize[];
  reservationMap: Map<string, number>;
};

export default function AddToCartSection({ product, sizes, reservationMap }: AddToCartProps) {
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [colorQuantities, setColorQuantities] = useState<Record<string, number>>({});
  
  const addItem = useCartStore((state) => state.addItem);
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [showWholesaleWarning, setShowWholesaleWarning] = useState(false);
  const [pendingCartAdd, setPendingCartAdd] = useState(false);

  // Filter sizes that have actual physical availability OR are wholesale
  const availableSizesMap = useMemo(() => {
    const map = new Map<string, ProductSize[]>();
    for (const s of sizes) {
      if (s.size === 'GG') continue; // Hidden per requirements
      const reserved = reservationMap.get(s.id) || 0;
      const available = Math.max(0, s.stock - reserved);
      
      if (available > 0 || product.isWholesale) {
        if (!map.has(s.size)) map.set(s.size, []);
        map.get(s.size)!.push({ ...s, stock: available });
      }
    }
    return map;
  }, [sizes, reservationMap, product.isWholesale]);

  const availableSizeKeys = Array.from(availableSizesMap.keys());

  const handleSizeSelect = (size: string) => {
    setSelectedSize(size);
    setColorQuantities({});
    setError(null);
  };

  const handleQuantityChange = (color: string, delta: number, stock: number) => {
    const max = product.isWholesale ? 100 : stock;
    setColorQuantities(prev => {
      const current = prev[color] || 0;
      const next = current + delta;
      if (next < 0 || next > max) return prev;
      return { ...prev, [color]: next };
    });
  };

  const totalSelectedQuantity = Object.values(colorQuantities).reduce((acc, q) => acc + q, 0);

  const processAddToCart = async (isPreOrder: boolean = false) => {
    if (!selectedSize || totalSelectedQuantity === 0) return;
    
    setLoading(true);
    setError(null);
    setAdded(false);
    setShowWholesaleWarning(false);
    
    try {
      const promises = Object.entries(colorQuantities).map(async ([color, qty]) => {
        if (qty > 0) {
          for (let i = 0; i < qty; i++) {
            await addItem({
              productId: product.id,
              name: product.name,
              price: product.price,
              wholesalePrice: product.wholesalePrice || 34.90,
              size: selectedSize,
              color: color,
              image: product.image || "/images/catalog/page-0001.jpg",
              isWholesaleProduct: product.isWholesale,
              isPreOrder: isPreOrder
            });
          }
        }
      });
      
      await Promise.all(promises);
      
      setAdded(true);
      setColorQuantities({}); // Reset
      setTimeout(() => setAdded(false), 2000);
    } catch (err: any) {
      setError(err.message || "Não foi possível adicionar os itens à sacola.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCartClick = () => {
    if (!selectedSize) return;

    // Check if they are trying to order more than physical stock
    let needsPreOrder = false;
    const variants = availableSizesMap.get(selectedSize) || [];
    
    for (const [color, qty] of Object.entries(colorQuantities)) {
      const variant = variants.find(v => v.color === color);
      if (variant && qty > variant.stock) {
        needsPreOrder = true;
        break;
      }
    }

    if (needsPreOrder) {
      setShowWholesaleWarning(true);
    } else {
      processAddToCart(false);
    }
  };

  return (
    <div className="mb-8">
      {showWholesaleWarning && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-zinc-900 mb-2">Comprar por Encomenda (Atacado)</h3>
            <p className="text-sm text-zinc-600 mb-6 leading-relaxed">
              Você selecionou uma quantidade maior que o nosso estoque imediato de varejo. Deseja encomendar essas peças para o <strong>Atacado</strong>? <br/><br/>
              <span className="font-semibold text-amber-700 bg-amber-50 px-2 py-1 rounded">O pedido mínimo de atacado é de 10 peças no total do carrinho.</span> O prazo de produção é de 5 dias.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowWholesaleWarning(false)} 
                className="flex-1 border border-zinc-200 text-zinc-600 font-bold text-xs uppercase tracking-widest py-3 rounded-xl hover:bg-zinc-50 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={() => processAddToCart(true)} 
                className="flex-1 bg-black text-white font-bold text-xs uppercase tracking-widest py-3 rounded-xl hover:bg-zinc-800 transition-colors"
              >
                Sim, Encomendar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-4">
        <span className="text-xs uppercase tracking-widest font-semibold">1. Escolha o Tamanho</span>
      </div>
      
      <div className="flex gap-3 mb-6">
        {availableSizeKeys.length > 0 ? availableSizeKeys.map((size) => (
          <button 
            key={size}
            onClick={() => handleSizeSelect(size)}
            className={`w-12 h-12 border flex items-center justify-center text-sm font-bold transition-all ${
              selectedSize === size 
                ? "border-black bg-black text-white" 
                : "border-zinc-200 hover:border-black text-zinc-700"
            }`}
          >
            {size}
          </button>
        )) : (
          <span className="text-sm font-bold text-red-500 bg-red-50 px-4 py-2 border border-red-200 w-full text-center">ESGOTADO NO MOMENTO</span>
        )}
      </div>

      {selectedSize && (
        <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex justify-between items-center mb-4">
            <span className="text-xs uppercase tracking-widest font-semibold">2. Escolha as Cores e Quantidade</span>
          </div>
          
          <div className="flex flex-col gap-3 bg-zinc-50 border border-zinc-100 p-4 rounded-xl">
            {availableSizesMap.get(selectedSize)?.map((variant) => {
              const qty = colorQuantities[variant.color] || 0;
              const max = product.isWholesale ? 100 : variant.stock;
              return (
                <div key={variant.id} className="flex items-center justify-between bg-white border border-zinc-200 p-3 rounded-lg shadow-sm">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-zinc-900 capitalize">{variant.color}</span>
                    <span className={`text-[10px] uppercase tracking-wider ${variant.stock === 0 ? 'text-amber-600 font-bold' : 'text-zinc-400'}`}>
                      {variant.stock === 0 ? "Sob Encomenda (Atacado)" : `${variant.stock} disponíveis`}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => handleQuantityChange(variant.color, -1, variant.stock)}
                      disabled={qty === 0}
                      className="w-8 h-8 flex items-center justify-center rounded-full border border-zinc-200 bg-zinc-50 text-zinc-600 disabled:opacity-50"
                    >
                      -
                    </button>
                    <span className="text-sm font-bold w-4 text-center">{qty}</span>
                    <button 
                      onClick={() => handleQuantityChange(variant.color, 1, variant.stock)}
                      disabled={qty >= max}
                      className="w-8 h-8 flex items-center justify-center rounded-full border border-zinc-200 bg-zinc-50 text-zinc-600 disabled:opacity-50"
                    >
                      +
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 text-xs font-bold text-red-600 bg-red-50 border border-red-200 p-3 rounded-lg">
          {error}
        </div>
      )}

      <button 
        onClick={handleAddToCartClick}
        disabled={totalSelectedQuantity === 0 || loading}
        className={`w-full uppercase text-sm tracking-widest font-bold py-5 transition-colors flex justify-center items-center text-center rounded-xl shadow-lg ${
          totalSelectedQuantity === 0 || loading
            ? "bg-zinc-200 text-zinc-500 cursor-not-allowed shadow-none" 
            : added
              ? "bg-green-600 text-white"
              : "bg-zinc-900 text-white hover:bg-black"
        }`}
      >
        {loading ? "Processando..." : added ? "Adicionado à Sacola!" : `Adicionar à Sacola (${totalSelectedQuantity} unid.)`}
      </button>
    </div>
  );
}
