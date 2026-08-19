import prisma from "@/lib/prisma";
import PrintButton from "@/components/admin/PrintButton";
import Link from "next/link";

export default async function RelatoriosPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const resolvedParams = await searchParams;
  const type = resolvedParams.type;

  // Render Menu if no type selected
  if (!type) {
    return (
      <div className="bg-white min-h-screen p-8 md:p-12">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Link href="/admin" className="text-zinc-500 hover:text-black">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </Link>
            <h1 className="text-3xl font-serif tracking-[0.2em] font-bold">RELATÓRIOS</h1>
          </div>
          
          <p className="text-zinc-600 mb-8">Selecione qual relatório você deseja extrair:</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link href="/admin/relatorios?type=financeiro" className="bg-zinc-50 p-6 rounded-xl border border-zinc-200 hover:border-black hover:bg-white transition-all cursor-pointer group flex flex-col items-center text-center">
              <div className="bg-zinc-100 p-4 rounded-full mb-4 group-hover:bg-zinc-900 group-hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
              </div>
              <h3 className="font-bold text-lg mb-2">Financeiro</h3>
              <p className="text-xs text-zinc-500">Total de pedidos e faturamento bruto.</p>
            </Link>

            <Link href="/admin/relatorios?type=estoque" className="bg-zinc-50 p-6 rounded-xl border border-zinc-200 hover:border-black hover:bg-white transition-all cursor-pointer group flex flex-col items-center text-center">
              <div className="bg-zinc-100 p-4 rounded-full mb-4 group-hover:bg-zinc-900 group-hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>
              </div>
              <h3 className="font-bold text-lg mb-2">Estoque</h3>
              <p className="text-xs text-zinc-500">Lista de todas as peças e quantidades exatas.</p>
            </Link>

            <Link href="/admin/relatorios?type=vendas" className="bg-zinc-50 p-6 rounded-xl border border-zinc-200 hover:border-black hover:bg-white transition-all cursor-pointer group flex flex-col items-center text-center">
              <div className="bg-zinc-100 p-4 rounded-full mb-4 group-hover:bg-zinc-900 group-hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>
              </div>
              <h3 className="font-bold text-lg mb-2">Pedidos</h3>
              <p className="text-xs text-zinc-500">Histórico detalhado das últimas vendas.</p>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Fetch data based on type
  let content = null;
  let title = "";

  if (type === 'financeiro') {
    title = "Resumo Financeiro";
    const orders = await prisma.order.findMany();
    
    // Status breakdown
    const approvedOrders = orders.filter(o => ['PAID', 'SHIPPED', 'DELIVERED'].includes(o.status));
    const pendingOrders = orders.filter(o => o.status === 'PENDING');
    const cancelledOrders = orders.filter(o => o.status === 'CANCELLED');

    // Revenue calculations (only from approved orders!)
    const totalRevenue = approvedOrders.reduce((acc, order) => acc + order.total, 0);
    
    // Payment method breakdown (from approved orders)
    const pixRevenue = approvedOrders.filter(o => o.paymentMethod === 'PIX' || !o.paymentMethod).reduce((acc, order) => acc + order.total, 0);
    const cardRevenue = approvedOrders.filter(o => o.paymentMethod === 'CARD' || o.paymentMethod === 'Cartão').reduce((acc, order) => acc + order.total, 0);
    
    const pixCount = approvedOrders.filter(o => o.paymentMethod === 'PIX' || !o.paymentMethod).length;
    const cardCount = approvedOrders.filter(o => o.paymentMethod === 'CARD' || o.paymentMethod === 'Cartão').length;

    content = (
      <div className="space-y-8">
        
        {/* Receita Principal */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-zinc-200 p-6 rounded-xl bg-white shadow-sm">
            <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold mb-2">Receita Bruta (Somente Aprovados)</p>
            <p className="text-4xl font-black text-emerald-600 tracking-tighter">R$ {totalRevenue.toFixed(2).replace('.', ',')}</p>
            <p className="text-[11px] text-zinc-500 mt-2 font-medium">Faturamento real de pedidos pagos, enviados ou entregues.</p>
          </div>
          
          <div className="border border-zinc-200 p-6 rounded-xl bg-white shadow-sm">
            <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold mb-2">Pedidos Realizados (Geral)</p>
            <p className="text-4xl font-black text-zinc-900 tracking-tighter">{orders.length}</p>
            <p className="text-[11px] text-zinc-500 mt-2 font-medium">Contagem total de pedidos que entraram no sistema.</p>
          </div>
        </div>

        {/* Breakdown de Status */}
        <div>
          <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400 mb-3 flex items-center gap-2">
             <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
             Desempenho por Status
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-emerald-800 shadow-sm">
               <p className="text-[10px] font-bold uppercase tracking-widest mb-1">Aprovados / Concluídos</p>
               <p className="text-2xl font-black">{approvedOrders.length} <span className="text-xs font-bold opacity-70 tracking-widest uppercase">pedidos</span></p>
            </div>
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-amber-800 shadow-sm">
               <p className="text-[10px] font-bold uppercase tracking-widest mb-1">Aguardando Pagto</p>
               <p className="text-2xl font-black">{pendingOrders.length} <span className="text-xs font-bold opacity-70 tracking-widest uppercase">pedidos</span></p>
            </div>
            <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl text-rose-800 shadow-sm">
               <p className="text-[10px] font-bold uppercase tracking-widest mb-1">Cancelados</p>
               <p className="text-2xl font-black">{cancelledOrders.length} <span className="text-xs font-bold opacity-70 tracking-widest uppercase">pedidos</span></p>
            </div>
          </div>
        </div>

        {/* Breakdown de Métodos de Pagamento (Dos aprovados) */}
        <div>
          <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400 mb-3 flex items-center gap-2">
             <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
             Receita por Meio de Pagamento (Dos Aprovados)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white border border-zinc-200 p-5 rounded-xl shadow-sm flex justify-between items-center">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Pagamentos via PIX</p>
                <p className="text-xl font-bold text-zinc-900 tracking-tight">R$ {pixRevenue.toFixed(2).replace('.', ',')}</p>
              </div>
              <div className="text-right">
                <span className="bg-zinc-100 text-zinc-600 font-bold px-2 py-1 rounded text-[10px] uppercase tracking-widest">{pixCount} pedidos</span>
              </div>
            </div>
            
            <div className="bg-white border border-zinc-200 p-5 rounded-xl shadow-sm flex justify-between items-center">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Pagamentos via Cartão</p>
                <p className="text-xl font-bold text-zinc-900 tracking-tight">R$ {cardRevenue.toFixed(2).replace('.', ',')}</p>
              </div>
              <div className="text-right">
                <span className="bg-zinc-100 text-zinc-600 font-bold px-2 py-1 rounded text-[10px] uppercase tracking-widest">{cardCount} pedidos</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    );
  } 
  
  else if (type === 'estoque') {
    title = "Inventário de Estoque";
    const products = await prisma.product.findMany({ include: { sizes: true }, orderBy: { createdAt: 'desc' } });
    
    content = (
      <table className="w-full text-sm border-collapse border border-zinc-200">
        <thead className="bg-zinc-50">
          <tr className="text-left text-zinc-600 border-b border-zinc-200">
            <th className="py-3 px-4 font-bold border-r border-zinc-200">Produto</th>
            <th className="py-3 px-4 font-bold text-center border-r border-zinc-200">Cor/Variação</th>
            <th className="py-3 px-4 font-bold text-center border-r border-zinc-200">Tamanho</th>
            <th className="py-3 px-4 font-bold text-center border-r border-zinc-200">Qtd Atual</th>
            <th className="py-3 px-4 font-bold text-center">Status</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            product.sizes.map((size) => (
              <tr key={size.id} className="border-b border-zinc-200">
                <td className="py-2 px-4 border-r border-zinc-200 font-medium">{product.name}</td>
                <td className="py-2 px-4 text-center border-r border-zinc-200">{size.color}</td>
                <td className="py-2 px-4 text-center border-r border-zinc-200">{size.size}</td>
                <td className={`py-2 px-4 text-center font-bold border-r border-zinc-200 ${size.stock <= 0 ? 'text-red-500' : 'text-zinc-800'}`}>
                  {size.stock}
                </td>
                <td className="py-2 px-4 text-center text-xs font-bold uppercase">
                  {size.stock > 5 ? <span className="text-emerald-600">Normal</span> : size.stock > 0 ? <span className="text-amber-600">Baixo</span> : <span className="text-red-600">Esgotado</span>}
                </td>
              </tr>
            ))
          ))}
        </tbody>
      </table>
    );
  } 
  
  else if (type === 'vendas') {
    const periodFilter = resolvedParams.period || 'all';
    const typeFilter = resolvedParams.filterType || 'all';

    title = "Histórico de Vendas";
    
    let whereClause: any = {};
    if (periodFilter === 'today') {
      const today = new Date(); today.setHours(0, 0, 0, 0); whereClause.createdAt = { gte: today };
    } else if (periodFilter === 'month') {
      const firstDay = new Date(); firstDay.setDate(1); firstDay.setHours(0, 0, 0, 0); whereClause.createdAt = { gte: firstDay };
    }

    let orders = await prisma.order.findMany({ where: whereClause, orderBy: { createdAt: 'desc' }, include: { customer: true, items: true } });

    if (typeFilter !== 'all') {
      orders = orders.filter(order => {
        const totalItems = order.items.reduce((acc, item) => acc + item.quantity, 0);
        const isWholesale = totalItems >= 10;
        return typeFilter === 'atacado' ? isWholesale : !isWholesale;
      });
    }

    content = (
      <>
      {/* Filtros para impressão (escondidos ao imprimir) */}
      <div className="flex gap-4 mb-6 print:hidden">
        <div className="flex gap-2 bg-zinc-100 p-1 rounded-lg">
          <Link href="/admin/relatorios?type=vendas&period=all&filterType=all" className="px-3 py-1 text-xs font-bold uppercase hover:bg-white rounded">Limpar Filtros</Link>
          <Link href={`/admin/relatorios?type=vendas&period=${periodFilter}&filterType=varejo`} className={`px-3 py-1 text-xs font-bold uppercase rounded ${typeFilter === 'varejo' ? 'bg-white shadow' : 'hover:bg-zinc-200'}`}>Varejo</Link>
          <Link href={`/admin/relatorios?type=vendas&period=${periodFilter}&filterType=atacado`} className={`px-3 py-1 text-xs font-bold uppercase rounded ${typeFilter === 'atacado' ? 'bg-white shadow' : 'hover:bg-zinc-200'}`}>Atacado</Link>
        </div>
        <div className="flex gap-2 bg-zinc-100 p-1 rounded-lg">
          <Link href={`/admin/relatorios?type=vendas&filterType=${typeFilter}&period=today`} className={`px-3 py-1 text-xs font-bold uppercase rounded ${periodFilter === 'today' ? 'bg-white shadow' : 'hover:bg-zinc-200'}`}>Hoje</Link>
          <Link href={`/admin/relatorios?type=vendas&filterType=${typeFilter}&period=month`} className={`px-3 py-1 text-xs font-bold uppercase rounded ${periodFilter === 'month' ? 'bg-white shadow' : 'hover:bg-zinc-200'}`}>Este Mês</Link>
        </div>
      </div>
      <table className="w-full text-sm border-collapse border border-zinc-200">
        <thead className="bg-zinc-50">
          <tr className="text-left text-zinc-600 border-b border-zinc-200">
            <th className="py-3 px-4 font-bold border-r border-zinc-200">Pedido</th>
            <th className="py-3 px-4 font-bold border-r border-zinc-200">Data</th>
            <th className="py-3 px-4 font-bold border-r border-zinc-200">Cliente / Contato</th>
            <th className="py-3 px-4 font-bold border-r border-zinc-200 text-center">Itens</th>
            <th className="py-3 px-4 font-bold border-r border-zinc-200 text-right">Valor</th>
            <th className="py-3 px-4 font-bold text-center">Status</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id} className="border-b border-zinc-200">
              <td className="py-2 px-4 border-r border-zinc-200 font-mono text-xs">#{order.id.slice(-6).toUpperCase()}</td>
              <td className="py-2 px-4 border-r border-zinc-200">{new Date(order.createdAt).toLocaleDateString('pt-BR')}</td>
              <td className="py-2 px-4 border-r border-zinc-200">
                <p className="font-medium">{order.customer?.name}</p>
                <p className="text-[10px] text-zinc-500">{order.customer?.phone}</p>
              </td>
              <td className="py-2 px-4 text-center border-r border-zinc-200">{order.items.reduce((acc, item) => acc + item.quantity, 0)}</td>
              <td className="py-2 px-4 text-right border-r border-zinc-200">R$ {order.total.toFixed(2).replace('.', ',')}</td>
              <td className="py-2 px-4 text-center text-xs font-bold uppercase">
                {order.status === 'PAID' ? <span className="text-emerald-600">Pago</span> : 
                 order.status === 'SHIPPED' ? <span className="text-blue-600">Enviado</span> :
                 order.status === 'DELIVERED' ? <span className="text-purple-600">Entregue</span> :
                 order.status === 'CANCELLED' ? <span className="text-red-600">Cancelado</span> :
                 <span className="text-amber-600">Pendente</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-xs text-zinc-400 mt-2 italic">* Listagem completa de todos os pedidos registrados.</p>
      </>
    );
  }

  return (
    <div className="bg-white min-h-screen text-black font-sans p-8 md:p-12 print:p-0 print:m-0">
      
      {/* Voltar (Hide in Print) */}
      <div className="max-w-5xl mx-auto mb-6 print:hidden">
        <Link href="/admin/relatorios" className="text-sm font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2 hover:text-black transition-colors w-fit">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg> Voltar ao Menu
        </Link>
      </div>

      <div className="max-w-5xl mx-auto print:max-w-none">
        
        {/* Header */}
        <div className="flex justify-between items-end mb-8 border-b border-zinc-200 pb-6">
          <div>
            <h1 className="text-3xl font-serif tracking-[0.2em] font-bold mb-2">USE MARIA</h1>
            <p className="text-xs text-zinc-500 uppercase tracking-widest">Relatório: {title}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-zinc-600 mt-1">
              Extraído em: {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}
            </p>
          </div>
        </div>

        {/* Dynamic Content */}
        <div className="mb-12">
          {content}
        </div>

      </div>

      <PrintButton />

    </div>
  );
}
