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
      <div className="min-h-screen bg-[#f7f7f7] flex flex-col items-center justify-center p-4 font-sans text-zinc-900 py-12">
        <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-8 w-full max-w-[400px] text-center relative">
          
          <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-5">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>
          </div>
          
          <h1 className="text-xl font-semibold text-zinc-900 mb-6 tracking-tight">Pedido Reservado!</h1>

          <div className="mb-8">
            <span className="block text-sm text-zinc-500 mb-1 font-medium">Valor a pagar</span>
            <strong className="text-4xl font-bold text-zinc-900 tracking-tighter">R$ {order.total.toFixed(2).replace('.', ',')}</strong>
          </div>

          <div className="flex justify-center mb-6">
            <div className="bg-white p-3 rounded-2xl border border-zinc-200 inline-block shadow-sm">
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(pixPayload)}`} alt="QR Code PIX" className="w-44 h-44" />
            </div>
          </div>

          <div className="mb-6">
            <CopyPixButton pixKey={pixPayload} />
          </div>

          <div className="text-[13px] leading-relaxed text-zinc-600 bg-zinc-50 p-4 rounded-xl border border-zinc-100 mb-8 font-medium text-left flex gap-3 items-start">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400 shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
            <p>Para agilizar a liberação do seu pedido, envie o comprovante do PIX através do nosso WhatsApp.</p>
          </div>

          <a href={waLink} target="_blank" rel="noopener noreferrer" className="block w-full bg-[#18181b] text-white text-[15px] font-semibold py-3.5 rounded-xl hover:bg-[#27272a] transition-colors mb-3 flex items-center justify-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21"/><path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1"/></svg>
            Enviar Comprovante
          </a>
          
          <Link href={`/rastreio?id=${order.id}`} className="block w-full bg-zinc-100 text-zinc-900 text-[15px] font-semibold py-3.5 rounded-xl hover:bg-zinc-200 transition-colors">
            Acompanhar Pedido
          </Link>
          
          <Link href="/" className="block text-xs uppercase tracking-widest text-zinc-500 hover:text-black font-medium transition-colors mt-6">
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
