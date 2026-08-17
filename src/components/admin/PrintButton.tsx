'use client';

export default function PrintButton() {

  return (
    <div className="max-w-2xl mx-auto mt-8 flex justify-center gap-4 print:hidden">
      <button 
        onClick={() => window.print()}
        className="bg-black text-white px-6 py-2 rounded font-medium shadow hover:bg-zinc-800 transition-colors"
      >
        Imprimir / Baixar PDF
      </button>
      <button 
        onClick={() => window.close()}
        className="bg-white border border-zinc-300 text-zinc-700 px-6 py-2 rounded font-medium hover:bg-zinc-50 transition-colors"
      >
        Fechar Aba
      </button>
    </div>
  );
}
