import prisma from "@/lib/prisma"
import Link from "next/link"
import { notFound } from "next/navigation"
import { updateProduct } from "../../../../actions"
import Image from "next/image"

export default async function EditProductPage({ params }: { params: { id: string } }) {
  // Await the params object before accessing its properties (Next.js 15+ constraint)
  const resolvedParams = await params
  
  const product = await prisma.product.findUnique({
    where: { id: resolvedParams.id },
    include: { sizes: true }
  })

  if (!product) {
    notFound()
  }

  // Create a map for easy lookup of existing sizes
  const stockMap: Record<string, number> = {}
  product.sizes.forEach(s => {
    stockMap[s.size] = s.stock
  })

  // We need to bind the product id to the server action
  const updateProductWithId = updateProduct.bind(null, product.id)

  return (
    <div className="max-w-3xl mx-auto pb-24">
      <div className="flex items-center gap-4 mb-8 px-2">
        <Link href="/admin/produtos" className="text-zinc-400 hover:text-black transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </Link>
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">Editar {product.name}</h2>
      </div>
      
      <form action={updateProductWithId} className="flex flex-col gap-8">
        
        {/* Seção 1: Informações Básicas */}
        <section className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-zinc-100 flex flex-col gap-6">
          <h3 className="text-lg font-medium text-zinc-900 border-b border-zinc-100 pb-4 mb-2">Informações Básicas</h3>
          
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-zinc-700">Nome da peça</label>
            <input 
              name="name" 
              type="text" 
              required 
              defaultValue={product.name}
              placeholder="Ex: Vestido Floral Midi" 
              className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100 outline-none transition-all"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-zinc-700">Descrição e detalhes</label>
            <textarea 
              name="description" 
              rows={4}
              defaultValue={product.description || ""}
              placeholder="Descreva o tecido, modelagem, dicas de uso..." 
              className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100 outline-none transition-all resize-none"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-zinc-700">Preço atual (R$)</label>
              <input 
                name="price" 
                type="text" 
                required 
                defaultValue={product.price.toFixed(2).replace('.', ',')}
                placeholder="0,00" 
                className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100 outline-none transition-all"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-zinc-700">Preço antigo <span className="text-zinc-400 font-normal">(Opcional)</span></label>
              <input 
                name="oldPrice" 
                type="text" 
                defaultValue={product.oldPrice ? product.oldPrice.toFixed(2).replace('.', ',') : ""}
                placeholder="0,00" 
                className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100 outline-none transition-all text-zinc-500"
              />
            </div>
          </div>
        </section>

        {/* Seção 2: Imagem do Produto */}
        <section className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-zinc-100 flex flex-col gap-6">
          <h3 className="text-lg font-medium text-zinc-900 border-b border-zinc-100 pb-4 mb-2">Imagem do Produto</h3>
          
          {product.image && (
            <div className="flex items-center gap-4 p-4 bg-zinc-50 border border-zinc-100 rounded-xl">
              <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-zinc-200 shadow-sm">
                <Image src={product.image} alt="Atual" fill className="object-cover" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-zinc-900">Imagem atual</span>
                <span className="text-xs text-zinc-500">Faça o upload abaixo para substituí-la.</span>
              </div>
            </div>
          )}

          <div className="relative border border-dashed border-zinc-300 rounded-xl p-4 hover:bg-zinc-50 hover:border-zinc-400 transition-colors group cursor-pointer flex items-center justify-between gap-4">
            <input 
              name="imageFile" 
              type="file" 
              accept="image/*"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-zinc-100 rounded-lg flex items-center justify-center text-zinc-400 group-hover:text-zinc-600 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-zinc-700">Clique para selecionar foto</p>
                <p className="text-[11px] text-zinc-400 mt-0.5">JPG, PNG ou WEBP</p>
              </div>
            </div>
            <span className="text-xs font-bold text-zinc-500 bg-zinc-100 px-3 py-1.5 rounded-full group-hover:bg-black group-hover:text-white transition-colors">Procurar</span>
          </div>
        </section>

        {/* Seção 3: Classificação */}
        <section className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-zinc-100 flex flex-col gap-6">
          <h3 className="text-lg font-medium text-zinc-900 border-b border-zinc-100 pb-4 mb-2">Visibilidade e Etiquetas</h3>
          
          <div className="flex flex-col gap-4">
            <label className="flex items-center justify-between p-4 border border-zinc-100 rounded-xl cursor-pointer hover:bg-zinc-50 transition-colors">
              <div className="flex flex-col">
                <span className="font-medium text-sm text-zinc-900">Lançamento (Novidade)</span>
                <span className="text-xs text-zinc-500">Exibe a etiqueta branca "Novo" na foto.</span>
              </div>
              <div className="relative inline-flex items-center">
                <input type="checkbox" name="isNew" value="true" defaultChecked={product.isNew} className="sr-only peer" />
                <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-zinc-900"></div>
              </div>
            </label>

            <label className="flex items-center justify-between p-4 border border-zinc-100 rounded-xl cursor-pointer hover:bg-zinc-50 transition-colors">
              <div className="flex flex-col">
                <span className="font-medium text-sm text-zinc-900">Venda no Atacado</span>
                <span className="text-xs text-zinc-500">Exibe a etiqueta dourada e move para a aba Atacado.</span>
              </div>
              <div className="relative inline-flex items-center">
                <input type="checkbox" name="isWholesale" value="true" defaultChecked={product.isWholesale} className="sr-only peer" />
                <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
              </div>
            </label>

            <label className="flex items-center justify-between p-4 border border-zinc-100 rounded-xl cursor-pointer hover:bg-zinc-50 transition-colors">
              <div className="flex flex-col">
                <span className="font-medium text-sm text-zinc-900">Produto em Promoção</span>
                <span className="text-xs text-zinc-500">Exibe a etiqueta vermelha e move para a aba Promoção.</span>
              </div>
              <div className="relative inline-flex items-center">
                <input type="checkbox" name="isPromotion" value="true" defaultChecked={product.isPromotion} className="sr-only peer" />
                <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
              </div>
            </label>
          </div>
        </section>

        {/* Seção 4: Estoque */}
        <section className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-zinc-100 flex flex-col gap-6">
          <div className="flex justify-between items-center border-b border-zinc-100 pb-4 mb-2">
            <h3 className="text-lg font-medium text-zinc-900">Controle de Estoque</h3>
            <span className="text-xs text-zinc-400">Deixe em 0 se indisponível</span>
          </div>
          
          <div className="flex flex-col gap-3">
            {['PP', 'P', 'M', 'G', 'GG'].map(size => (
              <div key={size} className="flex items-center justify-between p-3 border border-zinc-100 rounded-xl bg-zinc-50/50 hover:bg-zinc-50 transition-colors">
                <div className="flex items-center gap-4">
                  <span className="w-10 h-10 flex items-center justify-center bg-white border border-zinc-200 rounded-lg font-medium text-sm text-zinc-700 shadow-sm">{size}</span>
                  <span className="text-sm font-medium text-zinc-700">Tamanho {size}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-400">Qtd:</span>
                  <input 
                    name={`stock_${size}`}
                    type="number"
                    min="0"
                    defaultValue={stockMap[size] || ""}
                    placeholder="0"
                    className="w-20 p-2 text-center bg-white border border-zinc-200 rounded-lg focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100 outline-none transition-all shadow-sm"
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
        
        {/* Actions */}
        <div className="flex justify-end pt-4">
          <button type="submit" className="bg-zinc-900 text-white text-sm font-medium py-4 px-12 rounded-xl shadow-lg shadow-zinc-900/20 hover:bg-zinc-800 hover:shadow-zinc-900/30 transition-all active:scale-[0.98]">
            Salvar Alterações
          </button>
        </div>

      </form>
    </div>
  )
}
