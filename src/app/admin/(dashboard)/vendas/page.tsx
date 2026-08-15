import prisma from "@/lib/prisma"
import Link from "next/link"
import OrderAdminCard from "@/components/admin/OrderAdminCard"

export const dynamic = 'force-dynamic';

export default async function SalesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string, period?: string, payment?: string }>
}) {
  const resolvedParams = await searchParams;
  const statusFilter = resolvedParams?.status;
  const periodFilter = resolvedParams?.period || 'all';
  const paymentFilter = resolvedParams?.payment || 'all';
  const typeFilter = resolvedParams?.type || 'all';

  let whereClause: any = {};
  
  if (statusFilter && statusFilter !== 'ALL') {
    whereClause.status = statusFilter;
  }

  // Lógica simples de período (apenas como exemplo, adaptável)
  if (periodFilter === 'today') {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    whereClause.createdAt = { gte: today };
  } else if (periodFilter === 'month') {
    const firstDay = new Date();
    firstDay.setDate(1);
    firstDay.setHours(0, 0, 0, 0);
    whereClause.createdAt = { gte: firstDay };
  } else if (periodFilter === '7days') {
    const last7 = new Date();
    last7.setDate(last7.getDate() - 7);
    whereClause.createdAt = { gte: last7 };
  }

  let orders = await prisma.order.findMany({
    where: whereClause,
    include: {
      customer: true,
      items: {
        include: { product: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  // Filtro de Atacado / Varejo
  if (typeFilter !== 'all') {
    orders = orders.filter(order => {
      const totalItems = order.items.reduce((acc, item) => acc + item.quantity, 0);
      const isWholesale = totalItems >= 10;
      if (typeFilter === 'atacado') return isWholesale;
      if (typeFilter === 'varejo') return !isWholesale;
      return true;
    });
  }

  // Contagem básica para os tabs de status ignorando outros filtros para manter a consistência visual do topo
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

      {/* Barra de Filtros Avançados */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-zinc-200 mb-6 flex flex-wrap gap-4 items-center">
        
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
          <span className="text-xs font-bold text-zinc-600 uppercase tracking-widest">Filtros:</span>
        </div>

        {/* Status (Tabs em formato Select/Botões compactos) */}
        <div className="flex gap-2 bg-zinc-100 p-1 rounded-lg">
          {tabs.map(tab => {
            const isActive = (statusFilter === tab.value) || (!statusFilter && tab.value === 'ALL');
            return (
              <Link 
                key={tab.value}
                href={{ pathname: '/admin/vendas', query: { ...resolvedParams, status: tab.value === 'ALL' ? undefined : tab.value } }}
                className={`px-4 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all ${
                  isActive 
                    ? 'bg-white text-black shadow-sm' 
                    : 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-200/50'
                }`}
              >
                {tab.label} <span className="opacity-60 ml-1">({tab.count})</span>
              </Link>
            )
          })}
        </div>

        <div className="h-6 w-px bg-zinc-200 hidden md:block"></div>

        {/* Tipo: Varejo / Atacado */}
        <div className="flex gap-2 bg-zinc-100 p-1 rounded-lg">
          <Link href={{ pathname: '/admin/vendas', query: { ...resolvedParams, type: 'all' } }} className={`px-3 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all ${(!resolvedParams?.type || resolvedParams?.type === 'all') ? 'bg-white text-black shadow-sm' : 'text-zinc-500 hover:bg-zinc-200/50'}`}>Ambos</Link>
          <Link href={{ pathname: '/admin/vendas', query: { ...resolvedParams, type: 'varejo' } }} className={`px-3 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all ${resolvedParams?.type === 'varejo' ? 'bg-white text-black shadow-sm' : 'text-zinc-500 hover:bg-zinc-200/50'}`}>Varejo</Link>
          <Link href={{ pathname: '/admin/vendas', query: { ...resolvedParams, type: 'atacado' } }} className={`px-3 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all ${resolvedParams?.type === 'atacado' ? 'bg-white text-black shadow-sm' : 'text-zinc-500 hover:bg-zinc-200/50'}`}>Atacado</Link>
        </div>

        <div className="h-6 w-px bg-zinc-200 hidden md:block"></div>

        {/* Período */}
        <div className="flex gap-2">
          <Link href={{ pathname: '/admin/vendas', query: { ...resolvedParams, period: 'all' } }} className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${periodFilter === 'all' ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50'}`}>Todo o Período</Link>
          <Link href={{ pathname: '/admin/vendas', query: { ...resolvedParams, period: 'month' } }} className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${periodFilter === 'month' ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50'}`}>Este Mês</Link>
          <Link href={{ pathname: '/admin/vendas', query: { ...resolvedParams, period: 'today' } }} className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${periodFilter === 'today' ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50'}`}>Hoje</Link>
        </div>
      </div>
      
      {/* Lista de Pedidos Compacta */}
      <div className="flex flex-col gap-3">
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
