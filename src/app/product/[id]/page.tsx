import Image from "next/image";
import Link from "next/link";

// Mock de produtos (em um app real isso viria do banco de dados/Stripe)
const products = [
  { 
    id: "1", 
    name: "Camisa Classic Maria Branca", 
    price: "R$ 149,90", 
    description: "A clássica t-shirt branca reimaginada. Confeccionada em algodão egípcio 100% com caimento estruturado e toque incrivelmente macio. Estampa minimalista em silk relevo.",
    details: ["100% Algodão Premium", "Estampa em Silk Relevo", "Gola canelada 2x1", "Produzida no Brasil"],
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80", 
    sizes: ["P", "M", "G", "GG"] 
  },
  // ...outros produtos podem ser adicionados aqui
];

export default function ProductPage({ params }: { params: { id: string } }) {
  // Para fins de demonstração, sempre pegamos o primeiro produto
  const product = products[0];

  return (
    <div className="flex flex-col min-h-screen font-sans bg-white text-black">
      {/* HEADER (Navigation) - Mesmo da Home */}
      <header className="w-full z-10 flex items-center justify-between px-8 py-6 text-black uppercase text-xs tracking-widest font-semibold border-b border-zinc-100">
        <Link href="/" className="text-xl tracking-[0.2em] font-bold">USE MARIA</Link>
        <nav className="hidden md:flex gap-8">
          <Link href="/" className="hover:opacity-70 transition-opacity">Shop</Link>
          <a href="#" className="hover:opacity-70 transition-opacity">Coleções</a>
          <a href="#" className="hover:opacity-70 transition-opacity">Sobre Nós</a>
        </nav>
        <div className="flex gap-4">
          <button className="hover:opacity-70 transition-opacity">Buscar</button>
          <button className="hover:opacity-70 transition-opacity">Carrinho (0)</button>
        </div>
      </header>

      {/* PRODUCT DETAILS SECTION */}
      <main className="flex-grow flex flex-col md:flex-row w-full max-w-[1400px] mx-auto px-4 md:px-8 py-12 gap-12 lg:gap-24">
        
        {/* Lado Esquerdo - Galeria de Imagens */}
        <div className="w-full md:w-1/2 flex flex-col gap-4">
          <div className="relative aspect-[3/4] w-full bg-zinc-100">
            <Image
              src={product.image}
              alt={product.name}
              fill
              className="object-cover"
              priority
            />
          </div>
          {/* Aqui entrariam os thumbnails de outras fotos da camisa */}
          <div className="grid grid-cols-2 gap-4">
             <div className="relative aspect-[3/4] bg-zinc-100">
                <Image src={product.image} alt="Detalhe 1" fill className="object-cover opacity-70 hover:opacity-100 transition-opacity cursor-pointer" />
             </div>
             <div className="relative aspect-[3/4] bg-zinc-100">
                <Image src={product.image} alt="Detalhe 2" fill className="object-cover opacity-70 hover:opacity-100 transition-opacity cursor-pointer" />
             </div>
          </div>
        </div>

        {/* Lado Direito - Informações de Compra */}
        <div className="w-full md:w-1/2 flex flex-col pt-8 md:pt-16 md:sticky md:top-24 h-fit">
          <h1 className="text-3xl md:text-4xl font-serif mb-4">{product.name}</h1>
          <p className="text-xl text-zinc-600 mb-8">{product.price}</p>
          
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs uppercase tracking-widest font-semibold">Tamanho</span>
              <button className="text-xs text-zinc-400 underline hover:text-black">Guia de Medidas</button>
            </div>
            
            <div className="flex gap-3">
              {product.sizes.map((size) => (
                <button 
                  key={size}
                  className="w-12 h-12 border border-zinc-200 flex items-center justify-center text-sm hover:border-black hover:bg-black hover:text-white transition-all"
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          <button className="w-full bg-black text-white uppercase text-sm tracking-widest font-bold py-5 hover:bg-zinc-800 transition-colors mb-12">
            Adicionar ao Carrinho
          </button>

          {/* Acordeão de Informações */}
          <div className="border-t border-zinc-200">
            <div className="py-6 border-b border-zinc-200">
              <h3 className="text-xs uppercase tracking-widest font-bold mb-4">Descrição</h3>
              <p className="text-sm text-zinc-600 leading-relaxed">{product.description}</p>
            </div>
            <div className="py-6 border-b border-zinc-200">
              <h3 className="text-xs uppercase tracking-widest font-bold mb-4">Detalhes e Composição</h3>
              <ul className="list-disc pl-4 text-sm text-zinc-600 space-y-2">
                {product.details.map((detail, idx) => (
                  <li key={idx}>{detail}</li>
                ))}
              </ul>
            </div>
            <div className="py-6 border-b border-zinc-200">
              <h3 className="text-xs uppercase tracking-widest font-bold mb-4">Envio e Devolução</h3>
              <p className="text-sm text-zinc-600 leading-relaxed">Frete grátis para todo o Brasil nas compras acima de R$ 299. Primeira troca grátis em até 7 dias.</p>
            </div>
          </div>

        </div>
      </main>

      {/* FOOTER */}
      <footer className="bg-black text-white py-12 px-8 flex flex-col items-center mt-24">
         <p className="text-xs tracking-widest uppercase mb-4 opacity-50">© 2026 UseMaria. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}
