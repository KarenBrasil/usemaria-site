import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";

export default async function ReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const orderId = resolvedParams.id;
  
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      customer: true,
      items: { include: { product: true } }
    }
  });

  if (!order) {
    return notFound();
  }

  return (
    <div className="bg-white min-h-screen text-black font-sans p-8 md:p-12 print:p-0 print:m-0">
      {/* Script to trigger auto-print when opened */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            window.onload = function() {
              setTimeout(() => {
                window.print();
              }, 500);
            }
          `,
        }}
      />

      <div className="max-w-2xl mx-auto border border-zinc-200 p-8 rounded-xl print:border-none print:p-0 print:block">
        
        {/* Header */}
        <div className="flex justify-between items-start mb-8 border-b border-zinc-200 pb-6">
          <div>
            <h1 className="text-3xl font-serif tracking-[0.2em] font-bold mb-2">USE MARIA</h1>
            <p className="text-xs text-zinc-500 uppercase tracking-widest">Recibo de Pedido</p>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-bold">#{order.id.slice(-6).toUpperCase()}</h2>
            <p className="text-sm text-zinc-600 mt-1">
              Data: {new Date(order.createdAt).toLocaleDateString('pt-BR')}
            </p>
            <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mt-1 bg-emerald-50 px-2 py-0.5 rounded inline-block">
              {order.status === 'PAID' || order.status === 'SHIPPED' || order.status === 'DELIVERED' ? 'PAGAMENTO APROVADO' : 'PENDENTE'}
            </p>
          </div>
        </div>

        {/* Customer & Address */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2">Cliente</h3>
            <p className="font-bold text-zinc-800">{order.customer?.name}</p>
            <p className="text-sm text-zinc-600">{order.customer?.email}</p>
            <p className="text-sm text-zinc-600">{order.customer?.phone}</p>
            <p className="text-xs text-zinc-500 mt-1">Doc: {order.customer?.cpf || 'Não informado'}</p>
          </div>
          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2">Endereço de Entrega</h3>
            {order.street ? (
              <div className="text-sm text-zinc-800 leading-relaxed">
                <p>{order.street}, {order.number} {order.complement && `- ${order.complement}`}</p>
                <p>{order.neighborhood} - {order.city}/{order.state}</p>
                <p className="font-mono mt-1 text-xs text-zinc-500">CEP: {order.zipcode}</p>
              </div>
            ) : (
              <p className="text-sm italic text-zinc-400">Retirada / Sem Endereço</p>
            )}
          </div>
        </div>

        {/* Items Table */}
        <div className="mb-8">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-3 border-b border-zinc-200 pb-2">Itens do Pedido</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-zinc-500 border-b border-zinc-100">
                <th className="py-2 font-normal">Produto</th>
                <th className="py-2 font-normal text-center">Tam</th>
                <th className="py-2 font-normal text-center">Qtd</th>
                <th className="py-2 font-normal text-right">Preço</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={item.id} className="border-b border-zinc-100">
                  <td className="py-3 font-medium text-zinc-800">{item.product?.name || 'Produto Excluído'}</td>
                  <td className="py-3 text-center">{item.size}</td>
                  <td className="py-3 text-center">{item.quantity}</td>
                  <td className="py-3 text-right">R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end mb-12">
          <div className="w-1/2">
            <div className="flex justify-between items-center py-2 text-sm text-zinc-600 border-b border-zinc-100">
              <span>Subtotal</span>
              <span>R$ {order.total.toFixed(2).replace('.', ',')}</span>
            </div>
            <div className="flex justify-between items-center py-2 text-sm text-zinc-600 border-b border-zinc-200">
              <span>Frete</span>
              <span>R$ 0,00</span> {/* Assumindo que frete já compõe o total ou é grátis */}
            </div>
            <div className="flex justify-between items-center py-3 text-lg font-bold text-zinc-900">
              <span>Total Pago</span>
              <span>R$ {order.total.toFixed(2).replace('.', ',')}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-zinc-400 border-t border-zinc-200 pt-6">
          <p>Obrigado por comprar na Use Maria!</p>
          <p>lojausemaria.com.br</p>
        </div>

      </div>

      {/* Action Buttons (Hidden in Print) */}
      <div className="max-w-2xl mx-auto mt-8 flex justify-center gap-4 print:hidden">
        <button 
          onClick={() => window.print()}
          className="bg-black text-white px-6 py-2 rounded font-medium shadow hover:bg-zinc-800 transition-colors"
        >
          Imprimir / Baixar PDF
        </button>
        <button 
          onClick={() => window.close()}
          className="bg-white border border-zinc-300 text-zinc-700 px-6 py-2 rounded font-medium hover:bg-zinc-50 transition-colors"
        >
          Fechar Aba
        </button>
      </div>

    </div>
  );
}
