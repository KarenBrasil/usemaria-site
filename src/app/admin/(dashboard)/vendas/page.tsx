import prisma from "@/lib/prisma"
import Link from "next/link"
import OrderAdminCard from "@/components/admin/OrderAdminCard"

export const dynamic = 'force-dynamic';

export default async function SalesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const resolvedParams = await searchParams;
  const statusFilter = resolvedParams?.status;

  const whereClause = statusFilter && statusFilter !== 'ALL' ? { status: statusFilter } : {};

  const orders = await prisma.order.findMany({
    where: whereClause,
    include: {
      customer: true,
      items: {
        include: { product: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  // Contagem para os filtros
  const counts = await prisma.order.groupBy({
    by: ['status'],
    _count: { _all: true }
  })
  
  const getCount = (status: string) => counts.find(c => c.status === status)?._count._all || 0;
  const totalCount = counts.reduce((acc, c) => acc + c._count._all, 0);

  const tabs = [
    { label: 'Todos', value: 'ALL', count: totalCount },
    { label: 'Pendentes', value: 'PENDING', count: getCount('PENDING') },
    { label: 'Pagos', value: 'PAID', count: getCount('PAID') },
    { label: 'Enviados', value: 'SHIPPED', count: getCount('SHIPPED') },
  ];

  return (
    <div className="pb-20">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900">Gestão de Vendas</h2>
          <p className="text-sm text-zinc-500 mt-1">Acompanhe pedidos, filtre por status e gerencie os envios.</p>
        </div>
      </div>

      {/* Sistema de Filtros (Tabs) */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
        {tabs.map(tab => {
          const isActive = (statusFilter === tab.value) || (!statusFilter && tab.value === 'ALL');
          return (
            <Link 
              key={tab.value}
              href={tab.value === 'ALL' ? '/admin/vendas' : `/admin/vendas?status=${tab.value}`}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all whitespace-nowrap border ${
                isActive 
                  ? 'bg-zinc-900 text-white border-zinc-900 shadow-md' 
                  : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50'
              }`}
            >
              {tab.label}
              <span className={`px-2 py-0.5 rounded-full text-[10px] ${isActive ? 'bg-zinc-700 text-white' : 'bg-zinc-100 text-zinc-500'}`}>
                {tab.count}
              </span>
            </Link>
          )
        })}
      </div>
      
      <div className="space-y-6">
        {orders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-zinc-200 p-16 text-center shadow-sm">
            <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-zinc-100">
               <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400"><circle cx="12" cy="12" r="10"/><path d="M16 16s-1.5-2-4-2-4 2-4 2"/><path d="M9 9h.01"/><path d="M15 9h.01"/></svg>
            </div>
            <h3 className="text-lg font-bold text-zinc-900">Nenhum pedido encontrado</h3>
            <p className="text-zinc-500 mt-1 text-sm">Não há vendas correspondentes a este filtro no momento.</p>
          </div>
        ) : (
          orders.map(order => (
            <OrderAdminCard key={order.id} order={order} />
          ))
        )}
      </div>
    </div>
  )
}
