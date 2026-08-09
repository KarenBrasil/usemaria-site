import prisma from "@/lib/prisma"
import Link from "next/link"

export const dynamic = 'force-dynamic';

export default async function AdminOverview() {
  const totalProducts = await prisma.product.count()
  
  // Total orders in Prisma
  const totalOrders = await prisma.order.count()
  
  // Total revenue (status PAID or DELIVERED)
  const revenueResult = await prisma.order.aggregate({
    _sum: { total: true },
    where: { status: { in: ['PAID', 'DELIVERED', 'SHIPPED'] } }
  })
  const revenue = revenueResult._sum.total || 0
  
  // Low stock products
  const lowStockProducts = await prisma.productSize.findMany({
    where: { stock: { lt: 5 } },
    include: { product: true },
    take: 5,
    orderBy: { stock: 'asc' }
  })

  // Recent orders
  const recentOrders = await prisma.order.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: { customer: true }
  })

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold tracking-tight text-zinc-900">Visão Geral</h2>
        <p className="text-sm text-zinc-500 mt-1">Bem-vinda ao painel de controle da Use Maria.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm flex flex-col justify-between">
          <p className="text-[11px] text-zinc-500 uppercase tracking-widest font-bold mb-4">Total de Produtos</p>
          <p className="text-4xl font-semibold tracking-tight text-zinc-900">{totalProducts}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm flex flex-col justify-between">
          <p className="text-[11px] text-zinc-500 uppercase tracking-widest font-bold mb-4">Total de Vendas</p>
          <p className="text-4xl font-semibold tracking-tight text-zinc-900">{totalOrders}</p>
        </div>
        <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800 shadow-md flex flex-col justify-between text-white">
          <p className="text-[11px] text-zinc-400 uppercase tracking-widest font-bold mb-4">Faturamento (Aprovado)</p>
          <p className="text-4xl font-semibold tracking-tight">R$ {revenue.toFixed(2).replace('.', ',')}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold tracking-tight">Estoque Baixo</h3>
            <Link href="/admin/produtos" className="text-xs text-zinc-500 hover:text-black uppercase font-bold tracking-widest transition-colors">Ver todos</Link>
          </div>
          <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden shadow-sm">
            {lowStockProducts.length === 0 ? (
              <p className="p-8 text-sm text-zinc-500 text-center bg-zinc-50/50">Nenhum produto com estoque baixo.</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-zinc-50/80 border-b border-zinc-200">
                  <tr className="text-left text-[10px] uppercase tracking-widest text-zinc-500 font-bold">
                    <th className="p-4">Produto</th>
                    <th className="p-4">Tamanho</th>
                    <th className="p-4 text-right">Estoque</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {lowStockProducts.map((item) => (
                    <tr key={item.id} className="hover:bg-zinc-50/50 transition-colors">
                      <td className="p-4 font-medium text-zinc-900">{item.product.name}</td>
                      <td className="p-4 text-zinc-600">{item.size}</td>
                      <td className="p-4 text-right text-red-600 font-bold">{item.stock} un</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
        
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold tracking-tight">Últimos Pedidos</h3>
            <Link href="/admin/vendas" className="text-xs text-zinc-500 hover:text-black uppercase font-bold tracking-widest transition-colors">Ver todas</Link>
          </div>
          <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden shadow-sm">
            {recentOrders.length === 0 ? (
              <p className="p-8 text-sm text-zinc-500 text-center bg-zinc-50/50">Nenhum pedido recebido ainda.</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-zinc-50/80 border-b border-zinc-200">
                  <tr className="text-left text-[10px] uppercase tracking-widest text-zinc-500 font-bold">
                    <th className="p-4">Cliente</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-zinc-50/50 transition-colors">
                      <td className="p-4">
                        <p className="font-medium text-zinc-900">{order.customer?.name || 'Cliente'}</p>
                        <p className="text-xs text-zinc-500 mt-0.5">#{order.id.slice(-6).toUpperCase()}</p>
                      </td>
                      <td className="p-4">
                        <span className={`text-[9px] uppercase tracking-wider font-bold px-2 py-1 rounded border ${
                          order.status === 'PENDING' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 
                          order.status === 'PAID' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                          order.status === 'SHIPPED' ? 'bg-blue-50 text-blue-700 border-blue-200' : 
                          order.status === 'DELIVERED' ? 'bg-zinc-100 text-zinc-700 border-zinc-300' : 
                          'bg-red-50 text-red-700 border-red-200'
                        }`}>
                          {order.status === 'PENDING' ? 'Pendente' : order.status === 'PAID' ? 'Aprovado' : order.status}
                        </span>
                      </td>
                      <td className="p-4 text-right font-medium text-zinc-900">R$ {order.total.toFixed(2).replace('.', ',')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
