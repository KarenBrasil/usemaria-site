import Link from "next/link";

export default function ReturnsPolicyPage() {
  return (
    <div className="min-h-screen bg-[#F9F8F6] font-sans pb-20 text-zinc-800">
      <header className="bg-white border-b border-zinc-200 py-6 text-center">
        <Link href="/" className="text-2xl font-serif tracking-[0.2em] font-bold inline-block">USE MARIA</Link>
      </header>

      <main className="max-w-3xl mx-auto px-4 md:px-8 mt-12">
        <h1 className="text-3xl font-serif mb-8 border-b border-zinc-200 pb-4">Trocas e Devoluções</h1>
        
        <div className="prose prose-zinc max-w-none text-sm leading-relaxed">
          <p>
            A <strong>Use Maria</strong> preza pela satisfação plena e pela excelente experiência de nossas clientes. 
            Nossa política de trocas e devoluções é baseada no Código de Defesa do Consumidor (CDC).
          </p>

          <h2 className="text-xl font-bold mt-8 mb-4">1. Direito de Arrependimento (7 dias)</h2>
          <p>
            De acordo com o artigo 49 do Código de Defesa do Consumidor, nas compras realizadas de forma virtual 
            (fora do estabelecimento comercial), você tem o direito de se arrepender da compra e solicitar a 
            devolução do produto em até <strong>7 (sete) dias corridos</strong> a contar da data de recebimento do pedido.
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>O produto deve ser devolvido na embalagem original.</li>
            <li>Não pode haver indícios de uso, lavagem ou alterações na peça (como ajustes, bainhas, etc).</li>
            <li>Deve estar acompanhado da etiqueta original fixada na peça.</li>
          </ul>

          <h2 className="text-xl font-bold mt-8 mb-4">2. Trocas por Defeito</h2>
          <p>
            Caso a peça apresente algum defeito de fabricação, você tem até <strong>30 dias corridos</strong> após o recebimento 
            para entrar em contato conosco e solicitar a troca. O produto será analisado e, confirmado o defeito, a troca será realizada sem custos adicionais.
          </p>

          <h2 className="text-xl font-bold mt-8 mb-4">3. Como Solicitar</h2>
          <p>
            Para solicitar uma troca ou devolução, entre em contato através do nosso WhatsApp oficial ou e-mail de suporte informando:
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Número do Pedido</li>
            <li>Seu nome completo e CPF</li>
            <li>Motivo da devolução/troca</li>
            <li>Fotos da peça (em caso de defeito)</li>
          </ul>

          <h2 className="text-xl font-bold mt-8 mb-4">4. Restituição do Valor</h2>
          <p>
            Nos casos de devolução (direito de arrependimento), o estorno será realizado na mesma forma de pagamento escolhida no momento da compra, após o recebimento e análise da peça em nosso estoque:
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li><strong>PIX:</strong> Reembolso realizado em até 2 dias úteis.</li>
            <li><strong>Cartão de Crédito:</strong> O estorno será solicitado à administradora do cartão, podendo constar em até duas faturas subsequentes.</li>
          </ul>

          <div className="mt-12 p-6 bg-zinc-100 rounded-sm text-center">
            <p className="font-bold mb-2">Ficou com alguma dúvida?</p>
            <p>Fale conosco pelo WhatsApp ou acompanhe nosso Instagram.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
