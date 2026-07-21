import prisma from "@/lib/prisma"
import { updateOrderStatus } from "../../../actions"

export default async function SalesPage() {
  const orders = await prisma.order.findMany({
    include: {
      customer: true,
      items: {
        include: { product: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold tracking-wide">Gestão de Vendas</h2>
          <p className="text-sm text-zinc-500 mt-1">Acompanhe todos os pedidos e atualize o status de entrega.</p>
        </div>
      </div>
      
      <div className="bg-white rounded-lg border border-zinc-200 overflow-hidden">
        {orders.length === 0 ? (
          <div className="p-12 text-center text-zinc-500">
            Nenhuma venda registrada ainda.
          </div>
        ) : (
          <div className="flex flex-col gap-6 p-6">
            {orders.map(order => (
              <div key={order.id} className="border border-zinc-200 rounded-lg p-6 flex flex-col md:flex-row gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <h3 className="font-bold text-lg">Pedido #{order.id.slice(-6).toUpperCase()}</h3>
                    <span className="text-[10px] uppercase tracking-wider font-bold bg-zinc-100 px-2 py-1 rounded">
                      {order.status === 'PENDING' ? 'Pendente' : 
                       order.status === 'PAID' ? 'Pago' : 
                       order.status === 'SHIPPED' ? 'Enviado' : 
                       order.status === 'DELIVERED' ? 'Entregue' : 'Cancelado'}
                    </span>
                    <span className="text-xs text-zinc-400">
                      {new Date(order.createdAt).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm mb-6">
                    <div>
                      <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-1">Cliente</p>
                      <p className="font-medium">{order.customer?.name || 'Não identificado'}</p>
                      <p className="text-zinc-600">{order.customer?.email}</p>
                      <p className="text-zinc-600">{order.customer?.phone}</p>
                      <p className="text-zinc-600">CPF: {order.customer?.cpf}</p>
                    </div>
                    <div>
                      <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-1">Valor Total</p>
                      <p className="font-bold text-lg">R$ {order.total.toFixed(2).replace('.', ',')}</p>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-2">Itens do Pedido</p>
                    <ul className="space-y-2">
                      {order.items.map(item => (
                        <li key={item.id} className="text-sm flex justify-between bg-zinc-50 p-2 rounded">
                          <span>{item.quantity}x {item.product?.name || 'Produto Excluído'} (Tam: {item.size})</span>
                          <span className="font-medium">R$ {item.price.toFixed(2).replace('.', ',')}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                
                <div className="w-full md:w-64 border-t md:border-t-0 md:border-l border-zinc-200 pt-6 md:pt-0 md:pl-6">
                  <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-4">Atualizar Status</p>
                  <form action={updateOrderStatus.bind(null, order.id)} className="flex flex-col gap-3">
                    <select 
                      name="status" 
                      defaultValue={order.status}
                      className="p-3 border border-zinc-300 rounded focus:border-black outline-none transition-colors text-sm"
                    >
                      <option value="PENDING">Pendente</option>
                      <option value="PAID">Pagamento Aprovado</option>
                      <option value="SHIPPED">Enviado / Em Trânsito</option>
                      <option value="DELIVERED">Entregue</option>
                      <option value="CANCELLED">Cancelado</option>
                    </select>
                    <button type="submit" className="w-full bg-zinc-900 text-white font-bold tracking-widest uppercase text-[10px] py-3 rounded hover:bg-zinc-800 transition-colors">
                      Salvar Status
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
