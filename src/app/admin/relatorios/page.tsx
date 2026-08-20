import prisma from "@/lib/prisma";
import PrintButton from "@/components/admin/PrintButton";
import Link from "next/link";

export default async function RelatoriosPage({ searchParams }: { searchParams: Promise<{ type?: string, size?: string, period?: string, filterType?: string }> }) {
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
    const sizeFilter = resolvedParams.size || 'all';

    let products = await prisma.product.findMany({ include: { sizes: true }, orderBy: { createdAt: 'desc' } });
    
    // Aggregations
    let totalItems = 0;
    let outOfStock = 0;
    let lowStock = 0;
    const sizeCounts: Record<string, number> = {};

    products.forEach(p => {
      p.sizes.forEach(s => {
        // Sempre conta para os botões de tamanho
        sizeCounts[s.size] = (sizeCounts[s.size] || 0) + s.stock;

        // Conta para os cards superiores se o tamanho bater com o filtro (ou se for 'all')
        if (sizeFilter === 'all' || s.size === sizeFilter) {
          totalItems += s.stock;
          if (s.stock === 0) outOfStock++;
          else if (s.stock < 3 && s.stock > 0) lowStock++;
        }
      });
    });

    // Sort sizes for better display
    const sortedSizes = Object.entries(sizeCounts).sort((a, b) => {
      const order = { 'PP': 1, 'P': 2, 'M': 3, 'G': 4, 'GG': 5, 'XG': 6 };
      return (order[a[0] as keyof typeof order] || 99) - (order[b[0] as keyof typeof order] || 99);
    });

    // Filter by size if requested
    if (sizeFilter !== 'all') {
      products = products.map(p => ({
        ...p,
        sizes: p.sizes.filter(s => s.size === sizeFilter)
      })).filter(p => p.sizes.length > 0);
    }
    
    content = (
      <div className="space-y-6">
        {/* Métricas Principais */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border border-zinc-200 p-6 rounded-xl bg-white shadow-sm">
            <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold mb-2">Total de Peças</p>
            <p className="text-4xl font-black text-zinc-900 tracking-tighter">{totalItems}</p>
          </div>
          <div className="border border-red-200 bg-red-50 p-6 rounded-xl shadow-sm text-red-800">
            <p className="text-[10px] uppercase tracking-widest font-bold mb-2">Esgotados</p>
            <p className="text-4xl font-black tracking-tighter">{outOfStock}</p>
          </div>
          <div className="border border-amber-200 bg-amber-50 p-6 rounded-xl shadow-sm text-amber-800">
            <p className="text-[10px] uppercase tracking-widest font-bold mb-2">Baixo Estoque</p>
            <p className="text-4xl font-black tracking-tighter">{lowStock}</p>
          </div>
        </div>

        {/* Filtros por Tamanho (Cards) */}
        <div>
          <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400 mb-3 flex items-center gap-2 print:hidden">
             <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
             Filtro Rápido por Tamanho
          </h3>
          <div className="flex flex-wrap gap-3 print:hidden mb-6">
            <Link href="/admin/relatorios?type=estoque&size=all" className={`px-4 py-3 rounded-xl border flex flex-col items-center justify-center min-w-[80px] transition-all ${sizeFilter === 'all' ? 'bg-zinc-900 text-white border-zinc-900 shadow-md' : 'bg-white text-zinc-600 border-zinc-200 hover:border-black'}`}>
              <span className="text-[10px] font-bold uppercase tracking-widest">Todos</span>
            </Link>
            {sortedSizes.map(([size, count]) => (
              <Link key={size} href={`/admin/relatorios?type=estoque&size=${size}`} className={`px-4 py-3 rounded-xl border flex flex-col items-center justify-center min-w-[80px] transition-all ${sizeFilter === size ? 'bg-zinc-900 text-white border-zinc-900 shadow-md' : 'bg-white text-zinc-600 border-zinc-200 hover:border-black'}`}>
                <span className="text-lg font-black leading-none mb-1">{size}</span>
                <span className={`text-[10px] font-bold uppercase tracking-widest ${sizeFilter === size ? 'text-zinc-300' : 'text-zinc-400'}`}>{count} un</span>
              </Link>
            ))}
          </div>
        </div>

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
                <tr key={size.id} className="border-b border-zinc-200 hover:bg-zinc-50">
                  <td className="py-2 px-4 border-r border-zinc-200 font-medium text-zinc-900">{product.name}</td>
                  <td className="py-2 px-4 text-center border-r border-zinc-200">{size.color}</td>
                  <td className="py-2 px-4 text-center border-r border-zinc-200 font-bold">{size.size}</td>
                  <td className={`py-2 px-4 text-center font-bold border-r border-zinc-200 ${size.stock <= 0 ? 'text-red-500' : 'text-zinc-800'}`}>
                    {size.stock}
                  </td>
                  <td className="py-2 px-4 text-center text-[10px] tracking-widest font-bold uppercase">
                    {size.stock > 5 ? <span className="text-emerald-600">Normal</span> : size.stock > 0 ? <span className="text-amber-600">Baixo</span> : <span className="text-red-600">Esgotado</span>}
                  </td>
                </tr>
              ))
            ))}
          </tbody>
        </table>
      </div>
    );
  } 
  
  else if (type === 'vendas') {
    const periodFilter = resolvedParams.period || 'all';
    const typeFilter = resolvedParams.filterType || 'all';

    title = "Histórico de Vendas";
    
    let allOrders = await prisma.order.findMany({ orderBy: { createdAt: 'desc' }, include: { customer: true, items: true } });

    // Aggregations
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const firstDayMonth = new Date(); firstDayMonth.setDate(1); firstDayMonth.setHours(0, 0, 0, 0);

    let countToday = 0;
    let countMonth = 0;
    let countVarejo = 0;
    let countAtacado = 0;

    allOrders.forEach(o => {
      const items = o.items.reduce((acc, item) => acc + item.quantity, 0);
      if (items >= 10) countAtacado++;
      else countVarejo++;

      const createdAt = new Date(o.createdAt);
      if (createdAt >= today) countToday++;
      if (createdAt >= firstDayMonth) countMonth++;
    });

    // Apply Filters for the list
    let orders = allOrders;
    if (periodFilter === 'today') {
      orders = orders.filter(o => new Date(o.createdAt) >= today);
    } else if (periodFilter === 'month') {
      orders = orders.filter(o => new Date(o.createdAt) >= firstDayMonth);
    }

    if (typeFilter !== 'all') {
      orders = orders.filter(o => {
        const totalItems = o.items.reduce((acc, item) => acc + item.quantity, 0);
        return typeFilter === 'atacado' ? totalItems >= 10 : totalItems < 10;
      });
    }

    content = (
      <div className="space-y-6">
        {/* Filtros por Categoria (Cards) */}
        <div>
          <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400 mb-3 flex items-center gap-2 print:hidden">
             <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
             Filtros de Vendas
          </h3>
          <div className="flex flex-wrap gap-3 print:hidden mb-6">
            <Link href="/admin/relatorios?type=vendas&period=all&filterType=all" className={`px-5 py-4 rounded-xl border flex flex-col min-w-[120px] transition-all ${periodFilter === 'all' && typeFilter === 'all' ? 'bg-zinc-900 text-white border-zinc-900 shadow-md' : 'bg-white text-zinc-600 border-zinc-200 hover:border-black'}`}>
              <span className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${periodFilter === 'all' && typeFilter === 'all' ? 'text-zinc-400' : 'text-zinc-400'}`}>Geral</span>
              <span className="text-xl font-black leading-none">{allOrders.length} <span className="text-[10px] font-bold">pedidos</span></span>
            </Link>

            <div className="w-px bg-zinc-200 mx-1 hidden sm:block"></div>

            <Link href={`/admin/relatorios?type=vendas&filterType=${typeFilter}&period=today`} className={`px-5 py-4 rounded-xl border flex flex-col min-w-[120px] transition-all ${periodFilter === 'today' ? 'bg-zinc-900 text-white border-zinc-900 shadow-md' : 'bg-white text-zinc-600 border-zinc-200 hover:border-black'}`}>
              <span className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${periodFilter === 'today' ? 'text-zinc-400' : 'text-zinc-400'}`}>Hoje</span>
              <span className="text-xl font-black leading-none">{countToday} <span className="text-[10px] font-bold">pedidos</span></span>
            </Link>

            <Link href={`/admin/relatorios?type=vendas&filterType=${typeFilter}&period=month`} className={`px-5 py-4 rounded-xl border flex flex-col min-w-[120px] transition-all ${periodFilter === 'month' ? 'bg-zinc-900 text-white border-zinc-900 shadow-md' : 'bg-white text-zinc-600 border-zinc-200 hover:border-black'}`}>
              <span className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${periodFilter === 'month' ? 'text-zinc-400' : 'text-zinc-400'}`}>Este Mês</span>
              <span className="text-xl font-black leading-none">{countMonth} <span className="text-[10px] font-bold">pedidos</span></span>
            </Link>

            <div className="w-px bg-zinc-200 mx-1 hidden sm:block"></div>

            <Link href={`/admin/relatorios?type=vendas&period=${periodFilter}&filterType=varejo`} className={`px-5 py-4 rounded-xl border flex flex-col min-w-[120px] transition-all ${typeFilter === 'varejo' ? 'bg-zinc-900 text-white border-zinc-900 shadow-md' : 'bg-white text-zinc-600 border-zinc-200 hover:border-black'}`}>
              <span className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${typeFilter === 'varejo' ? 'text-zinc-400' : 'text-zinc-400'}`}>Varejo</span>
              <span className="text-xl font-black leading-none">{countVarejo} <span className="text-[10px] font-bold">pedidos</span></span>
            </Link>

            <Link href={`/admin/relatorios?type=vendas&period=${periodFilter}&filterType=atacado`} className={`px-5 py-4 rounded-xl border flex flex-col min-w-[120px] transition-all ${typeFilter === 'atacado' ? 'bg-zinc-900 text-white border-zinc-900 shadow-md' : 'bg-white text-zinc-600 border-zinc-200 hover:border-black'}`}>
              <span className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${typeFilter === 'atacado' ? 'text-zinc-400' : 'text-zinc-400'}`}>Atacado</span>
              <span className="text-xl font-black leading-none">{countAtacado} <span className="text-[10px] font-bold">pedidos</span></span>
            </Link>
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
      </div>
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
