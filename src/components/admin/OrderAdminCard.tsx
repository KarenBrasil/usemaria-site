"use client";

import { useState } from "react";
import { updateOrderStatus, confirmPixOrder, generateShippingLabel } from "@/app/admin/actions";

export default function OrderAdminCard({ order }: { order: any }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const getStatusInfo = (status: string) => {
    switch(status) {
      case 'PENDING': return { text: 'Aguardando Pagamento', classes: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500 animate-pulse' };
      case 'PAID': return { text: 'Pagamento Aprovado', classes: 'bg-emerald-50 text-emerald-700 border-emerald-300', dot: 'bg-emerald-500' };
      case 'SHIPPED': return { text: 'Enviado', classes: 'bg-blue-50 text-blue-700 border-blue-300', dot: '' };
      case 'DELIVERED': return { text: 'Entregue', classes: 'bg-zinc-100 text-zinc-800 border-zinc-300', dot: '' };
      default: return { text: 'Cancelado', classes: 'bg-rose-50 text-rose-700 border-rose-200', dot: '' };
    }
  };
  const statusInfo = getStatusInfo(order.status);

  // Formata número do zap
  const getWhatsAppLink = () => {
    if (!order.customer?.phone) return '#';
    const number = order.customer.phone.replace(/\D/g, '');
    const message = encodeURIComponent(`Olá ${order.customer.name.split(' ')[0]}! Aqui é da Use Maria, referente ao seu pedido #${order.id.slice(-6).toUpperCase()}.`);
    return `https://wa.me/${number}?text=${message}`;
  };

  const handleStatusChange = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsActionLoading(true);
    const formData = new FormData(e.currentTarget);
    await updateOrderStatus(order.id, formData);
    setIsActionLoading(false);
    setIsModalOpen(false);
  };

  const handlePixConfirm = async () => {
    setIsActionLoading(true);
    await confirmPixOrder(order.id);
    setIsActionLoading(false);
    setIsModalOpen(false);
  };

  const handleShippingLabel = async () => {
    setActionError(null);
    try {
      await confirmPixOrder(order.id);
      await generateShippingLabel(order.id);
      setIsModalOpen(false);
    } catch (err: any) {
      setActionError(err.message || "Erro ao processar pedido");
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <>
      {/* CARD PRINCIPAL (iFood / Uber Style) */}
      <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 hover:border-zinc-300 hover:shadow-md transition-all overflow-hidden flex flex-col md:flex-row">
        
        {/* Left Area (Header & Items) */}
        <div className="p-6 md:p-8 flex-1 border-b md:border-b-0 md:border-r border-zinc-100">
          
          {/* Top Header */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6 pb-6 border-b border-zinc-100">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h3 className="font-bold text-2xl tracking-tight text-zinc-900">
                  #{order.id.slice(-6).toUpperCase()}
                </h3>
                <span className="text-xs font-semibold text-zinc-400">
                  {new Date(order.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute:'2-digit' })}
                </span>
              </div>
              <p className="text-sm font-medium text-zinc-600">
                Cliente: <span className="text-zinc-900 font-bold">{order.customer?.name}</span>
              </p>
            </div>
            
            <div className={`px-4 py-2 rounded-lg border shadow-sm font-bold text-[11px] uppercase tracking-widest flex items-center gap-2 self-start ${statusInfo.classes}`}>
              {statusInfo.dot && <span className={`w-2 h-2 rounded-full ${statusInfo.dot}`}></span>}
              {statusInfo.text}
            </div>
          </div>

          {/* Delivery & Contact Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            
            {/* Endereço Delivery Style */}
            <div className="flex items-start gap-4">
              <div className="bg-zinc-100 text-zinc-500 p-2.5 rounded-full shrink-0">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Endereço de Entrega</p>
                {order.street ? (
                  <div className="text-sm font-medium text-zinc-800 leading-snug">
                    <p>{order.street}, {order.number} {order.complement}</p>
                    <p className="text-zinc-500">{order.neighborhood} - {order.city}/{order.state}</p>
                  </div>
                ) : (
                  <p className="text-sm italic text-rose-500">Endereço não disponível</p>
                )}
              </div>
            </div>

            {/* Contato Style */}
            <div className="flex items-start gap-4">
              <div className="bg-zinc-100 text-zinc-500 p-2.5 rounded-full shrink-0">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Contato</p>
                <div className="text-sm font-medium text-zinc-800 leading-snug mb-2">
                  <p>{order.customer?.email}</p>
                  <p className="text-zinc-500">{order.customer?.phone}</p>
                </div>
                {order.customer?.phone && (
                  <a href={getWhatsAppLink()} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors bg-emerald-50 px-2.5 py-1 rounded-md">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
                    WhatsApp
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Itens */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-3 border-b border-zinc-100 pb-2">Resumo da Compra</p>
            <div className="space-y-3">
              {order.items.map((item: any, idx: number) => (
                <div key={item.id} className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-3">
                    <span className="bg-zinc-100 text-zinc-600 font-bold px-2 py-0.5 rounded-sm text-xs">{item.quantity}x</span>
                    <span className="font-bold text-zinc-900">{item.product?.name || 'Produto Excluído'}</span>
                    <span className="text-zinc-500 font-medium text-[11px] uppercase tracking-wider bg-zinc-50 px-2 py-0.5 rounded border border-zinc-100">Tam: {item.size}</span>
                  </div>
                  <span className="font-semibold text-zinc-900">R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Area (Total & Action Button) */}
        <div className="w-full md:w-64 bg-zinc-50/50 p-6 md:p-8 flex flex-col justify-center border-t md:border-t-0 border-zinc-100">
          <div className="mb-6">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 text-center mb-1">Total Pago</p>
            <h2 className="text-3xl font-black tracking-tighter text-zinc-900 text-center">
              <span className="text-sm font-bold mr-1">R$</span>
              {order.total.toFixed(2).replace('.', ',')}
            </h2>
          </div>

          <button 
            onClick={() => { setIsModalOpen(true); setActionError(null); }}
            className="w-full bg-black text-white px-5 py-3.5 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-zinc-800 transition-transform active:scale-95 shadow-sm"
          >
            Gerenciar Pedido
          </button>
          
          <a 
            href={`/admin/vendas/${order.id}/recibo`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="w-full text-center mt-4 text-xs font-bold text-zinc-500 hover:text-black uppercase tracking-widest transition-colors flex items-center justify-center gap-1.5"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Baixar Recibo (PDF)
          </a>
        </div>
      </div>

      {/* MODAL DE AÇÕES ("O Pop") */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay */}
          <div 
            className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm transition-opacity"
            onClick={() => !isActionLoading && setIsModalOpen(false)}
          ></div>
          
          {/* Modal Content */}
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-zinc-100 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold tracking-tight">Opções do Pedido</h3>
                <p className="text-xs font-medium text-zinc-500 mt-0.5">#{order.id}</p>
              </div>
              <button disabled={isActionLoading} onClick={() => setIsModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-100 text-zinc-500 hover:bg-zinc-200 hover:text-black transition-colors disabled:opacity-50">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>

            <div className="p-6 space-y-6">
              
              {actionError && (
                <div className="p-4 bg-red-50 text-red-700 text-sm font-semibold border border-red-200 rounded-lg flex gap-3 items-start">
                  <svg className="w-5 h-5 shrink-0 mt-0.5 text-red-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                  {actionError}
                </div>
              )}

              {/* Alterar Status */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2">Alterar Status</p>
                <form onSubmit={handleStatusChange} className="flex gap-2">
                  <select 
                    name="status" 
                    defaultValue={order.status}
                    className="flex-1 p-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:border-black focus:ring-1 focus:ring-black outline-none text-sm font-semibold disabled:opacity-50"
                    disabled={isActionLoading}
                  >
                    <option value="PENDING">Pendente (Aguardando)</option>
                    <option value="PAID">Pagamento Aprovado</option>
                    <option value="SHIPPED">Enviado (Em Trânsito)</option>
                    <option value="DELIVERED">Entregue</option>
                    <option value="CANCELLED">Cancelado</option>
                  </select>
                  <button 
                    type="submit" 
                    disabled={isActionLoading}
                    className="bg-zinc-900 disabled:bg-zinc-400 text-white px-5 py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-zinc-800 transition-colors"
                  >
                    Salvar
                  </button>
                </form>
              </div>

              <hr className="border-zinc-100" />

              {/* Ações Rápidas */}
              <div className="space-y-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2">Ações Rápidas</p>
                
                {order.status === 'PENDING' && (
                  <button 
                    onClick={handlePixConfirm}
                    disabled={isActionLoading}
                    className="w-full bg-emerald-50 disabled:bg-zinc-100 disabled:text-zinc-500 disabled:border-zinc-200 text-emerald-700 border border-emerald-200 font-bold tracking-wide text-sm py-3.5 rounded-xl hover:bg-emerald-100 hover:border-emerald-300 transition-all flex items-center justify-center gap-2"
                  >
                    {isActionLoading ? (
                      <>
                        <svg className="animate-spin h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        Aprovando e criando etiqueta...
                      </>
                    ) : (
                      <>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                        Aprovar PIX (Gerar Etiqueta)
                      </>
                    )}
                  </button>
                )}

                {(order.status === 'PAID' || order.status === 'SHIPPED') && (
                  <>
                    <a 
                      href="https://app.melhorenvio.com.br/carrinho" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="w-full bg-white text-zinc-700 border border-zinc-300 font-bold text-sm py-3.5 rounded-xl hover:bg-zinc-50 transition-all flex items-center justify-center gap-2"
                    >
                      Ver Etiquetas no Melhor Envio
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                    </a>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
