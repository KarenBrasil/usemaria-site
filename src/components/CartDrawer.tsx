'use client'

import { useCartStore } from "@/contexts/CartContext";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export default function CartDrawer() {
  const { items, removeItem, cartTotal, cartCount } = useCartStore();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button 
        className="hover:opacity-70 transition-opacity relative"
        onClick={() => setIsOpen(true)}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
        <span className="absolute -top-1 -right-2 bg-zinc-200 text-black text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
          {cartCount()}
        </span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsOpen(false)} />
          <div className="relative w-full max-w-md bg-white h-full flex flex-col shadow-2xl animate-in slide-in-from-right">
            <div className="flex items-center justify-between p-6 border-b border-zinc-100">
              <h2 className="text-sm font-bold uppercase tracking-widest">Sua Sacola ({cartCount()})</h2>
              <button onClick={() => setIsOpen(false)} className="text-zinc-400 hover:text-black">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-zinc-500 gap-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                  <p className="text-xs uppercase tracking-widest">Sua sacola está vazia.</p>
                </div>
              ) : (
                items.map(item => (
                  <div key={item.id} className="flex gap-4">
                    <div className="relative w-20 h-24 bg-zinc-100 shrink-0">
                      <Image src={item.image} alt={item.name} fill className="object-cover object-[center_20%] mix-blend-multiply" />
                    </div>
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start mb-1">
                          <h3 className="text-[10px] font-bold uppercase tracking-widest">{item.name}</h3>
                          <button onClick={() => removeItem(item.id)} className="text-zinc-400 hover:text-red-500">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                          </button>
                        </div>
                        <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Tam: {item.size}</p>
                        <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">Qtd: {item.quantity}</p>
                      </div>
                      <p className="text-xs font-medium">R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {items.length > 0 && (
              <div className="p-6 border-t border-zinc-100 bg-[#F5F3EF]">
                <div className="flex justify-between mb-4">
                  <span className="text-xs font-bold uppercase tracking-widest">Subtotal</span>
                  <span className="text-lg font-serif">R$ {cartTotal().toFixed(2).replace('.', ',')}</span>
                </div>
                <p className="text-[9px] uppercase tracking-widest text-zinc-500 mb-6">Frete grátis e cálculo no checkout</p>
                <Link 
                  href="/checkout" 
                  onClick={() => setIsOpen(false)}
                  className="w-full bg-black text-white uppercase text-xs tracking-widest font-bold py-4 hover:bg-zinc-800 transition-colors flex justify-center items-center text-center"
                >
                  Finalizar Compra
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
