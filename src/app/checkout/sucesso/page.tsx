import Link from "next/link";
import prisma from "@/lib/prisma";
import CopyPixButton from "@/components/CopyPixButton";
import { generatePixPayload } from "@/lib/pix";

export const dynamic = 'force-dynamic';

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string, payment_intent?: string, payment_intent_client_secret?: string, redirect_status?: string, method?: string }>
}) {
  const resolvedSearchParams = await searchParams;
  const orderId = resolvedSearchParams?.orderId;
  const paymentIntent = resolvedSearchParams?.payment_intent;
  const redirectStatus = resolvedSearchParams?.redirect_status;
  const method = resolvedSearchParams?.method;

  const settings = await prisma.storeSettings.findUnique({ where: { id: "default" } });
  const defaultSettings = settings || {
    storeName: "USE MARIA",
    whatsappNumber: "5585994277446",
    pixKey: "00000000000100", // Needs to be clean key for generator
    pixName: "USE MARIA OFICIAL"
  };

  if (orderId) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { customer: true }
    });

    if (!order) return <div>Pedido não encontrado</div>;

    // Se for Cartão de Crédito
    if (method === 'CARD' || (paymentIntent && redirectStatus === 'succeeded')) {
      return (
        <div className="min-h-screen bg-[#F5F3EF] flex flex-col items-center justify-center p-8 text-center font-sans">
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-6 text-green-600">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>
          </div>
          <h1 className="text-3xl font-serif mb-4 text-black">Pagamento Confirmado!</h1>
          <p className="text-zinc-600 mb-8 max-w-md mx-auto">
            Seu pedido foi recebido com sucesso e já está sendo preparado com muito carinho. Você receberá atualizações no seu e-mail.
          </p>

          {/* Se a pessoa escolheu retirada/uber, orienta chamar no WhatsApp */}
          {(order.shippingMethod?.toLowerCase().includes('retirada') || order.shippingMethod?.toLowerCase().includes('uber')) && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-md mb-8 max-w-md w-full">
              <p className="text-sm font-bold mb-2">Atenção para o seu frete:</p>
              <p className="text-sm mb-4">Como você escolheu {order.shippingMethod}, por favor, chame nossa equipe no WhatsApp para combinarmos a entrega/retirada!</p>
              <a 
                href={`https://wa.me/${defaultSettings.whatsappNumber}?text=${encodeURIComponent(`Olá! Realizei o pedido #${order.id.slice(-6).toUpperCase()} no site com a opção de frete "${order.shippingMethod}" e gostaria de combinar a entrega.`)}`}
                target="_blank" 
                rel="noreferrer"
                className="bg-[#25D366] text-white px-6 py-3 rounded-md font-bold text-sm flex items-center justify-center gap-2 w-full hover:bg-[#1EBE57] transition-colors"
              >
                Chamar no WhatsApp
              </a>
            </div>
          )}

          <div className="flex gap-4">
            <Link href={`/rastreio?id=${order.id}`} className="bg-black text-white px-8 py-4 uppercase text-xs tracking-widest font-bold hover:bg-zinc-800 transition-colors rounded-sm">
              Acompanhar Pedido
            </Link>
            <Link href="/" className="bg-zinc-200 text-black px-8 py-4 uppercase text-xs tracking-widest font-bold hover:bg-zinc-300 transition-colors rounded-sm">
              Voltar para Loja
            </Link>
          </div>
        </div>
      );
    }

    // Se for PIX
    const pixPayload = generatePixPayload({
      pixKey: defaultSettings.pixKey.replace(/[^a-zA-Z0-9@.\-_]/g, ''),
      merchantName: defaultSettings.pixName,
      amount: order.total,
      transactionId: `PED${order.id.slice(-6).toUpperCase()}`
    });

    const waLink = `https://wa.me/${defaultSettings.whatsappNumber}?text=${encodeURIComponent(`Olá! Realizei o pedido #${order.id.slice(-6).toUpperCase()} no site e gostaria de enviar o comprovante do PIX no valor de R$ ${order.total.toFixed(2).replace('.', ',')}. Minha opção de frete foi: ${order.shippingMethod}.`)}`;

    return (
      <div className="min-h-screen bg-[#F9F9F9] flex flex-col items-center justify-center p-4 font-sans text-zinc-900 py-12">
        <div className="bg-white rounded-xl shadow-lg border border-zinc-100 p-8 md:p-10 w-full max-w-lg text-center relative overflow-hidden">
          {/* Top Decorative bar */}
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#1a1a1a] to-[#4a4a4a]"></div>
          
          <div className="w-16 h-16 bg-[#1a1a1a] rounded-full flex items-center justify-center mx-auto mb-6 shadow-md">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>
          </div>
          
          <h1 className="text-2xl font-bold mb-2 tracking-tight">Pedido Reservado!</h1>
          <p className="text-sm text-zinc-500 mb-3 font-medium">
            Seu pedido <span className="font-bold text-zinc-800">#{order.id.slice(-6).toUpperCase()}</span> foi criado.
          </p>
          <div className="text-sm text-amber-700 bg-amber-50 p-4 rounded-md border border-amber-200 mb-8 font-medium">
            Para agilizar a liberação do seu pedido, envie o comprovante do PIX através do nosso WhatsApp.
          </div>

          <div className="bg-zinc-50 rounded-lg p-6 mb-6 text-left border border-zinc-200 shadow-inner">
            <div className="flex justify-between items-end border-b border-zinc-200 pb-4 mb-4">
               <div>
                 <span className="block text-[10px] uppercase tracking-widest text-zinc-400 font-bold mb-1">Valor do Pedido</span>
                 <strong className="text-3xl font-bold text-black tracking-tighter">R$ {order.total.toFixed(2).replace('.', ',')}</strong>
               </div>
            </div>

            <div className="space-y-4">
              <div>
                 <span className="block text-[10px] uppercase tracking-widest text-zinc-400 font-bold mb-2">PIX Copia e Cola (Com valor exato)</span>
                 
                 {/* QR Code fallback visual via API externa (opcional, mas muito útil) */}
                 <div className="flex justify-center mb-4 bg-white p-4 rounded border border-zinc-200">
                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(pixPayload)}`} alt="QR Code PIX" className="w-48 h-48" />
                 </div>

                 <strong className="text-xs font-mono text-zinc-500 bg-white px-3 py-2 rounded border border-zinc-200 w-full block break-all mb-2">
                   {pixPayload}
                 </strong>
                 <CopyPixButton pixKey={pixPayload} />
              </div>
              
              <div className="bg-white p-3 rounded border border-zinc-100 flex items-center gap-3">
                 <div className="w-10 h-10 bg-zinc-100 rounded-full flex items-center justify-center shrink-0">
                   <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                 </div>
                 <div className="overflow-hidden">
                   <span className="block text-[10px] uppercase tracking-widest text-zinc-400 font-bold">Recebedor</span>
                   <strong className="text-sm text-zinc-800 truncate block">{defaultSettings.pixName}</strong>
                 </div>
              </div>
            </div>
          </div>

          <a href={waLink} target="_blank" rel="noopener noreferrer" className="block w-full bg-[#25D366] text-white uppercase text-xs tracking-widest font-bold py-4 rounded shadow-sm hover:bg-[#20b958] transition-colors mb-3 flex items-center justify-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21"/><path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1"/></svg>
            Enviar Comprovante
          </a>
          
          <Link href={`/rastreio?id=${order.id}`} className="block w-full border border-zinc-300 text-zinc-800 uppercase text-xs tracking-widest font-bold py-4 rounded hover:bg-zinc-50 transition-colors mb-6">
            Acompanhar Pedido
          </Link>
          
          <Link href="/" className="block text-xs uppercase tracking-widest text-zinc-500 hover:text-black font-medium transition-colors">
            Voltar para a loja
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center font-sans">
      <h1 className="text-xl font-serif mb-4">Finalizando processo...</h1>
      <Link href="/" className="text-sm underline">Voltar</Link>
    </div>
  );
}
