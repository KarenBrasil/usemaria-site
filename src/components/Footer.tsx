import Link from "next/link";
import { StoreSettings } from "@prisma/client";

export default function Footer({ settings }: { settings: Partial<StoreSettings> }) {
  return (
    <>
      {/* Trust Badges Section */}
      <section className="bg-[#F5F3EF] py-12 px-4 md:px-12 w-full mt-20">
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 border border-zinc-300 rounded-full flex items-center justify-center shrink-0">
               <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
            </div>
            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-black">Pagamento Seguro</h4>
              <p className="text-[10px] text-zinc-500">Ambiente 100% protegido</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 border border-zinc-300 rounded-full flex items-center justify-center shrink-0">
               <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
            </div>
            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-black">Atendimento 24/7</h4>
              <p className="text-[10px] text-zinc-500">Estamos aqui para te ajudar</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 border border-zinc-300 rounded-full flex items-center justify-center shrink-0">
               <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21v-5h5"/></svg>
            </div>
            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-black">Troca Fácil</h4>
              <p className="text-[10px] text-zinc-500">Até 30 dias para trocar</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 border border-zinc-300 rounded-full flex items-center justify-center shrink-0">
               <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"/></svg>
            </div>
            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-black">Qualidade Premium</h4>
              <p className="text-[10px] text-zinc-500">Peças selecionadas com amor</p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Footer */}
      <footer className="bg-white border-t border-zinc-200 text-black py-16 px-4 md:px-12 w-full">
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 items-start text-center md:text-left">
          
          <div className="flex flex-col gap-3">
             <h4 className="text-[10px] font-bold uppercase tracking-widest mb-2">Institucional</h4>
             <Link href="#" className="text-[11px] text-zinc-500 hover:text-black">Sobre nós</Link>
             <Link href="#" className="text-[11px] text-zinc-500 hover:text-black">Trocas e devoluções</Link>
             <Link href="#" className="text-[11px] text-zinc-500 hover:text-black">Perguntas frequentes</Link>
             <Link href={`https://wa.me/${settings.whatsappNumber}`} className="text-[11px] text-zinc-500 hover:text-black">Fale conosco</Link>
          </div>

          <div className="flex flex-col items-center justify-center">
             <div className="text-xl font-serif tracking-[0.2em] font-bold mb-1 flex flex-col items-center">
               <span className="text-zinc-400 mb-1">✝</span>
               {settings.storeName || "USE MARIA"}
             </div>
             <p className="text-[8px] uppercase tracking-widest text-zinc-500 font-bold">Camisas Católicas</p>
          </div>

          <div className="flex flex-col gap-4 items-center md:items-end">
             <h4 className="text-[10px] font-bold uppercase tracking-widest">Siga-nos</h4>
             <div className="flex gap-4 text-zinc-800">
                <Link href={settings.instagramUrl || "#"} className="hover:text-black hover:-translate-y-1 transition-transform">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16.11 7.55 16 7.52"/><path d="M12 15.93a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"/></svg>
                </Link>
                <Link href={settings.tiktokUrl || "#"} className="hover:text-black hover:-translate-y-1 transition-transform">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/></svg>
                </Link>
             </div>
          </div>

        </div>
        <div className="text-center mt-16 pt-8 border-t border-zinc-100">
          <p className="text-[9px] tracking-widest uppercase text-zinc-400">© 2026 {settings.storeName || "Use Maria"}. Todos os direitos reservados.</p>
        </div>
      </footer>
    </>
  );
}
