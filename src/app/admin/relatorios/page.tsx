import prisma from "@/lib/prisma";
import PrintButton from "@/components/admin/PrintButton";

export default async function RelatoriosPage() {
  // Fetch Orders
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      customer: true,
      items: true
    }
  });

  // Fetch Products & Stock
  const products = await prisma.product.findMany({
    include: {
      sizes: true
    },
    orderBy: { createdAt: 'desc' }
  });

  // Calculate some basic stats
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((acc, order) => {
    // Only count revenue for orders that are not purely pending without payment
    if (order.status !== 'CANCELLED') {
      return acc + order.total;
    }
    return acc;
  }, 0);

  return (
    <div className="bg-white min-h-screen text-black font-sans p-8 md:p-12 print:p-0 print:m-0">
      
      <div className="max-w-4xl mx-auto print:max-w-none">
        
        {/* Header */}
        <div className="flex justify-between items-end mb-8 border-b border-zinc-200 pb-6">
          <div>
            <h1 className="text-3xl font-serif tracking-[0.2em] font-bold mb-2">USE MARIA</h1>
            <p className="text-xs text-zinc-500 uppercase tracking-widest">Relatório Gerencial</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-zinc-600 mt-1">
              Gerado em: {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}
            </p>
          </div>
        </div>

        {/* Resumo Financeiro */}
        <div className="mb-12">
          <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-400 mb-4 border-b border-zinc-200 pb-2">Resumo Financeiro (Todas as Vendas)</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="border border-zinc-200 p-4 rounded-lg">
              <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Total de Pedidos</p>
              <p className="text-2xl font-bold">{totalOrders}</p>
            </div>
            <div className="border border-zinc-200 p-4 rounded-lg">
              <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Receita Bruta (Pedidos Ativos)</p>
              <p className="text-2xl font-bold text-emerald-600">R$ {totalRevenue.toFixed(2).replace('.', ',')}</p>
            </div>
          </div>
        </div>

        {/* Relatório de Estoque */}
        <div className="mb-12">
          <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-400 mb-4 border-b border-zinc-200 pb-2">Inventário de Estoque Atual</h2>
          <table className="w-full text-sm border-collapse border border-zinc-200">
            <thead className="bg-zinc-50">
              <tr className="text-left text-zinc-600 border-b border-zinc-200">
                <th className="py-3 px-4 font-bold border-r border-zinc-200">Produto</th>
                <th className="py-3 px-4 font-bold text-center border-r border-zinc-200">Cor/Variação</th>
                <th className="py-3 px-4 font-bold text-center border-r border-zinc-200">Tamanho</th>
                <th className="py-3 px-4 font-bold text-center">Qtd em Estoque</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                product.sizes.map((size) => (
                  <tr key={size.id} className="border-b border-zinc-200">
                    <td className="py-2 px-4 border-r border-zinc-200">{product.name}</td>
                    <td className="py-2 px-4 text-center border-r border-zinc-200">{size.color}</td>
                    <td className="py-2 px-4 text-center border-r border-zinc-200">{size.size}</td>
                    <td className={`py-2 px-4 text-center font-bold ${size.stock <= 0 ? 'text-red-500' : 'text-zinc-800'}`}>
                      {size.stock}
                    </td>
                  </tr>
                ))
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-4 text-center text-zinc-500">Nenhum produto cadastrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Histórico de Pedidos */}
        <div className="mb-12">
          <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-400 mb-4 border-b border-zinc-200 pb-2">Últimos Pedidos (Visão Geral)</h2>
          <table className="w-full text-sm border-collapse border border-zinc-200">
            <thead className="bg-zinc-50">
              <tr className="text-left text-zinc-600 border-b border-zinc-200">
                <th className="py-3 px-4 font-bold border-r border-zinc-200">Pedido</th>
                <th className="py-3 px-4 font-bold border-r border-zinc-200">Data</th>
                <th className="py-3 px-4 font-bold border-r border-zinc-200">Cliente</th>
                <th className="py-3 px-4 font-bold border-r border-zinc-200 text-center">Itens</th>
                <th className="py-3 px-4 font-bold border-r border-zinc-200 text-right">Valor</th>
                <th className="py-3 px-4 font-bold text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.slice(0, 100).map((order) => (
                <tr key={order.id} className="border-b border-zinc-200">
                  <td className="py-2 px-4 border-r border-zinc-200">#{order.id.slice(-6).toUpperCase()}</td>
                  <td className="py-2 px-4 border-r border-zinc-200">{new Date(order.createdAt).toLocaleDateString('pt-BR')}</td>
                  <td className="py-2 px-4 border-r border-zinc-200">{order.customer?.name}</td>
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
              {orders.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-4 text-center text-zinc-500">Nenhum pedido registrado.</td>
                </tr>
              )}
            </tbody>
          </table>
          <p className="text-xs text-zinc-400 mt-2 italic">* Limitado aos 100 pedidos mais recentes.</p>
        </div>

      </div>

      <PrintButton />

    </div>
  );
}
