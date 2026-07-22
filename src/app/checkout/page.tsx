'use client'

import { useCartStore } from "@/contexts/CartContext";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";

// Make sure to set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY in .env
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "pk_test_placeholder");

function CheckoutForm({ clientSecret, onSuccess }: { clientSecret: string, onSuccess: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);
    const { error: submitError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/checkout/sucesso`,
      },
    });

    if (submitError) {
      setError(submitError.message || "Erro ao processar pagamento");
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-6">
      <PaymentElement />
      {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
      <button 
        disabled={!stripe || processing}
        className="w-full bg-black text-white uppercase text-xs tracking-widest font-bold py-4 mt-4 disabled:bg-zinc-400"
      >
        {processing ? "Processando..." : "Pagar com Cartão"}
      </button>
    </form>
  );
}

export default function CheckoutPage() {
  const { items, cartTotal, clearCart } = useCartStore();
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    name: "", email: "", phone: "", document: "",
    zipcode: "", street: "", number: "", complement: "", neighborhood: "", city: "", state: ""
  });
  
  const [paymentMethod, setPaymentMethod] = useState<'PIX' | 'CARD'>('PIX');
  const [loading, setLoading] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [step, setStep] = useState<1 | 2>(1); // 1 = Address, 2 = Payment

  useEffect(() => {
    if (items.length === 0) {
      router.push("/");
    }
  }, [items, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const createOrder = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: {
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
          },
          items: items.map(i => ({
            productId: i.productId,
            size: i.size,
            quantity: i.quantity,
            price: i.price
          })),
          total: cartTotal(),
          paymentMethod
        })
      });

      const data = await response.json();
      
      if (paymentMethod === 'PIX') {
        clearCart();
        router.push(`/checkout/sucesso?orderId=${data.orderId}`);
      } else {
        setClientSecret(data.clientSecret);
        setStep(2);
      }
    } catch (error) {
      alert("Erro ao criar pedido. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) return null;

  return (
    <div className="min-h-screen bg-[#F5F3EF] flex flex-col md:flex-row">
      {/* Left Column - Form */}
      <div className="w-full md:w-3/5 bg-white p-8 md:p-16 overflow-y-auto">
        <Link href="/" className="text-xl font-serif tracking-[0.2em] font-bold mb-12 block">USE MARIA</Link>
        
        {step === 1 ? (
          <div className="max-w-xl">
            <h2 className="text-lg font-serif mb-6">Informações de Contato</h2>
            <div className="grid grid-cols-1 gap-4 mb-10">
              <input name="email" placeholder="E-mail" value={formData.email} onChange={handleInputChange} className="border border-zinc-300 p-3 w-full text-sm focus:outline-none focus:border-black" />
              <input name="name" placeholder="Nome Completo" value={formData.name} onChange={handleInputChange} className="border border-zinc-300 p-3 w-full text-sm focus:outline-none focus:border-black" />
              <div className="grid grid-cols-2 gap-4">
                 <input name="phone" placeholder="WhatsApp (DDD + Número)" value={formData.phone} onChange={handleInputChange} className="border border-zinc-300 p-3 w-full text-sm focus:outline-none focus:border-black" />
                 <input name="document" placeholder="CPF" value={formData.document} onChange={handleInputChange} className="border border-zinc-300 p-3 w-full text-sm focus:outline-none focus:border-black" />
              </div>
            </div>

            <h2 className="text-lg font-serif mb-6">Endereço de Entrega</h2>
            <div className="grid grid-cols-1 gap-4 mb-10">
              <input name="zipcode" placeholder="CEP" value={formData.zipcode} onChange={handleInputChange} className="border border-zinc-300 p-3 w-full text-sm focus:outline-none focus:border-black" />
              <div className="grid grid-cols-3 gap-4">
                 <input name="street" placeholder="Rua / Avenida" value={formData.street} onChange={handleInputChange} className="col-span-2 border border-zinc-300 p-3 w-full text-sm focus:outline-none focus:border-black" />
                 <input name="number" placeholder="Número" value={formData.number} onChange={handleInputChange} className="border border-zinc-300 p-3 w-full text-sm focus:outline-none focus:border-black" />
              </div>
              <input name="complement" placeholder="Complemento (Opcional)" value={formData.complement} onChange={handleInputChange} className="border border-zinc-300 p-3 w-full text-sm focus:outline-none focus:border-black" />
              <div className="grid grid-cols-3 gap-4">
                 <input name="neighborhood" placeholder="Bairro" value={formData.neighborhood} onChange={handleInputChange} className="border border-zinc-300 p-3 w-full text-sm focus:outline-none focus:border-black" />
                 <input name="city" placeholder="Cidade" value={formData.city} onChange={handleInputChange} className="border border-zinc-300 p-3 w-full text-sm focus:outline-none focus:border-black" />
                 <input name="state" placeholder="Estado" value={formData.state} onChange={handleInputChange} className="border border-zinc-300 p-3 w-full text-sm focus:outline-none focus:border-black" />
              </div>
            </div>

            <h2 className="text-lg font-serif mb-6">Pagamento</h2>
            <div className="flex flex-col gap-3 mb-10">
               <label className={`border p-4 flex items-center gap-4 cursor-pointer transition-colors ${paymentMethod === 'PIX' ? 'border-black bg-zinc-50' : 'border-zinc-200'}`}>
                 <input type="radio" name="payment" checked={paymentMethod === 'PIX'} onChange={() => setPaymentMethod('PIX')} className="accent-black" />
                 <div className="flex-1">
                   <span className="font-bold text-sm uppercase tracking-widest block">PIX (Aprovação Imediata)</span>
                   <span className="text-xs text-zinc-500">Sem taxas. Transferência direta para a loja.</span>
                 </div>
               </label>
               <label className={`border p-4 flex items-center gap-4 cursor-pointer transition-colors ${paymentMethod === 'CARD' ? 'border-black bg-zinc-50' : 'border-zinc-200'}`}>
                 <input type="radio" name="payment" checked={paymentMethod === 'CARD'} onChange={() => setPaymentMethod('CARD')} className="accent-black" />
                 <div className="flex-1">
                   <span className="font-bold text-sm uppercase tracking-widest block">Cartão de Crédito</span>
                   <span className="text-xs text-zinc-500">Pagamento seguro via Stripe.</span>
                 </div>
               </label>
            </div>

            <button 
              onClick={createOrder}
              disabled={loading || !formData.email || !formData.name}
              className="w-full bg-black text-white uppercase text-xs tracking-widest font-bold py-5 hover:bg-zinc-800 disabled:bg-zinc-400 transition-colors"
            >
              {loading ? "Processando..." : (paymentMethod === 'PIX' ? "Finalizar Pedido" : "Ir para Pagamento")}
            </button>
          </div>
        ) : (
          <div className="max-w-xl">
             <h2 className="text-lg font-serif mb-2">Pagamento Seguro</h2>
             <p className="text-sm text-zinc-500 mb-8">Insira os dados do seu cartão para finalizar a compra.</p>
             {clientSecret && (
               <Elements stripe={stripePromise} options={{ clientSecret }}>
                 <CheckoutForm clientSecret={clientSecret} onSuccess={() => {
                    clearCart();
                 }} />
               </Elements>
             )}
          </div>
        )}
      </div>

      {/* Right Column - Summary */}
      <div className="w-full md:w-2/5 p-8 md:p-16 border-l border-zinc-200">
         <div className="max-w-md">
            <h2 className="text-sm font-bold uppercase tracking-widest mb-8">Resumo do Pedido</h2>
            <div className="flex flex-col gap-6 mb-8 border-b border-zinc-200 pb-8">
              {items.map(item => (
                <div key={item.id} className="flex gap-4">
                  <div className="relative w-16 h-20 bg-zinc-100 shrink-0">
                    <Image src={item.image} alt={item.name} fill className="object-cover mix-blend-multiply" />
                    <span className="absolute -top-2 -right-2 bg-zinc-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center">{item.quantity}</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xs font-bold uppercase tracking-widest">{item.name}</h3>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">Tam: {item.size}</p>
                  </div>
                  <p className="text-xs font-medium">R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}</p>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center mb-4 text-sm text-zinc-600">
               <span>Subtotal</span>
               <span>R$ {cartTotal().toFixed(2).replace('.', ',')}</span>
            </div>
            <div className="flex justify-between items-center mb-4 text-sm text-zinc-600">
               <span>Frete</span>
               <span className="text-[10px] font-bold uppercase tracking-widest bg-zinc-200 px-2 py-1 rounded text-black">Grátis</span>
            </div>
            <div className="flex justify-between items-center mt-6 pt-6 border-t border-zinc-200">
               <span className="text-sm font-bold uppercase tracking-widest">Total</span>
               <span className="text-2xl font-serif">R$ {cartTotal().toFixed(2).replace('.', ',')}</span>
            </div>
         </div>
      </div>
    </div>
  );
}
