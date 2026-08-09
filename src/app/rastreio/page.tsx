import prisma from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function TrackOrderPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>
}) {
  const resolvedParams = await searchParams;
  const orderId = resolvedParams?.id;

  let order = null;
  let error = null;

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

  // Server action para busca
  async function searchOrder(formData: FormData) {
    "use server";
    const id = formData.get('orderId') as string;
    if (id) {
      redirect(`/rastreio?id=${id.trim()}`);
    }
  }

  return (
    <div className="min-h-screen bg-[#F9F8F6] font-sans pb-20 text-zinc-800">
      <header className="bg-white border-b border-zinc-200 py-6 text-center">
        <Link href="/" className="text-2xl font-serif tracking-[0.2em] font-bold inline-block">USE MARIA</Link>
      </header>

      <div className="max-w-3xl mx-auto px-4 md:px-8 mt-12">
        <h1 className="text-2xl font-serif mb-2">Acompanhar Pedido</h1>
        <p className="text-zinc-500 mb-8">Consulte o status atualizado da sua compra.</p>

        {!order ? (
          <div className="bg-white p-8 rounded-lg border border-zinc-200 shadow-sm max-w-md">
            <form action={searchOrder} className="flex flex-col gap-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2 block">Código do Pedido</label>
                <input 
                  type="text" 
                  name="orderId" 
                  required
                  placeholder="Ex: cm0b8xyz..." 
                  className="w-full border border-zinc-300 p-3.5 text-sm rounded-sm bg-white focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
                />
              </div>
              {error && <p className="text-red-500 text-xs">{error}</p>}
              <button type="submit" className="bg-black text-white px-8 py-3.5 uppercase text-xs tracking-widest font-bold hover:bg-zinc-800 transition-colors rounded-sm mt-2">
                Buscar Pedido
              </button>
            </form>
          </div>
        ) : (
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
        )}
      </div>
    </div>
  );
}
