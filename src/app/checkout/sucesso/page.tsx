import Link from "next/link";
import prisma from "@/lib/prisma";
import CopyPixButton from "@/components/CopyPixButton";
import { generatePixPayload } from "@/lib/pix";
import TrackPurchase from "@/components/TrackPurchase";

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
      include: { customer: true, items: { include: { product: true } } }
    });

    if (!order) return <div>Pedido não encontrado</div>;

    // Pedido criado pelo checkout com pagamento e frete a combinar.
    // O WhatsApp é opcional e fica disponível após a confirmação.
    if (method === 'WHATSAPP') {
      const orderNumber = order.id.slice(-6).toUpperCase();
      const formattedTotal = order.total.toFixed(2).replace('.', ',');
      const formatPrice = (v: number) => `R$ ${v.toFixed(2).replace('.', ',')}`;
      const subtotal = order.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
      const trackingUrl = `/rastreio?id=${order.id}`;
      const supportMessage = `Olá! Realizei o pedido #${orderNumber} no site Use Maria (R$ ${formattedTotal}) e gostaria de combinar o pagamento e a entrega.`;

      return (
        <div className="min-h-screen bg-[#F8F5F2] py-10 px-4 font-sans text-zinc-900">
          <TrackPurchase
            orderId={order.id}
            value={order.total}
            contentIds={order.items.map((i) => i.productId).filter((id): id is string => Boolean(id))}
            numItems={order.items.reduce((n, i) => n + i.quantity, 0)}
          />
          <main className="mx-auto w-full max-w-xl">
            <Link href="/" className="mb-10 block text-center font-serif text-2xl font-bold tracking-[0.2em]">USE MARIA</Link>

            <section className="overflow-hidden rounded-2xl border border-[#E7DDD1] bg-white shadow-sm">
              <div className="bg-[#A54309] px-7 py-8 text-center text-white">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-white/50 text-2xl">✓</div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/80">Pedido recebido</p>
                <h1 className="mt-2 font-serif text-3xl">Obrigada pela sua compra!</h1>
              </div>

              <div className="p-7 sm:p-9">
                <p className="text-center text-sm leading-6 text-zinc-600">
                  Seu pedido foi registrado com sucesso.
                  {order.customer?.email && (
                    <> Enviamos a confirmação para <strong className="font-semibold text-zinc-800">{order.customer.email}</strong>.</>
                  )}
                </p>

                <div className="my-7 rounded-xl bg-[#FCFAF6] p-5">
                  <div className="flex items-center justify-between border-b border-[#E7DDD1] pb-4 text-sm">
                    <span className="text-zinc-500">Número do pedido</span>
                    <strong className="tracking-wider">#{orderNumber}</strong>
                  </div>

                  <ul className="divide-y divide-[#E7DDD1] border-b border-[#E7DDD1]">
                    {order.items.map((item) => (
                      <li key={item.id} className="flex items-start justify-between gap-4 py-3 text-sm">
                        <div className="min-w-0">
                          <p className="truncate font-medium text-zinc-800">{item.product?.name || 'Produto'}</p>
                          <p className="text-xs text-zinc-500">
                            Tam. {item.size}{item.color && item.color !== 'Padrão' ? ` · ${item.color}` : ''} · {item.quantity}x
                          </p>
                        </div>
                        <span className="shrink-0 text-zinc-700">{formatPrice(item.price * item.quantity)}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="flex items-center justify-between pt-4 text-sm">
                    <span className="text-zinc-500">Subtotal</span>
                    <span className="text-zinc-700">{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-[#E7DDD1] py-3 text-sm">
                    <span className="text-zinc-500">Frete · {order.shippingMethod || 'A combinar'}</span>
                    <span className="text-zinc-700">{order.shippingCost ? formatPrice(order.shippingCost) : 'A combinar'}</span>
                  </div>
                  <div className="flex items-end justify-between pt-4">
                    <span className="text-sm text-zinc-500">Total do pedido</span>
                    <strong className="text-2xl text-[#A54309]">R$ {formattedTotal}</strong>
                  </div>
                </div>

                <div className="rounded-xl border border-[#E7DDD1] p-5 text-sm leading-6 text-zinc-600">
                  <p className="font-semibold text-zinc-800">Próximos passos</p>
                  <ol className="mt-2 list-decimal space-y-1 pl-5">
                    <li>Entre em contato para combinar o pagamento e a entrega.</li>
                    <li>Acompanhe o pedido por este link de rastreio — ele é atualizado conforme o envio.</li>
                  </ol>
                  <p className="mt-3">Guarde o número <strong className="text-zinc-800">#{orderNumber}</strong> — ele identifica o seu pedido.</p>
                </div>

                <div className="mt-7 space-y-3">
                  <Link href={trackingUrl} className="flex w-full items-center justify-center rounded-xl bg-zinc-900 px-5 py-4 text-sm font-semibold text-white transition-colors hover:bg-zinc-800">
                    Acompanhar meu pedido
                  </Link>
                  <a href={`https://wa.me/${defaultSettings.whatsappNumber}?text=${encodeURIComponent(supportMessage)}`} target="_blank" rel="noreferrer" className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-300 px-5 py-4 text-sm font-semibold text-zinc-800 transition-colors hover:bg-zinc-50">
                    <svg className="h-4 w-4 text-[#128C7E]" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
                    Falar no WhatsApp sobre meu pedido
                  </a>
                  <Link href="/" className="block pt-2 text-center text-xs font-semibold uppercase tracking-widest text-zinc-500 hover:text-zinc-900">
                    Voltar para a loja
                  </Link>
                </div>
              </div>
            </section>
          </main>
        </div>
      );
    }

    // Se for Cartão de Crédito
    if (method === 'CARD' || (paymentIntent && redirectStatus === 'succeeded')) {
      return (
        <div className="min-h-screen bg-[#F5F3EF] flex flex-col items-center justify-center p-8 text-center font-sans">
          <TrackPurchase
            orderId={order.id}
            value={order.total}
            contentIds={order.items.map((i) => i.productId).filter((id): id is string => Boolean(id))}
            numItems={order.items.reduce((n, i) => n + i.quantity, 0)}
          />
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
