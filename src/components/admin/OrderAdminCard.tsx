"use client";

import { useState } from "react";
import { updateOrderStatus, confirmPixOrder, generateShippingLabel } from "@/app/admin/actions";

export default function OrderAdminCard({ order }: { order: any }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const getStatusInfo = (status: string) => {
    switch(status) {
      case 'PENDING': return { text: 'Aguardando', classes: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500 animate-pulse' };
      case 'PAID': return { text: 'Aprovado', classes: 'bg-emerald-50 text-emerald-700 border-emerald-300', dot: 'bg-emerald-500' };
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
    setActionError(null);
    try {
      const result = await confirmPixOrder(order.id);
      if (result?.error) setActionError(result.error);
      else setIsModalOpen(false);
    } catch (err: any) {
      setActionError(err.message || "Erro interno.");
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <>
      {/* LINHA COMPACTA (Clicável) */}
      <button 
        onClick={() => { setIsModalOpen(true); setActionError(null); }}
        className="w-full text-left bg-white rounded-xl shadow-sm border border-zinc-200 hover:border-zinc-300 hover:shadow-md transition-all p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
      >
        <div className="flex items-center gap-4 min-w-0">
          <div className="bg-zinc-50 rounded-lg p-3 shrink-0 border border-zinc-100 group-hover:bg-zinc-100 transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-500"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h3 className="font-bold text-sm tracking-tight text-zinc-900 truncate">
                {order.customer?.name}
              </h3>
              <span className="text-[10px] font-semibold text-zinc-400 shrink-0">#{order.id.slice(-6).toUpperCase()}</span>
            </div>
            <p className="text-[11px] font-medium text-zinc-500 truncate">
              {new Date(order.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute:'2-digit' })} • {order.items.length} ite{order.items.length > 1 ? 'ns' : 'm'}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-6 shrink-0 w-full sm:w-auto mt-2 sm:mt-0 border-t sm:border-0 border-zinc-100 pt-3 sm:pt-0">
          <div className="text-left sm:text-right">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-0.5">Total</p>
            <p className="font-bold text-zinc-900 text-sm">R$ {order.total.toFixed(2).replace('.', ',')}</p>
          </div>
          <div className={`px-3 py-1.5 rounded-lg border shadow-sm font-bold text-[10px] uppercase tracking-widest flex items-center gap-2 ${statusInfo.classes}`}>
            {statusInfo.dot && <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot}`}></span>}
            {statusInfo.text}
          </div>
        </div>
      </button>

      {/* MODAL COMPLETO ("O Pop-up") */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm transition-opacity"
            onClick={() => !isActionLoading && setIsModalOpen(false)}
          ></div>
          
          <div className="relative bg-[#f7f7f7] rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col md:flex-row max-h-[90vh]">
            
            {/* Lado Esquerdo: Detalhes do Pedido */}
            <div className="flex-1 p-6 md:p-8 overflow-y-auto border-r border-zinc-200 bg-white">
              
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-zinc-900">Pedido #{order.id.slice(-6).toUpperCase()}</h2>
                  <p className="text-sm font-medium text-zinc-500 mt-1">
                    {new Date(order.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', hour: '2-digit', minute:'2-digit' })}
                  </p>
                </div>
                <div className={`px-3 py-1 rounded-full border font-bold text-[10px] uppercase tracking-widest flex items-center gap-1.5 ${statusInfo.classes}`}>
                  {statusInfo.text}
                </div>
              </div>

              {order.paymentError && (
                <div className="mb-6 p-4 bg-rose-50 text-rose-700 text-sm border border-rose-200 rounded-xl">
                  <strong>Erro no Pagamento:</strong> {order.paymentError}
                </div>
              )}

              {/* Endereço e Contato (Em blocos elegantes) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                <div className="bg-zinc-50 rounded-xl p-4 border border-zinc-100 relative group">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                      Endereço
                    </p>
                    {order.street && (
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(`${order.street}, ${order.number} ${order.complement}\n${order.neighborhood}\n${order.city}/${order.state} - ${order.zipcode}`);
                          alert("Endereço copiado!");
                        }}
                        className="text-[9px] uppercase tracking-widest font-bold bg-white border border-zinc-200 px-2 py-1 rounded text-zinc-600 hover:text-black hover:bg-zinc-100 transition-colors"
                      >
                        Copiar
                      </button>
                    )}
                  </div>
                  {order.street ? (
                    <div className="text-xs font-semibold text-zinc-700 leading-relaxed">
                      <p className="text-zinc-900">{order.street}, {order.number} {order.complement}</p>
                      <p>{order.neighborhood}</p>
                      <p>{order.city}/{order.state} - {order.zipcode}</p>
                    </div>
                  ) : (
                    <p className="text-xs italic text-rose-500 font-medium">Não informado</p>
                  )}
                </div>

                <div className="bg-zinc-50 rounded-xl p-4 border border-zinc-100 relative group">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                      Cliente
                    </p>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(`${order.customer?.name}\n${order.customer?.email}\n${order.customer?.phone}`);
                        alert("Contato copiado!");
                      }}
                      className="text-[9px] uppercase tracking-widest font-bold bg-white border border-zinc-200 px-2 py-1 rounded text-zinc-600 hover:text-black hover:bg-zinc-100 transition-colors"
                    >
                      Copiar
                    </button>
                  </div>
                  <div className="text-xs font-semibold text-zinc-700 leading-relaxed">
                    <p className="text-zinc-900">{order.customer?.name}</p>
                    <p>{order.customer?.email}</p>
                    <p>{order.customer?.phone}</p>
                  </div>
                  {order.customer?.phone && (
                    <a href={getWhatsAppLink()} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-700 hover:bg-emerald-100 transition-colors bg-emerald-50 border border-emerald-200 px-2 py-1 rounded">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
                      WhatsApp
                    </a>
                  )}
                </div>
              </div>

              {/* Itens */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-3 flex items-center gap-1.5">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                  Itens Comprados
                </p>
                <div className="bg-white rounded-xl border border-zinc-100 divide-y divide-zinc-100 overflow-hidden">
                  {order.items.map((item: any) => (
                    <div key={item.id} className="flex justify-between items-center p-4 hover:bg-zinc-50 transition-colors group cursor-pointer" onClick={() => item.product?.image && window.open(item.product.image, '_blank')}>
                      <div className="flex items-center gap-3">
                        {item.product?.image && (
                          <div className="relative w-10 h-10 rounded border border-zinc-200 overflow-hidden shrink-0">
                            <img src={item.product.image} alt={item.product.name} className="object-cover w-full h-full group-hover:scale-110 transition-transform" />
                          </div>
                        )}
                        <span className="bg-zinc-100 text-zinc-600 font-bold w-6 h-6 flex items-center justify-center rounded text-xs shrink-0">{item.quantity}</span>
                        <div>
                          <p className="font-bold text-sm text-zinc-900 leading-tight line-clamp-1">{item.product?.name || 'Produto Excluído'}</p>
                          <span className="text-zinc-500 font-medium text-[10px] uppercase tracking-wider bg-zinc-100 px-1.5 py-0.5 rounded mt-1 inline-block">Tam: {item.size}</span>
                        </div>
                      </div>
                      <span className="font-bold text-sm text-zinc-900 shrink-0 ml-4">R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}</span>
                    </div>
                  ))}
                  <div className="px-4 py-3 bg-white flex justify-between items-center text-sm font-medium text-zinc-600 border-t border-zinc-100">
                    <span>Método de Pagamento</span>
                    <span className="font-bold text-zinc-900 bg-zinc-100 px-2 py-0.5 rounded text-xs">{order.paymentMethod || 'PIX'}</span>
                  </div>
                  <div className="px-4 py-3 bg-white flex flex-col sm:flex-row justify-between sm:items-center text-sm font-medium text-zinc-600 border-t border-zinc-100 gap-2">
                    <span className="leading-tight">Frete ({order.shippingMethod?.includes('Motoboy/Uber') ? 'Retirada/Uber entrega (falar no WhatsApp)' : (order.shippingMethod || 'Grátis / Não info')})</span>
                    <span className="font-bold sm:font-normal">R$ {order.shippingCost ? order.shippingCost.toFixed(2).replace('.', ',') : '0,00'}</span>
                  </div>
                  <div className="p-4 bg-zinc-50/50 flex justify-between items-center border-t border-zinc-100">
                    <span className="font-bold text-xs text-zinc-500 uppercase tracking-widest">Total Geral</span>
                    <span className="font-black text-lg text-zinc-900">R$ {order.total.toFixed(2).replace('.', ',')}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Lado Direito: Ações */}
            <div className="w-full md:w-80 bg-zinc-50 p-6 md:p-8 flex flex-col shrink-0">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold tracking-tight">Ações</h3>
                <button disabled={isActionLoading} onClick={() => setIsModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-200 text-zinc-600 hover:bg-black hover:text-white transition-colors disabled:opacity-50">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                </button>
              </div>

              {actionError && (
                <div className="mb-6 p-4 bg-red-50 text-red-700 text-xs font-semibold border border-red-200 rounded-lg flex gap-2 items-start">
                  <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                  {actionError}
                </div>
              )}

              <div className="space-y-6">
                
                {/* Alterar Status e Pagamento */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2">Atualizar Pedido</p>
                  <form onSubmit={handleStatusChange} className="flex flex-col gap-2">
                    <div className="flex gap-2">
                      <select 
                        name="status" 
                        defaultValue={order.status}
                        className="flex-1 px-3 py-2.5 bg-white border border-zinc-200 rounded-lg focus:border-black outline-none text-xs font-bold text-zinc-700 disabled:opacity-50"
                        disabled={isActionLoading}
                      >
                        <option value="PENDING">Pendente</option>
                        <option value="PAID">Pago</option>
                        <option value="SHIPPED">Enviado</option>
                        <option value="DELIVERED">Entregue</option>
                        <option value="CANCELLED">Cancelado</option>
                      </select>
                      <select 
                        name="paymentMethod" 
                        defaultValue={order.paymentMethod || "PIX"}
                        className="flex-1 px-3 py-2.5 bg-white border border-zinc-200 rounded-lg focus:border-black outline-none text-xs font-bold text-zinc-700 disabled:opacity-50"
                        disabled={isActionLoading}
                      >
                        <option value="PIX">PIX</option>
                        <option value="Cartão">Cartão</option>
                      </select>
                    </div>
                    <button 
                      type="submit" 
                      disabled={isActionLoading}
                      className="bg-zinc-900 disabled:bg-zinc-400 text-white px-4 py-2.5 rounded-lg font-bold text-[10px] uppercase tracking-widest hover:bg-zinc-800 transition-colors w-full"
                    >
                      Salvar Alterações
                    </button>
                  </form>
                </div>

                <hr className="border-zinc-200" />

                {/* Logística & Pagamento */}
                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-3">Principal</p>
                  
                  {order.status === 'PENDING' && (!order.paymentMethod || order.paymentMethod === 'PIX') && (
                    <button 
                      onClick={handlePixConfirm}
                      disabled={isActionLoading}
                      className="w-full bg-emerald-600 disabled:bg-zinc-200 disabled:text-zinc-500 text-white font-bold tracking-wide text-xs py-3.5 rounded-xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 shadow-sm"
                    >
                      {isActionLoading ? (
                        <>
                          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                          Processando...
                        </>
                      ) : (
                        <>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                          Aprovar PIX (Gera Etiqueta)
                        </>
                      )}
                    </button>
                  )}

                  {(order.status === 'PAID' || order.status === 'SHIPPED') && (
                    <a 
                      href="https://app.melhorenvio.com.br/carrinho" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="w-full bg-white text-zinc-700 border border-zinc-300 font-bold text-xs py-3.5 rounded-xl hover:bg-zinc-50 transition-all flex items-center justify-center gap-2 shadow-sm"
                    >
                      Carrinho Melhor Envio
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                    </a>
                  )}

                  <a 
                    href={`/admin/vendas/${order.id}/recibo`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-full bg-zinc-200 text-zinc-700 font-bold text-xs py-3.5 rounded-xl hover:bg-zinc-300 transition-all flex items-center justify-center gap-2"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    Baixar Recibo PDF
                  </a>
                </div>

              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
