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
  const allOrdersStats = await prisma.order.findMany({ include: { items: true } });
  const getCount = (status: string) => allOrdersStats.filter(o => o.status === status).length;
  const totalCount = allOrdersStats.length;

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const firstDayMonth = new Date(); firstDayMonth.setDate(1); firstDayMonth.setHours(0, 0, 0, 0);
  let countToday = 0;
  let countMonth = 0;
  let countVarejo = 0;
  let countAtacado = 0;

  allOrdersStats.forEach(o => {
    const totalItems = o.items.reduce((acc, item) => acc + item.quantity, 0);
    if (totalItems >= 10) countAtacado++;
    else countVarejo++;

    const createdAt = new Date(o.createdAt);
    if (createdAt >= today) countToday++;
    if (createdAt >= firstDayMonth) countMonth++;
  });

  return (
    <div className="pb-20">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900">Gestão de Vendas</h2>
          <p className="text-sm text-zinc-500 mt-1">Acompanhe pedidos, filtre por status e gerencie os envios.</p>
        </div>
      </div>

      {/* Cards de Filtro de Status */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <Link href={{ pathname: '/admin/vendas', query: { ...resolvedParams, status: undefined } }} className={`p-5 rounded-xl border shadow-sm transition-all flex flex-col ${(!statusFilter || statusFilter === 'ALL') ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white text-zinc-900 border-zinc-200 hover:border-black'}`}>
          <p className={`text-[10px] uppercase tracking-widest font-bold mb-1 ${(!statusFilter || statusFilter === 'ALL') ? 'text-zinc-400' : 'text-zinc-500'}`}>Total de Vendas</p>
          <p className="text-3xl font-black tracking-tighter">{totalCount}</p>
        </Link>
        <Link href={{ pathname: '/admin/vendas', query: { ...resolvedParams, status: 'PENDING' } }} className={`p-5 rounded-xl border shadow-sm transition-all flex flex-col ${statusFilter === 'PENDING' ? 'bg-amber-900 text-white border-amber-900' : 'bg-amber-50 text-amber-900 border-amber-200 hover:border-amber-400'}`}>
          <p className={`text-[10px] uppercase tracking-widest font-bold mb-1 ${statusFilter === 'PENDING' ? 'text-amber-300' : 'text-amber-700'}`}>Aguardando Pagto</p>
          <p className="text-3xl font-black tracking-tighter">{getCount('PENDING')}</p>
        </Link>
        <Link href={{ pathname: '/admin/vendas', query: { ...resolvedParams, status: 'PAID' } }} className={`p-5 rounded-xl border shadow-sm transition-all flex flex-col ${statusFilter === 'PAID' ? 'bg-emerald-900 text-white border-emerald-900' : 'bg-emerald-50 text-emerald-900 border-emerald-200 hover:border-emerald-400'}`}>
          <p className={`text-[10px] uppercase tracking-widest font-bold mb-1 ${statusFilter === 'PAID' ? 'text-emerald-300' : 'text-emerald-700'}`}>Aprovados</p>
          <p className="text-3xl font-black tracking-tighter">{getCount('PAID')}</p>
        </Link>
        <Link href={{ pathname: '/admin/vendas', query: { ...resolvedParams, status: 'SHIPPED' } }} className={`p-5 rounded-xl border shadow-sm transition-all flex flex-col ${statusFilter === 'SHIPPED' ? 'bg-blue-900 text-white border-blue-900' : 'bg-blue-50 text-blue-900 border-blue-200 hover:border-blue-400'}`}>
          <p className={`text-[10px] uppercase tracking-widest font-bold mb-1 ${statusFilter === 'SHIPPED' ? 'text-blue-300' : 'text-blue-700'}`}>Enviados</p>
          <p className="text-3xl font-black tracking-tighter">{getCount('SHIPPED')}</p>
        </Link>
      </div>

      {/* Sub-filtros Adicionais */}
      <div className="flex flex-wrap gap-4 items-center mb-8 bg-white p-3 rounded-xl border border-zinc-200 shadow-sm">
        <div className="flex items-center gap-2 pr-4 border-r border-zinc-100 hidden sm:flex">
          <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Mais Filtros:</span>
        </div>

        {/* Tipo: Varejo / Atacado */}
        <div className="flex gap-1.5 bg-zinc-50 p-1 rounded-lg border border-zinc-100">
          <Link href={{ pathname: '/admin/vendas', query: { ...resolvedParams, type: 'all' } }} className={`px-4 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${(!resolvedParams?.type || resolvedParams?.type === 'all') ? 'bg-white text-zinc-900 shadow-sm border border-zinc-200' : 'text-zinc-500 hover:text-zinc-900'}`}>Todos</Link>
          <Link href={{ pathname: '/admin/vendas', query: { ...resolvedParams, type: 'varejo' } }} className={`px-4 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1 ${resolvedParams?.type === 'varejo' ? 'bg-white text-zinc-900 shadow-sm border border-zinc-200' : 'text-zinc-500 hover:text-zinc-900'}`}>Varejo <span className="opacity-60">({countVarejo})</span></Link>
          <Link href={{ pathname: '/admin/vendas', query: { ...resolvedParams, type: 'atacado' } }} className={`px-4 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1 ${resolvedParams?.type === 'atacado' ? 'bg-white text-zinc-900 shadow-sm border border-zinc-200' : 'text-zinc-500 hover:text-zinc-900'}`}>Atacado <span className="opacity-60">({countAtacado})</span></Link>
        </div>

        {/* Período */}
        <div className="flex gap-1.5 bg-zinc-50 p-1 rounded-lg border border-zinc-100 sm:ml-auto">
          <Link href={{ pathname: '/admin/vendas', query: { ...resolvedParams, period: 'all' } }} className={`px-4 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${periodFilter === 'all' ? 'bg-zinc-900 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-900'}`}>Sempre</Link>
          <Link href={{ pathname: '/admin/vendas', query: { ...resolvedParams, period: 'month' } }} className={`px-4 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1 ${periodFilter === 'month' ? 'bg-zinc-900 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-900'}`}>Este Mês <span className="opacity-60">({countMonth})</span></Link>
          <Link href={{ pathname: '/admin/vendas', query: { ...resolvedParams, period: 'today' } }} className={`px-4 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1 ${periodFilter === 'today' ? 'bg-zinc-900 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-900'}`}>Hoje <span className="opacity-60">({countToday})</span></Link>
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
