import prisma from "@/lib/prisma"
import Link from "next/link"
import { notFound } from "next/navigation"
import { updateProduct } from "../../../../actions"

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
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/produtos" className="text-zinc-500 hover:text-black">&larr; Voltar</Link>
        <h2 className="text-2xl font-bold tracking-wide">Editar Peça: {product.name}</h2>
      </div>
      
      <div className="bg-white rounded-lg border border-zinc-200 p-8 shadow-sm">
        <form action={updateProductWithId} className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold uppercase tracking-wider">Nome da Peça</label>
            <input 
              name="name" 
              type="text" 
              required 
              defaultValue={product.name}
              className="p-3 border border-zinc-300 rounded focus:border-black outline-none transition-colors"
            />
          </div>
          
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold uppercase tracking-wider">Preço (R$)</label>
            <input 
              name="price" 
              type="text" 
              required 
              defaultValue={product.price.toFixed(2).replace('.', ',')}
              className="p-3 border border-zinc-300 rounded focus:border-black outline-none transition-colors"
            />
          </div>
          
          <div className="flex flex-col gap-2 p-4 bg-zinc-50 border border-zinc-200 rounded-lg">
            <label className="text-sm font-bold uppercase tracking-wider text-black">Upload de Imagem</label>
            
            {product.image && (
              <div className="mb-4 flex items-center gap-4 p-3 bg-white border border-zinc-200 rounded-lg">
                <img src={product.image} alt="Imagem atual" className="w-16 h-16 object-cover rounded shadow-sm" />
                <div className="text-xs text-zinc-500 flex-1">
                  <span className="font-bold text-zinc-900 block">Imagem Atual</span>
                  <span className="truncate block max-w-xs">{product.image}</span>
                </div>
              </div>
            )}

            <p className="text-[11px] text-zinc-500 mb-2">
              Faça upload de uma nova imagem para substituir a atual.
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
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1 block">Ou altere o link direto da imagem (Avançado)</label>
              <input 
                name="image" 
                type="text" 
                defaultValue={product.image || ""}
                placeholder="Ex: /images/catalog/page-0001.jpg" 
                className="w-full p-2 text-xs border border-zinc-300 rounded focus:border-black outline-none transition-colors"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-100">
            <label className="text-sm font-semibold uppercase tracking-wider block mb-4">Grade de Estoque Atual</label>
            <div className="grid grid-cols-3 gap-4 sm:grid-cols-6">
              {['PP', 'P', 'M', 'G', 'GG', 'U'].map(size => (
                <div key={size} className="flex flex-col gap-1">
                  <label className="text-xs text-center text-zinc-500 font-bold">{size}</label>
                  <input 
                    name={`stock_${size}`}
                    type="number"
                    min="0"
                    defaultValue={stockMap[size] || ""}
                    placeholder="0"
                    className="p-2 border border-zinc-300 rounded text-center focus:border-black outline-none transition-colors"
                  />
                </div>
              ))}
            </div>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-2">
              Defina como 0 para indicar que o tamanho esgotou.
            </p>
          </div>
          
          <div className="mt-4 pt-6 border-t border-zinc-100 flex justify-end">
            <button type="submit" className="bg-black text-white uppercase text-xs tracking-widest font-bold py-4 px-10 rounded hover:bg-zinc-800 transition-colors">
              Salvar Alterações
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
