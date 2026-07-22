import prisma from "@/lib/prisma"
import Image from "next/image"
import Link from "next/link"
import { deleteProduct } from "../../actions"

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const products = await prisma.product.findMany({ 
    include: { sizes: true },
    orderBy: { createdAt: 'desc' }
  })
  
  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold tracking-wide">Gestão de Produtos</h2>
          <p className="text-sm text-zinc-500 mt-1">Cadastre novas peças, gerencie o estoque e defina os preços.</p>
        </div>
        <Link href="/admin/produtos/novo" className="bg-zinc-900 text-white uppercase text-xs font-bold tracking-widest px-6 py-3 rounded hover:bg-zinc-800 transition-colors">
          + Adicionar Peça
        </Link>
      </div>
      
      <div className="bg-white rounded-lg border border-zinc-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-zinc-50">
            <tr className="border-b border-zinc-200 text-left text-xs uppercase tracking-wider text-zinc-500 font-semibold">
              <th className="p-4">Produto</th>
              <th className="p-4">Preço</th>
              <th className="p-4">Estoque</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {products.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-12 text-center text-zinc-500">
                  Nenhum produto cadastrado no banco de dados. <br/>
                  <span className="text-xs mt-2 block">Clique em "Adicionar Peça" para começar a montar o catálogo real.</span>
                </td>
              </tr>
            ) : (
              products.map((p: any) => (
                <tr key={p.id} className="border-b border-zinc-100 hover:bg-zinc-50">
                  <td className="p-4 flex items-center gap-4">
                    {p.image ? (
                      <div className="relative w-12 h-16 bg-zinc-100 rounded overflow-hidden">
                        <Image src={p.image} alt={p.name} fill className="object-cover" />
                      </div>
                    ) : (
                      <div className="w-12 h-16 bg-zinc-100 rounded flex items-center justify-center text-zinc-400 text-xs">Sem foto</div>
                    )}
                    <span className="font-medium text-zinc-900">{p.name}</span>
                  </td>
                  <td className="p-4 font-medium">R$ {p.price.toFixed(2).replace('.', ',')}</td>
                  <td className="p-4">
                    {p.sizes.length === 0 ? <span className="text-red-500">Esgotado</span> : p.sizes.map((s: any) => `${s.size} (${s.stock})`).join(', ')}
                  </td>
                  <td className="p-4">
                    {p.isNew ? (
                      <span className="bg-zinc-900 text-white text-[10px] uppercase tracking-wider px-2 py-1 rounded font-bold">Novo</span>
                    ) : (
                      <span className="text-zinc-500 text-[10px] uppercase tracking-wider font-bold">Ativo</span>
                    )}
                  </td>
                  <td className="p-4 text-right flex items-center justify-end gap-4">
                    <Link href={`/admin/produtos/${p.id}/editar`} className="text-zinc-500 hover:text-black font-medium text-xs uppercase tracking-widest">
                      Editar
                    </Link>
                    <form action={deleteProduct.bind(null, p.id)}>
                      <button type="submit" className="text-red-500 hover:text-red-700 font-medium text-xs uppercase tracking-widest">
                        Excluir
                      </button>
                    </form>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
