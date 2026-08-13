import Link from "next/link"
import { createProduct } from "../../../actions"

export default function NewProductPage() {
  return (
    <div className="max-w-2xl mx-auto pb-20">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/produtos" className="text-zinc-500 hover:text-black">&larr; Voltar</Link>
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold uppercase tracking-wider">Preço Atual (R$)</label>
              <input 
                name="price" 
                type="text" 
                required 
                placeholder="Ex: 149,90" 
                className="p-3 border border-zinc-300 rounded focus:border-black outline-none transition-colors"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold uppercase tracking-wider text-zinc-500">Preço Antigo (Opcional - R$)</label>
              <input 
                name="oldPrice" 
                type="text" 
                placeholder="Ex: 199,90 (Ficará riscado)" 
                className="p-3 border border-zinc-200 bg-zinc-50 rounded focus:border-black outline-none transition-colors"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-100">
            <label className="text-sm font-semibold uppercase tracking-wider block mb-4">Classificação e Destaques (Interruptores)</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              <label className="relative flex items-center justify-between p-4 border border-zinc-200 rounded-lg cursor-pointer hover:bg-zinc-50 transition-colors">
                <div>
                  <span className="font-bold text-sm block">Novidade</span>
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Tag "Novo"</span>
                </div>
                <input type="checkbox" name="isNew" value="true" className="sr-only peer" />
                <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[22px] after:right-[18px] peer-checked:after:right-[38px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>

              <label className="relative flex items-center justify-between p-4 border border-zinc-200 rounded-lg cursor-pointer hover:bg-zinc-50 transition-colors">
                <div>
                  <span className="font-bold text-sm block">Atacado</span>
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Aba Varejo e Atacado</span>
                </div>
                <input type="checkbox" name="isWholesale" value="true" className="sr-only peer" />
                <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[22px] after:right-[18px] peer-checked:after:right-[38px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>

              <label className="relative flex items-center justify-between p-4 border border-zinc-200 rounded-lg cursor-pointer hover:bg-zinc-50 transition-colors">
                <div>
                  <span className="font-bold text-sm block">Promoção</span>
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Tag "Promoção"</span>
                </div>
                <input type="checkbox" name="isPromotion" value="true" className="sr-only peer" />
                <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[22px] after:right-[18px] peer-checked:after:right-[38px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>

            </div>
          </div>
          
          <div className="flex flex-col gap-2 p-4 bg-zinc-50 border border-zinc-200 rounded-lg">
            <label className="text-sm font-bold uppercase tracking-wider text-black">Upload de Imagem</label>
            <p className="text-[11px] text-zinc-500 mb-2">
              Faça upload do seu computador ou celular.
            </p>
            <input 
              name="imageFile" 
              type="file" 
              accept="image/*"
              className="block w-full text-sm text-zinc-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-xs file:font-bold file:uppercase file:tracking-widest
                file:bg-black file:text-white
                hover:file:bg-zinc-800 transition-all cursor-pointer"
            />
            
            <div className="mt-4 pt-4 border-t border-zinc-200">
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1 block">Ou cole o caminho/URL da imagem (Avançado)</label>
              <input 
                name="image" 
                type="text" 
                placeholder="Ex: /images/catalog/page-0001.jpg" 
                className="w-full p-2 text-xs border border-zinc-300 rounded focus:border-black outline-none transition-colors"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-100">
            <label className="text-sm font-semibold uppercase tracking-wider block mb-4">Grade de Estoque Inicial</label>
            <div className="grid grid-cols-3 gap-4 sm:grid-cols-6">
              {['PP', 'P', 'M', 'G', 'GG', 'U'].map(size => (
                <div key={size} className="flex flex-col gap-1">
                  <label className="text-xs text-center text-zinc-500 font-bold">{size}</label>
                  <input 
                    name={`stock_${size}`}
                    type="number"
                    min="0"
                    placeholder="0"
                    className="p-2 border border-zinc-300 rounded text-center focus:border-black outline-none transition-colors"
                  />
                </div>
              ))}
            </div>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-2">
              Deixe em branco ou 0 para tamanhos indisponíveis.
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
