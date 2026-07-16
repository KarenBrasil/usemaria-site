import Link from "next/link"
import { createProduct } from "../../actions"

export default function NewProductPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin" className="text-zinc-500 hover:text-black">&larr; Voltar</Link>
        <h2 className="text-2xl font-bold tracking-wide">Adicionar Peça</h2>
      </div>
      
      <div className="bg-white rounded-lg border border-zinc-200 p-8 shadow-sm">
        <form action={createProduct} className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold uppercase tracking-wider">Nome da Peça</label>
            <input 
              name="name" 
              type="text" 
              required 
              placeholder="Ex: Vestido Floral Midi" 
              className="p-3 border border-zinc-300 rounded focus:border-black outline-none transition-colors"
            />
          </div>
          
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold uppercase tracking-wider">Preço (R$)</label>
            <input 
              name="price" 
              type="text" 
              required 
              placeholder="Ex: 149,90" 
              className="p-3 border border-zinc-300 rounded focus:border-black outline-none transition-colors"
            />
          </div>
          
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold uppercase tracking-wider">Caminho da Imagem</label>
            <input 
              name="image" 
              type="text" 
              placeholder="Ex: /images/catalog/page-0001.jpg" 
              className="p-3 border border-zinc-300 rounded focus:border-black outline-none transition-colors"
            />
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">
              Como já importamos o catálogo, você pode digitar o caminho de uma das imagens importadas.
            </p>
          </div>
          
          <div className="mt-4 pt-6 border-t border-zinc-100 flex justify-end">
            <button type="submit" className="bg-black text-white uppercase text-xs tracking-widest font-bold py-4 px-10 rounded hover:bg-zinc-800 transition-colors">
              Salvar Peça no Estoque
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
