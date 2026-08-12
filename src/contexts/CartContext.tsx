'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type CartItem = {
  id: string; // productId + size
  productId: string;
  name: string;
  price: number;
  wholesalePrice?: number;
  size: string;
  image: string;
  quantity: number;
}

type CartState = {
  cartId: string;
  expiresAt: number | null;
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'id' | 'quantity'>) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  updateQuantity: (id: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  cartTotal: () => number;
  cartCount: () => number;
}

const syncWithBackend = async (cartId: string, items: CartItem[]) => {
  if (items.length === 0) {
    await fetch('/api/cart/reserve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cartId, action: 'clear' })
    });
    return null;
  }

  const res = await fetch('/api/cart/reserve', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cartId, action: 'reserve', items })
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Erro ao reservar estoque');
  }
  return new Date(data.expiresAt).getTime();
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      cartId: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36),
      expiresAt: null,
      items: [],
      
      addItem: async (newItem) => {
        const id = `${newItem.productId}-${newItem.size}`;
        const state = get();
        
        let updatedItems = [...state.items];
        const existingItem = updatedItems.find(item => item.id === id);
        
        if (existingItem) {
          existingItem.quantity += 1;
        } else {
          updatedItems.push({ ...newItem, id, quantity: 1 });
        }

        const newExpiresAt = await syncWithBackend(state.cartId, updatedItems);
        set({ items: updatedItems, expiresAt: newExpiresAt });
      },
      
      removeItem: async (id) => {
        const state = get();
        const updatedItems = state.items.filter(item => item.id !== id);
        
        const newExpiresAt = await syncWithBackend(state.cartId, updatedItems);
        set({ items: updatedItems, expiresAt: newExpiresAt });
      },
      
      updateQuantity: async (id, quantity) => {
        const state = get();
        const updatedItems = state.items.map(item =>
          item.id === id ? { ...item, quantity: Math.max(1, quantity) } : item
        );
        
        const newExpiresAt = await syncWithBackend(state.cartId, updatedItems);
        set({ items: updatedItems, expiresAt: newExpiresAt });
      },
      
      clearCart: async () => {
        const state = get();
        await syncWithBackend(state.cartId, []);
        set({ items: [], expiresAt: null });
      },
      
      cartTotal: () => {
        const totalItems = get().items.reduce((count, item) => count + item.quantity, 0);
        const isWholesale = totalItems >= 10;
        return get().items.reduce((total, item) => {
          const itemPrice = isWholesale ? (item.wholesalePrice || 34.90) : item.price;
          return total + (itemPrice * item.quantity);
        }, 0);
      },
      
      cartCount: () => {
        return get().items.reduce((count, item) => count + item.quantity, 0);
      }
    }),
    {
      name: 'usemaria-cart-storage',
    }
  )
)
