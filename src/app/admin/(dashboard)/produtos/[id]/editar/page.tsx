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
          
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold uppercase tracking-wider">Caminho da Imagem</label>
            <input 
              name="image" 
              type="text" 
              defaultValue={product.image || ""}
              className="p-3 border border-zinc-300 rounded focus:border-black outline-none transition-colors"
            />
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
