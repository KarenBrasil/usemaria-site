import Link from "next/link";
import { StoreSettings } from "@prisma/client";
import CartDrawer from "./CartDrawer";

const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
);

const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
);

const CartIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
);

export default function Header({ settings }: { settings: Partial<StoreSettings> }) {
  return (
    <>
      <div className="w-full bg-[#F5F3EF] text-center py-2 text-[10px] tracking-widest font-bold text-black uppercase">
        Fé que veste. Propósito que transforma.
      </div>
      <header className="w-full bg-white text-black z-20 flex items-center justify-between px-8 py-5 uppercase text-xs tracking-widest font-medium border-b border-zinc-100">
        <Link href="/" className="flex flex-col items-start">
          <span className="text-2xl font-serif tracking-widest leading-none">{settings.storeName || "USE MARIA"}</span>
          <span className="text-[8px] tracking-[0.3em] font-bold text-zinc-500 mt-1">Camisas Católicas</span>
        </Link>
        <nav className="hidden lg:flex gap-8">
          <Link href="/colecoes" className="hover:opacity-70 transition-opacity font-bold uppercase tracking-widest text-xs">Coleções</Link>
          <Link href={`https://wa.me/${settings.whatsappNumber}`} className="hover:opacity-70 transition-opacity font-bold uppercase tracking-widest text-xs">Contato</Link>
        </nav>
        <div className="flex gap-6 items-center">
          <button className="hover:opacity-70 transition-opacity"><SearchIcon /></button>
          <Link href="/admin" className="hover:opacity-70 transition-opacity hidden md:block"><UserIcon /></Link>
          <CartDrawer />
        </div>
      </header>
    </>
  );
}
