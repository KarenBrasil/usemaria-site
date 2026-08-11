import prisma from "@/lib/prisma"
import Link from "next/link"
import { updateOrderStatus, confirmPixOrder, generateShippingLabel } from "../../actions"

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
      
      <div className="space-y-4">
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
            <details key={order.id} className="group bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden hover:shadow-md transition-shadow">
              
              {/* Cabeçalho do Card (Sempre Visível) */}
              <summary className="cursor-pointer list-none p-5 md:p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 outline-none [&::-webkit-details-marker]:hidden bg-white group-open:bg-zinc-50/50 transition-colors">
                <div className="flex items-center gap-4 w-full md:w-auto">
                  <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400 group-open:rotate-180 transition-transform">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-extrabold text-xl tracking-tight">Pedido #{order.id.slice(-6).toUpperCase()}</h3>
                      <span className="text-xs font-medium text-zinc-400">
                        {new Date(order.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute:'2-digit' })}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-zinc-600">Comprador: <span className="text-zinc-900 font-bold">{order.customer?.name}</span></p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 ml-12 md:ml-0">
                  <div className="text-right mr-2 hidden md:block">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Total Pago</p>
                    <p className="font-bold text-lg tracking-tighter text-zinc-900">R$ {order.total.toFixed(2).replace('.', ',')}</p>
                  </div>
                  {/* ETIQUETA SUPER CHAMATIVA */}
                  <div className={`px-4 py-2 rounded-lg border-2 shadow-sm font-extrabold text-xs uppercase tracking-widest flex items-center gap-2 ${
                    order.status === 'PENDING' ? 'bg-amber-50 text-amber-700 border-amber-200' : 
                    order.status === 'PAID' ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 
                    order.status === 'SHIPPED' ? 'bg-blue-50 text-blue-700 border-blue-300' : 
                    order.status === 'DELIVERED' ? 'bg-zinc-100 text-zinc-800 border-zinc-300' : 
                    'bg-rose-50 text-rose-700 border-rose-200'
                  }`}>
                    {order.status === 'PENDING' && <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>}
                    {order.status === 'PAID' && <span className="w-2 h-2 rounded-full bg-emerald-500"></span>}
                    {order.status === 'PENDING' ? 'Aguardando Pagamento' : 
                     order.status === 'PAID' ? 'Pagamento Aprovado' : 
                     order.status === 'SHIPPED' ? 'Enviado' : 
                     order.status === 'DELIVERED' ? 'Entregue' : 'Cancelado'}
                  </div>
                </div>
              </summary>

              {/* Corpo do Card (Expandível) */}
              <div className="p-5 md:p-6 flex flex-col lg:flex-row gap-8 border-t border-zinc-100 bg-zinc-50/30">
                
                {/* Coluna 1: Produtos e Endereço */}
                <div className="flex-1 space-y-6">
                  
                  {/* Produtos */}
                  <div>
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-3 flex items-center gap-2">
                       <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                       Itens Comprados
                    </h4>
                    <div className="border border-zinc-100 rounded-xl overflow-hidden bg-white">
                      {order.items.map((item, idx) => (
                        <div key={item.id} className={`flex justify-between items-center p-4 text-sm ${idx !== order.items.length - 1 ? 'border-b border-zinc-50' : ''}`}>
                          <div className="flex items-center gap-4">
                            <span className="bg-zinc-100 text-zinc-800 text-xs font-black px-2.5 py-1 rounded-md">{item.quantity}x</span>
                            <div>
                              <p className="font-bold text-zinc-900">{item.product?.name || 'Produto Excluído'}</p>
                              <p className="text-zinc-500 text-[11px] uppercase tracking-wider font-semibold">Tamanho: {item.size}</p>
                            </div>
                          </div>
                          <span className="font-bold text-zinc-900">R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}</span>
                        </div>
                      ))}
                      <div className="bg-zinc-50 p-4 flex justify-between items-center border-t border-zinc-100 md:hidden">
                         <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Valor Total Pago</span>
                         <span className="text-xl font-black tracking-tighter text-emerald-600">R$ {order.total.toFixed(2).replace('.', ',')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Endereço de Entrega */}
                  <div className="bg-blue-50/50 rounded-xl p-5 border border-blue-100 flex gap-4 items-start">
                     <div className="bg-blue-100 p-2.5 rounded-lg text-blue-600 shrink-0 mt-0.5">
                       <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                     </div>
                     <div>
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-blue-800 mb-1">Endereço de Entrega</h4>
                        {order.street ? (
                          <div className="text-sm font-medium text-zinc-800 leading-relaxed">
                            <p>{order.street}, {order.number} {order.complement && `- ${order.complement}`}</p>
                            <p>{order.neighborhood} - {order.city}/{order.state}</p>
                            <p className="text-zinc-500 text-xs mt-1 font-mono">CEP: {order.zipcode}</p>
                          </div>
                        ) : (
                          <p className="text-sm text-rose-600 font-medium italic">Endereço não registrado (Pedido antigo)</p>
                        )}
                     </div>
                  </div>

                </div>
                
                {/* Coluna 2: Ações Gerenciais */}
                <div className="lg:w-80 border-t lg:border-t-0 lg:border-l border-zinc-200 pt-6 lg:pt-0 lg:pl-8 flex flex-col gap-6">
                  
                  {/* Bloco 1: Alteração de Status */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-3">Controle de Status</h4>
                    <form action={updateOrderStatus.bind(null, order.id)} className="flex flex-col gap-2">
                      <select 
                        name="status" 
                        defaultValue={order.status}
                        className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:border-black focus:ring-1 focus:ring-black outline-none transition-colors text-sm font-semibold w-full shadow-sm"
                      >
                        <option value="PENDING">Pendente</option>
                        <option value="PAID">Pagamento Aprovado</option>
                        <option value="SHIPPED">Enviado / Em Trânsito</option>
                        <option value="DELIVERED">Entregue</option>
                        <option value="CANCELLED">Cancelado</option>
                      </select>
                      <button type="submit" className="w-full bg-zinc-900 text-white font-bold tracking-widest uppercase text-[11px] py-3.5 rounded-xl hover:bg-zinc-800 transition-colors shadow-sm">
                        Atualizar Status
                      </button>
                    </form>
                  </div>

                  {/* Ações Dinâmicas (PIX ou Melhor Envio) */}
                  {(order.status === 'PENDING' || order.status === 'PAID' || order.status === 'SHIPPED') && (
                    <hr className="border-zinc-200" />
                  )}
                  
                  <div className="space-y-3">
                    
                    {order.status === 'PENDING' && (
                      <form action={confirmPixOrder.bind(null, order.id)}>
                        <button type="submit" className="w-full bg-emerald-50 text-emerald-700 border-2 border-emerald-500 font-bold tracking-wide text-[13px] py-3 rounded-xl hover:bg-emerald-100 transition-colors flex items-center justify-center gap-2 shadow-sm">
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                          Aprovar Pagamento
                        </button>
                      </form>
                    )}

                    {(order.status === 'PAID' || order.status === 'SHIPPED') && (
                      <div className="flex flex-col gap-3">
                        <form action={generateShippingLabel.bind(null, order.id)}>
                          <button type="submit" className="w-full bg-[#ffcc00] text-black font-bold tracking-wide text-[13px] py-3 rounded-xl hover:bg-[#ffdb4d] transition-colors flex items-center justify-center gap-2 shadow-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
                            Gerar Etiqueta
                          </button>
                        </form>
                        
                        <a 
                          href="https://app.melhorenvio.com.br/carrinho" 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="w-full bg-white text-zinc-700 border border-zinc-200 font-semibold text-[13px] py-3 rounded-xl hover:bg-zinc-50 transition-colors flex items-center justify-center gap-2 shadow-sm"
                        >
                          Acessar Melhor Envio
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                        </a>
                      </div>
                    )}
                  </div>

                </div>
              </div>
            </details>
          ))
        )}
      </div>
    </div>
  )
}
