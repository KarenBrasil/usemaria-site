import prisma from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function TrackOrderPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string, email?: string }>
}) {
  const resolvedParams = await searchParams;
  const orderId = resolvedParams?.id;
  const email = resolvedParams?.email;

  let order = null;
  let historyOrders = null;
  let customerInfo = null;
  let error = null;

  // ESTADO 1: Buscar um pedido específico pelo ID
  if (orderId) {
    try {
      order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { 
          customer: true,
          items: { include: { product: true } }
        }
      });
      if (!order) {
        error = "Pedido não encontrado. Verifique o código e tente novamente.";
      }
    } catch (e) {
      error = "Ocorreu um erro ao buscar o pedido.";
    }
  } 
  // ESTADO 2: Buscar histórico de pedidos pelo E-mail
  else if (email) {
    try {
      const customer = await prisma.customer.findFirst({
        where: { email: email.toLowerCase().trim() },
        include: { 
          orders: {
            orderBy: { createdAt: 'desc' },
            include: { items: { include: { product: true } } }
          }
        }
      });
      if (!customer || customer.orders.length === 0) {
        error = "Nenhum histórico encontrado para este e-mail.";
      } else {
        customerInfo = customer;
        historyOrders = customer.orders;
      }
    } catch (e) {
      error = "Ocorreu um erro ao buscar o histórico.";
    }
  }

  // Server action para submissão do formulário de Login
  async function searchHistory(formData: FormData) {
    "use server";
    const inputEmail = formData.get('email') as string;
    if (inputEmail) {
      redirect(`/rastreio?email=${encodeURIComponent(inputEmail.trim())}`);
    }
  }

  return (
    <div className="min-h-screen bg-[#F9F8F6] font-sans pb-20 text-zinc-800">
      <header className="bg-white border-b border-zinc-200 py-6 text-center px-4">
        <div className="max-w-5xl mx-auto relative flex justify-center items-center">
          {(orderId || email) && (
            <Link href="/rastreio" className="absolute left-0 text-xs uppercase tracking-widest font-bold text-zinc-500 hover:text-black transition-colors flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
              Voltar
            </Link>
          )}
          <Link href="/" className="text-2xl font-serif tracking-[0.2em] font-bold">USE MARIA</Link>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 md:px-8 mt-12">
        
        {/* ESTADO 1: FORMULÁRIO DE ACESSO (Login) */}
        {!orderId && !historyOrders && (
          <div className="max-w-md mx-auto">
            <h1 className="text-2xl font-serif mb-2 text-center">Meus Pedidos</h1>
            <p className="text-zinc-500 mb-8 text-center text-sm">Acesse o seu histórico de compras e acompanhe o status de entrega.</p>
            
            <div className="bg-white p-8 rounded-lg border border-zinc-200 shadow-sm">
              <form action={searchHistory} className="flex flex-col gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2 block">E-mail da Compra</label>
                  <input 
                    type="email" 
                    name="email" 
                    required
                    placeholder="Seu e-mail cadastrado..." 
                    className="w-full border border-zinc-300 p-3.5 text-sm rounded-sm bg-white focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
                  />
                </div>
                {error && <p className="text-red-500 text-xs font-semibold">{error}</p>}
                <button type="submit" className="bg-black text-white px-8 py-3.5 uppercase text-xs tracking-widest font-bold hover:bg-zinc-800 transition-colors rounded-sm mt-2 flex justify-center items-center">
                  Acessar Meus Pedidos
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ESTADO 2: LISTA DE PEDIDOS (Histórico) */}
        {historyOrders && (
          <div>
            <div className="mb-8">
              <h1 className="text-2xl font-serif mb-1">Olá, {customerInfo?.name.split(' ')[0]}!</h1>
              <p className="text-zinc-500 text-sm">Aqui está o seu histórico de pedidos na Use Maria.</p>
            </div>

            <div className="space-y-4">
              {historyOrders.map((histOrder: any) => (
                <Link key={histOrder.id} href={`/rastreio?id=${histOrder.id}`} className="block bg-white p-5 md:p-6 rounded-lg border border-zinc-200 shadow-sm hover:border-zinc-400 hover:shadow-md transition-all group">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-bold">Pedido #{histOrder.id.slice(-6).toUpperCase()}</h3>
                        <span className="text-xs text-zinc-400 font-medium">{new Date(histOrder.createdAt).toLocaleDateString('pt-BR')}</span>
                      </div>
                      <p className="text-sm text-zinc-500">
                        {histOrder.items.length} {histOrder.items.length === 1 ? 'item' : 'itens'} • <span className="font-medium text-zinc-800">R$ {histOrder.total.toFixed(2).replace('.', ',')}</span>
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-4">
                       <span className={`text-[10px] uppercase tracking-widest font-bold px-3 py-1.5 rounded-sm border inline-block ${
                          histOrder.status === 'PENDING' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 
                          histOrder.status === 'PAID' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                          histOrder.status === 'SHIPPED' ? 'bg-blue-50 text-blue-700 border-blue-200' : 
                          histOrder.status === 'DELIVERED' ? 'bg-zinc-100 text-zinc-700 border-zinc-300' : 
                          'bg-red-50 text-red-700 border-red-200'
                        }`}>
                          {histOrder.status === 'PENDING' ? 'Pendente' : 
                           histOrder.status === 'PAID' ? 'Pago' : 
                           histOrder.status === 'SHIPPED' ? 'Enviado' : 
                           histOrder.status === 'DELIVERED' ? 'Entregue' : 'Cancelado'}
                        </span>
                        <div className="text-zinc-300 group-hover:text-black transition-colors group-hover:translate-x-1 duration-300 hidden md:block">
                           <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                        </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ESTADO 3: DETALHES DO PEDIDO INDIVIDUAL */}
        {order && (
          <div>
            <h1 className="text-2xl font-serif mb-2">Acompanhar Pedido</h1>
            <p className="text-zinc-500 mb-8">Consulte o status atualizado da sua compra.</p>

            <div className="bg-white rounded-lg border border-zinc-200 shadow-sm overflow-hidden">
              <div className="p-6 md:p-8 border-b border-zinc-100 bg-zinc-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Pedido</p>
                  <h2 className="text-xl font-bold">#{order.id.slice(-6).toUpperCase()}</h2>
                </div>
                
                <div className="flex flex-col md:items-end">
                   <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Status Atual</p>
                   <span className={`text-xs uppercase tracking-wider font-bold px-3 py-1.5 rounded-sm border inline-block ${
                      order.status === 'PENDING' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 
                      order.status === 'PAID' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                      order.status === 'SHIPPED' ? 'bg-blue-50 text-blue-700 border-blue-200' : 
                      order.status === 'DELIVERED' ? 'bg-zinc-100 text-zinc-700 border-zinc-300' : 
                      'bg-red-50 text-red-700 border-red-200'
                    }`}>
                      {order.status === 'PENDING' ? 'Pendente (Aguardando Pagamento)' : 
                       order.status === 'PAID' ? 'Pagamento Aprovado (Preparando)' : 
                       order.status === 'SHIPPED' ? 'Enviado (Em Trânsito)' : 
                       order.status === 'DELIVERED' ? 'Entregue' : 'Cancelado'}
                    </span>
                </div>
              </div>

              <div className="p-6 md:p-8">
                 
                 {/* Linha do tempo visual */}
                 <div className="mb-10 relative">
                   <div className="absolute top-1/2 left-0 w-full h-1 bg-zinc-100 -z-10 -translate-y-1/2 rounded-full"></div>
                   <div className="flex justify-between relative z-10">
                     {/* PENDENTE */}
                     <div className="flex flex-col items-center gap-2">
                       <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center bg-white ${order.status !== 'CANCELLED' ? 'border-emerald-500 text-emerald-500' : 'border-zinc-300 text-zinc-300'}`}>
                         <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                       </div>
                       <span className="text-[9px] uppercase font-bold tracking-widest text-zinc-500">Pedido</span>
                     </div>
                     
                     {/* PAGO */}
                     <div className="flex flex-col items-center gap-2">
                       <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center bg-white ${['PAID', 'SHIPPED', 'DELIVERED'].includes(order.status) ? 'border-emerald-500 text-emerald-500' : 'border-zinc-300 text-zinc-300'}`}>
                          {['PAID', 'SHIPPED', 'DELIVERED'].includes(order.status) && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                       </div>
                       <span className="text-[9px] uppercase font-bold tracking-widest text-zinc-500">Pago</span>
                     </div>
                     
                     {/* ENVIADO */}
                     <div className="flex flex-col items-center gap-2">
                       <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center bg-white ${['SHIPPED', 'DELIVERED'].includes(order.status) ? 'border-emerald-500 text-emerald-500' : 'border-zinc-300 text-zinc-300'}`}>
                          {['SHIPPED', 'DELIVERED'].includes(order.status) && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                       </div>
                       <span className="text-[9px] uppercase font-bold tracking-widest text-zinc-500">Enviado</span>
                     </div>
                     
                     {/* ENTREGUE */}
                     <div className="flex flex-col items-center gap-2">
                       <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center bg-white ${order.status === 'DELIVERED' ? 'border-emerald-500 text-emerald-500' : 'border-zinc-300 text-zinc-300'}`}>
                          {order.status === 'DELIVERED' && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                       </div>
                       <span className="text-[9px] uppercase font-bold tracking-widest text-zinc-500">Entregue</span>
                     </div>
                   </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                   <div>
                     <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Comprador</p>
                     <p className="font-medium">{order.customer?.name}</p>
                     <p className="text-sm text-zinc-600">{order.customer?.email}</p>
                   </div>
                   <div>
                     <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Data da Compra</p>
                     <p className="text-sm font-medium">{new Date(order.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                   </div>
                 </div>

                 <div>
                   <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-3 border-b border-zinc-100 pb-2">Itens Comprados</p>
                   <div className="space-y-3">
                     {order.items.map((item: any) => (
                       <div key={item.id} className="flex justify-between items-center text-sm">
                         <div className="flex items-center gap-3">
                           <span className="bg-zinc-100 text-zinc-600 text-xs font-bold px-2 py-1 rounded">{item.quantity}x</span>
                           <span className="font-medium text-zinc-800">{item.product?.name || 'Produto indisponível'}</span>
                           <span className="text-zinc-500 text-xs">Tam: {item.size}</span>
                         </div>
                         <span className="font-medium">R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}</span>
                       </div>
                     ))}
                   </div>
                   <div className="mt-6 pt-4 border-t border-zinc-100 flex justify-between items-center">
                     <span className="text-sm font-bold uppercase tracking-widest">Total</span>
                     <span className="text-xl font-bold">R$ {order.total.toFixed(2).replace('.', ',')}</span>
                   </div>
                 </div>

                 {order.status === 'PENDING' && (
                   <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-sm text-sm text-yellow-800">
                     <strong>Atenção:</strong> Seu pedido ainda aguarda o pagamento PIX. Caso já tenha enviado o comprovante, aguarde a nossa verificação.
                   </div>
                 )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
