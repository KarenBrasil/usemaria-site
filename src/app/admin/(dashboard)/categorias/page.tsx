import prisma from "@/lib/prisma"
import Link from "next/link"
import { createCategory, deleteCategory } from "../../actions"

export default async function CategoriasPage() {
  const categories = await prisma.category.findMany({
    include: {
      _count: {
        select: { products: true }
      }
    },
    orderBy: { name: 'asc' }
  })

  return (
    <div className="pb-20">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900">Categorias</h2>
          <p className="text-sm text-zinc-500 mt-1">Gerencie as categorias de produtos da loja.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <form action={createCategory} className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex flex-col gap-4">
            <h3 className="text-lg font-medium text-zinc-900">Nova Categoria</h3>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-zinc-700">Nome da categoria</label>
              <input name="name" type="text" required placeholder="Ex: Camisetas" className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white outline-none" />
            </div>
            <button type="submit" className="w-full bg-black text-white px-4 py-3 rounded-xl text-xs tracking-widest font-bold hover:bg-zinc-800 transition-colors uppercase">
              Adicionar
            </button>
          </form>
        </div>

        <div className="md:col-span-2">
          <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50/50">
                  <th className="p-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Nome</th>
                  <th className="p-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Produtos</th>
                  <th className="p-4 text-xs font-bold text-zinc-500 uppercase tracking-wider text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {categories.map(cat => (
                  <tr key={cat.id} className="border-b border-zinc-100 hover:bg-zinc-50">
                    <td className="p-4 font-medium text-zinc-900">{cat.name}</td>
                    <td className="p-4 text-sm text-zinc-500">{cat._count.products} peças</td>
                    <td className="p-4 text-right">
                      <form action={async () => {
                        "use server"
                        await deleteCategory(cat.id)
                      }}>
                        <button type="submit" className="text-red-500 text-sm font-medium hover:text-red-700 hover:underline">Excluir</button>
                      </form>
                    </td>
                  </tr>
                ))}
                {categories.length === 0 && (
                  <tr>
                    <td colSpan={3} className="p-8 text-center text-zinc-500 text-sm">Nenhuma categoria cadastrada.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
