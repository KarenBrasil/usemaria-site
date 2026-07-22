import Link from "next/link";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string, payment_intent?: string, payment_intent_client_secret?: string, redirect_status?: string }>
}) {
  const resolvedSearchParams = await searchParams;
  const orderId = resolvedSearchParams?.orderId;
  const paymentIntent = resolvedSearchParams?.payment_intent;
  const redirectStatus = resolvedSearchParams?.redirect_status;

  const settings = await prisma.storeSettings.findUnique({ where: { id: "default" } });
  const defaultSettings = settings || {
    storeName: "USE MARIA",
    whatsappNumber: "5585994277446",
    pixKey: "CNPJ: 00.000.000/0001-00",
    pixName: "USE MARIA OFICIAL"
  };

  // If redirected from Stripe
  if (paymentIntent && redirectStatus === 'succeeded') {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center font-sans">
        <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-6 text-green-600">
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>
        </div>
        <h1 className="text-3xl font-serif mb-4">Pagamento Confirmado!</h1>
        <p className="text-zinc-500 mb-8 max-w-md mx-auto">
          Seu pedido foi recebido com sucesso e já está sendo preparado com muito carinho. Você receberá atualizações no seu e-mail.
        </p>
        <Link href="/" className="bg-black text-white px-8 py-4 uppercase text-xs tracking-widest font-bold hover:bg-zinc-800 transition-colors">
          Voltar para a Loja
        </Link>
      </div>
    );
  }

  // If it's a PIX order
  if (orderId) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { customer: true }
    });

    if (!order) return <div>Pedido não encontrado</div>;

    const waLink = `https://wa.me/${defaultSettings.whatsappNumber}?text=${encodeURIComponent(`Olá! Realizei o pedido #${order.id.slice(-6).toUpperCase()} no site e gostaria de enviar o comprovante do PIX no valor de R$ ${order.total.toFixed(2).replace('.', ',')}.`)}`;

    return (
      <div className="min-h-screen bg-[#F5F3EF] flex flex-col items-center justify-center p-4 font-sans text-black py-16">
        <div className="bg-white p-8 md:p-12 w-full max-w-xl text-center shadow-sm">
          <h1 className="text-2xl font-serif mb-2">Pedido Reservado!</h1>
          <p className="text-sm text-zinc-500 mb-8">
            Para garantir suas peças, realize a transferência PIX em até 30 minutos.
          </p>

          <div className="bg-zinc-50 border border-zinc-200 p-6 mb-8 text-left">
             <p className="text-xs uppercase tracking-widest font-bold text-zinc-500 mb-4">Dados para o PIX</p>
             <div className="mb-4">
               <span className="block text-[10px] uppercase tracking-widest text-zinc-400">Chave PIX</span>
               <strong className="text-lg font-serif">{defaultSettings.pixKey}</strong>
             </div>
             <div className="mb-4">
               <span className="block text-[10px] uppercase tracking-widest text-zinc-400">Nome do Recebedor</span>
               <strong className="text-sm">{defaultSettings.pixName}</strong>
             </div>
             <div>
               <span className="block text-[10px] uppercase tracking-widest text-zinc-400">Valor Total</span>
               <strong className="text-2xl font-serif text-green-600">R$ {order.total.toFixed(2).replace('.', ',')}</strong>
             </div>
          </div>

          <div className="mb-8 p-4 bg-yellow-50 border border-yellow-200 text-yellow-800 text-xs text-left">
            <strong>Importante:</strong> Após realizar a transferência, clique no botão abaixo para nos enviar o comprovante via WhatsApp e agilizarmos o envio.
          </div>

          <a href={waLink} target="_blank" rel="noopener noreferrer" className="block w-full bg-black text-white uppercase text-xs tracking-widest font-bold py-5 hover:bg-zinc-800 transition-colors mb-4">
            Enviar Comprovante
          </a>
          <Link href="/" className="block text-xs uppercase tracking-widest text-zinc-500 hover:text-black underline">
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
