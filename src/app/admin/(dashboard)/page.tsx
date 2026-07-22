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
        <h2 className="text-2xl font-bold tracking-wide">Visão Geral</h2>
        <p className="text-sm text-zinc-500 mt-1">Bem-vinda ao painel de controle da Use Maria.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-white p-6 rounded-lg border border-zinc-200">
          <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold mb-2">Total de Produtos</p>
          <p className="text-3xl font-light">{totalProducts}</p>
        </div>
        <div className="bg-white p-6 rounded-lg border border-zinc-200">
          <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold mb-2">Total de Vendas</p>
          <p className="text-3xl font-light">{totalOrders}</p>
        </div>
        <div className="bg-white p-6 rounded-lg border border-zinc-200">
          <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold mb-2">Faturamento Estimado</p>
          <p className="text-3xl font-light">R$ {revenue.toFixed(2).replace('.', ',')}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold tracking-wide">Estoque Baixo</h3>
            <Link href="/admin/produtos" className="text-xs text-zinc-500 hover:text-black uppercase font-bold tracking-widest">Ver todos</Link>
          </div>
          <div className="bg-white rounded-lg border border-zinc-200 overflow-hidden">
            {lowStockProducts.length === 0 ? (
              <p className="p-6 text-sm text-zinc-500 text-center">Nenhum produto com estoque baixo.</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-zinc-50 border-b border-zinc-200">
                  <tr className="text-left text-xs uppercase tracking-wider text-zinc-500 font-semibold">
                    <th className="p-4">Produto</th>
                    <th className="p-4">Tamanho</th>
                    <th className="p-4 text-right">Estoque</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStockProducts.map((item) => (
                    <tr key={item.id} className="border-b border-zinc-100 last:border-0">
                      <td className="p-4 font-medium">{item.product.name}</td>
                      <td className="p-4">{item.size}</td>
                      <td className="p-4 text-right text-red-500 font-bold">{item.stock} un</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
        
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold tracking-wide">Últimos Pedidos</h3>
            <Link href="/admin/vendas" className="text-xs text-zinc-500 hover:text-black uppercase font-bold tracking-widest">Ver todas</Link>
          </div>
          <div className="bg-white rounded-lg border border-zinc-200 overflow-hidden">
            {recentOrders.length === 0 ? (
              <p className="p-6 text-sm text-zinc-500 text-center">Nenhum pedido recebido ainda.</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-zinc-50 border-b border-zinc-200">
                  <tr className="text-left text-xs uppercase tracking-wider text-zinc-500 font-semibold">
                    <th className="p-4">Cliente</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="border-b border-zinc-100 last:border-0">
                      <td className="p-4 font-medium">{order.customer?.name || 'Cliente'}</td>
                      <td className="p-4">
                        <span className="text-[10px] uppercase tracking-wider font-bold bg-zinc-100 px-2 py-1 rounded">
                          {order.status === 'PENDING' ? 'Pendente' : order.status === 'PAID' ? 'Pago' : order.status}
                        </span>
                      </td>
                      <td className="p-4 text-right font-medium">R$ {order.total.toFixed(2).replace('.', ',')}</td>
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
