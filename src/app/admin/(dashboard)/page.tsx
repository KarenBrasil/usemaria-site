import prisma from "@/lib/prisma"
import Link from "next/link"
import { resolvePeriod, createdAtFilter } from "@/lib/period"

export const dynamic = 'force-dynamic';

const money = (v: number) => `R$ ${v.toFixed(2).replace('.', ',')}`;
const APPROVED = ['PAID', 'DELIVERED', 'SHIPPED'];

const PRESETS: { key: string; label: string }[] = [
  { key: 'today', label: 'Hoje' },
  { key: '7days', label: '7 dias' },
  { key: '30days', label: '30 dias' },
  { key: 'month', label: 'Este mês' },
  { key: 'all', label: 'Tudo' },
];

export default async function AdminOverview({ searchParams }: { searchParams: Promise<{ period?: string, from?: string, to?: string }> }) {
  const params = await searchParams;
  const period = resolvePeriod(params);
  const createdAt = createdAtFilter(period);
  const inPeriod = createdAt ? { createdAt } : {};

  const totalProducts = await prisma.product.count()

  // Pedidos do período
  const orders = await prisma.order.findMany({
    where: inPeriod,
    include: { customer: true, items: { include: { product: true } } },
    orderBy: { createdAt: 'desc' }
  })

  const approvedOrders = orders.filter(o => APPROVED.includes(o.status));
  const totalOrders = orders.length;
  const revenue = approvedOrders.reduce((acc, o) => acc + o.total, 0);
  const ticket = approvedOrders.length > 0 ? revenue / approvedOrders.length : 0;
  const itemsSold = approvedOrders.reduce((acc, o) => acc + o.items.reduce((a, i) => a + i.quantity, 0), 0);
  const pendingOrders = orders.filter(o => o.status === 'PENDING').length;
  const recentOrders = orders.slice(0, 5);

  // Mais vendidos no período (só pedidos aprovados)
  const salesByProduct = new Map<string, { name: string; qty: number; revenue: number }>();
  for (const o of approvedOrders) {
    for (const i of o.items) {
      const key = i.productId || i.id;
      const entry = salesByProduct.get(key) || { name: i.product?.name || 'Produto removido', qty: 0, revenue: 0 };
      entry.qty += i.quantity;
      entry.revenue += i.price * i.quantity;
      salesByProduct.set(key, entry);
    }
  }
  const topProducts = [...salesByProduct.values()].sort((a, b) => b.qty - a.qty).slice(0, 5);

  // Low stock products
  const lowStockProducts = await prisma.productSize.findMany({
    where: { stock: { lt: 5 } },
    include: { product: true },
    take: 5,
    orderBy: { stock: 'asc' }
  })

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900">Visão Geral</h2>
          <p className="text-sm text-zinc-500 mt-1">Bem-vinda ao painel de controle da Use Maria.</p>
        </div>
        <Link
          href="/admin/relatorios"
          title="Exportar Relatórios"
          className="bg-black text-white p-3 rounded-lg hover:bg-zinc-800 transition-colors shadow-sm self-start md:self-auto flex items-center justify-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
        </Link>
      </div>

      {/* FILTRO DE PERÍODO */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-4 mb-8 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex bg-zinc-100 p-1 rounded-lg self-start flex-wrap">
          {PRESETS.map(p => (
            <Link
              key={p.key}
              href={`/admin?period=${p.key}`}
              className={`px-4 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${period.key === p.key ? 'bg-zinc-900 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-900'}`}
            >
              {p.label}
            </Link>
          ))}
        </div>

        <form action="/admin" method="GET" className="flex items-end gap-3 flex-wrap">
          <label className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-widest font-bold text-zinc-500">De</span>
            <input type="date" name="from" defaultValue={period.fromStr || ''} className="border border-zinc-200 rounded-md px-3 py-1.5 text-sm text-zinc-900 focus:outline-none focus:border-black" />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-widest font-bold text-zinc-500">Até</span>
            <input type="date" name="to" defaultValue={period.toStr || ''} className="border border-zinc-200 rounded-md px-3 py-1.5 text-sm text-zinc-900 focus:outline-none focus:border-black" />
          </label>
          <button type="submit" className="bg-zinc-900 text-white px-4 py-2 rounded-md text-[10px] font-bold uppercase tracking-wider hover:bg-black transition-colors">
            Aplicar
          </button>
        </form>
      </div>

      <p className="text-[11px] uppercase tracking-widest font-bold text-zinc-400 mb-4">
        Período: <span className="text-zinc-900">{period.label}</span>
      </p>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-12">
        <Link href="/admin/vendas" className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm flex flex-col justify-between hover:border-black transition-colors cursor-pointer group">
          <p className="text-[11px] text-zinc-500 uppercase tracking-widest font-bold mb-4 group-hover:text-black transition-colors">Pedidos</p>
          <p className="text-4xl font-semibold tracking-tight text-zinc-900">{totalOrders}</p>
          <p className="text-xs text-zinc-500 mt-2">{approvedOrders.length} aprovados · {pendingOrders} pendentes</p>
        </Link>
        <Link href="/admin/vendas?status=PAID" className="bg-zinc-900 p-6 rounded-xl border border-zinc-800 shadow-md flex flex-col justify-between text-white hover:bg-black transition-colors cursor-pointer">
          <p className="text-[11px] text-zinc-400 uppercase tracking-widest font-bold mb-4">Faturamento (Aprovado)</p>
          <p className="text-4xl font-semibold tracking-tight">{money(revenue)}</p>
          <p className="text-xs text-zinc-400 mt-2">{itemsSold} peças vendidas</p>
        </Link>
        <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm flex flex-col justify-between">
          <p className="text-[11px] text-zinc-500 uppercase tracking-widest font-bold mb-4">Ticket Médio</p>
          <p className="text-4xl font-semibold tracking-tight text-zinc-900">{money(ticket)}</p>
          <p className="text-xs text-zinc-500 mt-2">por pedido aprovado</p>
        </div>
        <Link href="/admin/produtos" className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm flex flex-col justify-between hover:border-black transition-colors cursor-pointer group md:col-start-3">
          <p className="text-[11px] text-zinc-500 uppercase tracking-widest font-bold mb-4 group-hover:text-black transition-colors">Total de Produtos</p>
          <p className="text-4xl font-semibold tracking-tight text-zinc-900">{totalProducts}</p>
          <p className="text-xs text-zinc-500 mt-2">no catálogo (não depende do período)</p>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold tracking-tight">Mais Vendidos</h3>
            <span className="text-xs text-zinc-400 uppercase font-bold tracking-widest">{period.label}</span>
          </div>
          <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden shadow-sm">
            {topProducts.length === 0 ? (
              <p className="p-8 text-sm text-zinc-500 text-center bg-zinc-50/50">Nenhuma venda aprovada no período.</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-zinc-50/80 border-b border-zinc-200">
                  <tr className="text-left text-[10px] uppercase tracking-widest text-zinc-500 font-bold">
                    <th className="p-4">Produto</th>
                    <th className="p-4 text-right">Peças</th>
                    <th className="p-4 text-right">Receita</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {topProducts.map((p, i) => (
                    <tr key={i} className="hover:bg-zinc-50/50 transition-colors">
                      <td className="p-4 font-medium text-zinc-900">{p.name}</td>
                      <td className="p-4 text-right text-zinc-600">{p.qty} un</td>
                      <td className="p-4 text-right font-medium text-zinc-900">{money(p.revenue)}</td>
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
              <p className="p-8 text-sm text-zinc-500 text-center bg-zinc-50/50">Nenhum pedido no período.</p>
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
                        <p className="text-xs text-zinc-500 mt-0.5">#{order.id.slice(-6).toUpperCase()} · {new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit' }).format(order.createdAt)}</p>
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
                      <td className="p-4 text-right font-medium text-zinc-900">{money(order.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="lg:col-span-2">
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
      </div>
    </div>
  )
}
