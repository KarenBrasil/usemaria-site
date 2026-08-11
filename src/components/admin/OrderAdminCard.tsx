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
    setIsActionLoading(true);
    await generateShippingLabel(order.id);
    setIsActionLoading(false);
    setIsModalOpen(false);
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
309:                     WhatsApp
310:                   </a>
311:                 )}
312:               </div>
313:             </div>
314:           </div>
315: 
316:           {/* Itens */}
317:           <div>
318:             <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-3 border-b border-zinc-100 pb-2">Resumo da Compra</p>
319:             <div className="space-y-3">
320:               {order.items.map((item: any, idx: number) => (
321:                 <div key={item.id} className="flex justify-between items-center text-sm">
322:                   <div className="flex items-center gap-3">
323:                     <span className="bg-zinc-100 text-zinc-600 font-bold px-2 py-0.5 rounded-sm text-xs">{item.quantity}x</span>
324:                     <span className="font-bold text-zinc-900">{item.product?.name || 'Produto Excluído'}</span>
325:                     <span className="text-zinc-500 font-medium text-[11px] uppercase tracking-wider bg-zinc-50 px-2 py-0.5 rounded border border-zinc-100">Tam: {item.size}</span>
326:                   </div>
327:                   <span className="font-semibold text-zinc-900">R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}</span>
328:                 </div>
329:               ))}
330:             </div>
331:           </div>
332:         </div>
333: 
334:         {/* Right Area (Total & Action Button) */}
335:         <div className="w-full md:w-64 bg-zinc-50/50 p-6 md:p-8 flex flex-col justify-center border-t md:border-t-0 border-zinc-100">
336:           <div className="mb-6">
337:             <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 text-center mb-1">Total Pago</p>
338:             <h2 className="text-3xl font-black tracking-tighter text-zinc-900 text-center">
339:               <span className="text-sm font-bold mr-1">R$</span>
340:               {order.total.toFixed(2).replace('.', ',')}
341:             </h2>
342:           </div>
343: 
344:           <button 
345:             onClick={() => setIsModalOpen(true)}
346:             className="w-full bg-black text-white px-5 py-3.5 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-zinc-800 transition-transform active:scale-95 shadow-sm"
347:           >
348:             Gerenciar Pedido
349:           </button>
350:           
351:           <a 
352:             href={`/admin/vendas/${order.id}/recibo`} 
353:             target="_blank" 
354:             rel="noopener noreferrer"
355:             className="w-full text-center mt-4 text-xs font-bold text-zinc-500 hover:text-black uppercase tracking-widest transition-colors flex items-center justify-center gap-1.5"
356:           >
357:             <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
358:             Baixar Recibo (PDF)
359:           </a>
360:         </div>
361:       </div>
362: 
363:       {/* MODAL DE AÇÕES ("O Pop") */}
364:       {isModalOpen && (
365:         <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
366:           {/* Overlay */}
367:           <div 
368:             className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm transition-opacity"
369:             onClick={() => setIsModalOpen(false)}
370:           ></div>
371:           
372:           {/* Modal Content */}
373:           <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
374:             <div className="p-6 border-b border-zinc-100 flex justify-between items-center">
375:               <div>
376:                 <h3 className="text-xl font-bold tracking-tight">Opções do Pedido</h3>
377:                 <p className="text-xs font-medium text-zinc-500 mt-0.5">#{order.id}</p>
378:               </div>
379:               <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-100 text-zinc-500 hover:bg-zinc-200 hover:text-black transition-colors">
380:                 <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
381:               </button>
382:             </div>
383: 
384:             <div className="p-6 space-y-6">
385:               
386:               {/* Alterar Status */}
387:               <div>
388:                 <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2">Alterar Status</p>
389:                 <form onSubmit={handleStatusChange} className="flex gap-2">
390:                   <select 
391:                     name="status" 
392:                     defaultValue={order.status}
393:                     className="flex-1 p-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:border-black focus:ring-1 focus:ring-black outline-none text-sm font-semibold"
394:                   >
395:                     <option value="PENDING">Pendente (Aguardando)</option>
396:                     <option value="PAID">Pagamento Aprovado</option>
397:                     <option value="SHIPPED">Enviado (Em Trânsito)</option>
398:                     <option value="DELIVERED">Entregue</option>
399:                     <option value="CANCELLED">Cancelado</option>
400:                   </select>
401:                   <button 
402:                     type="submit" 
403:                     disabled={isActionLoading}
404:                     className="bg-zinc-900 disabled:bg-zinc-400 text-white px-5 py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-zinc-800 transition-colors"
405:                   >
406:                     Salvar
407:                   </button>
408:                 </form>
409:               </div>
410: 
411:               <hr className="border-zinc-100" />
412: 
413:               {/* Ações Rápidas */}
414:               <div className="space-y-3">
415:                 <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2">Ações Rápidas</p>
416:                 
417:                 {order.status === 'PENDING' && (
418:                   <button 
419:                     onClick={handlePixConfirm}
420:                     disabled={isActionLoading}
421:                     className="w-full bg-emerald-50 disabled:opacity-50 text-emerald-700 border border-emerald-200 font-bold tracking-wide text-sm py-3.5 rounded-xl hover:bg-emerald-100 hover:border-emerald-300 transition-all flex items-center justify-center gap-2"
422:                   >
423:                     <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
424:                     Aprovar Pagamento PIX
425:                   </button>
426:                 )}
427: 
428:                 {(order.status === 'PAID' || order.status === 'SHIPPED') && (
429:                   <>
430:                     <button 
431:                       onClick={handleShippingLabel}
432:                       disabled={isActionLoading}
433:                       className="w-full bg-[#ffcc00] disabled:opacity-50 text-black font-bold tracking-wide text-sm py-3.5 rounded-xl hover:bg-[#ffdb4d] transition-all flex items-center justify-center gap-2 shadow-sm"
434:                     >
435:                       <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
436:                       Gerar Etiqueta (Melhor Envio)
437:                     </button>
438:                     
439:                     <a 
440:                       href="https://app.melhorenvio.com.br/carrinho" 
441:                       target="_blank" 
442:                       rel="noopener noreferrer" 
443:                       className="w-full bg-white text-zinc-700 border border-zinc-300 font-bold text-sm py-3.5 rounded-xl hover:bg-zinc-50 transition-all flex items-center justify-center gap-2"
444:                     >
445:                       Abrir Carrinho Melhor Envio
446:                       <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
447:                     </a>
448:                   </>
449:                 )}
450:               </div>
451:             </div>
452:           </div>
453:         </div>
454:       )}
455:     </>
456:   );
457: }
