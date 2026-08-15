"use client";

import Link from "next/link";
import { StoreSettings } from "@prisma/client";
import CartDrawer from "./CartDrawer";
import { useState } from "react";

const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
);

const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
);

const CartIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
);

const MenuIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
);

const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
);

export default function Header({ 
  settings, 
  currentFilter, 
  currentCat 
}: { 
  settings: Partial<StoreSettings>,
  currentFilter?: string,
  currentCat?: string
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <>
      <header className="w-full bg-white text-black z-30 relative flex items-center justify-between px-6 lg:px-8 py-5 uppercase text-xs tracking-widest font-medium border-b border-zinc-100">
        <div className="flex items-center gap-4">
          <button 
            className="text-zinc-800 hover:opacity-70 transition-opacity" 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
          <Link href="/" className="flex flex-col items-start">
            <span className="text-xl lg:text-2xl font-serif tracking-widest leading-none">{settings.storeName || "USE MARIA"}</span>
            <span className="text-[7px] lg:text-[8px] tracking-[0.3em] font-bold text-zinc-500 mt-1">Camisas Católicas</span>
          </Link>
        </div>

        <div className="flex gap-4 lg:gap-6 items-center">
          <Link href="/admin" className="hover:opacity-70 transition-opacity hidden md:block"><UserIcon /></Link>
          <CartDrawer />
        </div>
      </header>

      {/* Menu Overlay (All screens) */}
      {isMobileMenuOpen && (
        <div className="absolute top-[72px] left-0 w-full md:w-80 md:left-4 md:top-[80px] md:rounded-2xl md:border bg-white border-b border-zinc-100 z-20 shadow-xl flex flex-col p-6 gap-6 animate-in slide-in-from-top-2">
          <Link href="/colecoes" onClick={() => setIsMobileMenuOpen(false)} className="font-bold uppercase tracking-widest text-sm text-zinc-800 hover:text-black transition-colors">Coleções</Link>
          <Link href={`https://wa.me/${settings.whatsappNumber}`} onClick={() => setIsMobileMenuOpen(false)} className="font-bold uppercase tracking-widest text-sm text-zinc-800 hover:text-black transition-colors">Contato</Link>
          <hr className="border-zinc-100" />
          <Link href="/admin" onClick={() => setIsMobileMenuOpen(false)} className="font-bold uppercase tracking-widest text-sm text-zinc-800 flex items-center gap-2 hover:text-black transition-colors"><UserIcon /> Painel Admin</Link>
        </div>
      )}
    </>
  );
}
