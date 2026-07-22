'use client'

import { useCartStore } from "@/contexts/CartContext";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";

// Load Stripe (ensure env var is set)
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "pk_test_placeholder");

function CheckoutContent() {
  const { items, cartTotal, clearCart } = useCartStore();
  const router = useRouter();
  const stripe = useStripe();
  const elements = useElements();
  
  const [formData, setFormData] = useState({
    name: "", email: "", phone: "", document: "",
    zipcode: "", street: "", number: "", complement: "", neighborhood: "", city: "", state: ""
  });
  
  const [paymentMethod, setPaymentMethod] = useState<'PIX' | 'CARD'>('CARD');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (items.length === 0) {
      router.push("/");
    }
  }, [items, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.phone) {
      setError("Preencha seus dados de contato.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Create order on backend (returns orderId and optionally clientSecret if CARD)
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

      if (!response.ok) {
        throw new Error(data.error || "Erro ao gerar pedido.");
      }
      
      if (paymentMethod === 'PIX') {
        clearCart();
        router.push(`/checkout/sucesso?orderId=${data.orderId}`);
      } else if (paymentMethod === 'CARD') {
        if (!stripe || !elements) {
          throw new Error("Stripe não carregou corretamente.");
        }
        
        // 2. Submit the local elements
        const { error: submitError } = await elements.submit();
        if (submitError) {
          throw new Error(submitError.message);
        }

        // 3. Confirm the payment with the newly created clientSecret
        const { error: confirmError } = await stripe.confirmPayment({
          elements,
          clientSecret: data.clientSecret,
          confirmParams: {
            return_url: `${window.location.origin}/checkout/sucesso`,
            payment_method_data: {
              billing_details: {
                name: formData.name,
                email: formData.email,
                phone: formData.phone
              }
            }
          },
        });

        if (confirmError) {
          throw new Error(confirmError.message);
        }
      }
    } catch (err: any) {
      setError(err.message || "Ocorreu um erro ao processar seu pedido.");
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) return null;

  return (
    <div className="min-h-screen bg-[#F5F3EF] flex flex-col md:flex-row font-sans">
      {/* Left Column - Form */}
      <div className="w-full md:w-3/5 bg-white p-6 md:p-16 overflow-y-auto border-r border-zinc-200">
        <Link href="/" className="text-2xl font-serif tracking-[0.2em] font-bold mb-10 block text-center md:text-left">USE MARIA</Link>
        
        <form onSubmit={handlePlaceOrder} className="max-w-xl mx-auto md:mx-0">
          
          {/* SECTION 1: Dados de Contato */}
          <div className="mb-10">
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-4 border-b pb-2">Dados de Contato</h2>
            <div className="grid grid-cols-1 gap-3">
              <input required name="email" type="email" placeholder="E-mail" value={formData.email} onChange={handleInputChange} className="border border-zinc-300 p-3 w-full text-sm focus:outline-none focus:border-black rounded-sm" />
              <input required name="name" placeholder="Nome Completo" value={formData.name} onChange={handleInputChange} className="border border-zinc-300 p-3 w-full text-sm focus:outline-none focus:border-black rounded-sm" />
              <div className="grid grid-cols-2 gap-3">
                 <input required name="phone" placeholder="WhatsApp" value={formData.phone} onChange={handleInputChange} className="border border-zinc-300 p-3 w-full text-sm focus:outline-none focus:border-black rounded-sm" />
                 <input name="document" placeholder="CPF" value={formData.document} onChange={handleInputChange} className="border border-zinc-300 p-3 w-full text-sm focus:outline-none focus:border-black rounded-sm" />
              </div>
            </div>
          </div>

          {/* SECTION 2: Entrega */}
          <div className="mb-10">
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-4 border-b pb-2">Entrega</h2>
            <div className="grid grid-cols-1 gap-3">
              <input name="zipcode" placeholder="CEP" value={formData.zipcode} onChange={handleInputChange} className="border border-zinc-300 p-3 w-full text-sm focus:outline-none focus:border-black rounded-sm" />
              <div className="grid grid-cols-3 gap-3">
                 <input name="street" placeholder="Rua / Avenida" value={formData.street} onChange={handleInputChange} className="col-span-2 border border-zinc-300 p-3 w-full text-sm focus:outline-none focus:border-black rounded-sm" />
                 <input name="number" placeholder="Número" value={formData.number} onChange={handleInputChange} className="border border-zinc-300 p-3 w-full text-sm focus:outline-none focus:border-black rounded-sm" />
              </div>
              <input name="complement" placeholder="Complemento (Opcional)" value={formData.complement} onChange={handleInputChange} className="border border-zinc-300 p-3 w-full text-sm focus:outline-none focus:border-black rounded-sm" />
              <div className="grid grid-cols-3 gap-3">
                 <input name="neighborhood" placeholder="Bairro" value={formData.neighborhood} onChange={handleInputChange} className="border border-zinc-300 p-3 w-full text-sm focus:outline-none focus:border-black rounded-sm" />
                 <input name="city" placeholder="Cidade" value={formData.city} onChange={handleInputChange} className="border border-zinc-300 p-3 w-full text-sm focus:outline-none focus:border-black rounded-sm" />
                 <input name="state" placeholder="Estado" value={formData.state} onChange={handleInputChange} className="border border-zinc-300 p-3 w-full text-sm focus:outline-none focus:border-black rounded-sm" />
              </div>
            </div>
          </div>

          {/* SECTION 3: Pagamento (Accordion Style) */}
          <div className="mb-10">
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-4 border-b pb-2">Forma de Pagamento</h2>
            
            <div className="border border-zinc-300 rounded-sm overflow-hidden bg-zinc-50">
               
               {/* Cartão de Crédito Header */}
               <label className={`p-4 flex items-center justify-between cursor-pointer transition-colors border-b border-zinc-200 ${paymentMethod === 'CARD' ? 'bg-zinc-100' : 'bg-white'}`}>
                 <div className="flex items-center gap-4">
                   <input type="radio" name="payment" checked={paymentMethod === 'CARD'} onChange={() => setPaymentMethod('CARD')} className="accent-black w-4 h-4" />
                   <span className="font-bold text-sm text-zinc-900">Cartão de crédito</span>
                 </div>
                 <div className="flex gap-1">
                   <div className="w-8 h-5 bg-zinc-200 rounded text-[8px] flex items-center justify-center font-bold">VISA</div>
                   <div className="w-8 h-5 bg-zinc-200 rounded text-[8px] flex items-center justify-center font-bold">MC</div>
                 </div>
               </label>
               
               {paymentMethod === 'CARD' && (
                 <div className="p-4 bg-white">
                    {(!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.includes('placeholder')) ? (
                      <div className="text-red-500 text-xs text-center font-bold p-4">
                        O sistema de cartão de crédito está offline no momento. O administrador precisa configurar as chaves do Stripe e fazer um Redeploy na Vercel.
                      </div>
                    ) : (
                      <PaymentElement options={{ 
                        layout: 'tabs'
                      }} />
                    )}
                 </div>
               )}

               {/* PIX Header */}
               <label className={`p-4 flex items-center justify-between cursor-pointer transition-colors ${paymentMethod === 'PIX' ? 'bg-zinc-100' : 'bg-white'}`}>
                 <div className="flex items-center gap-4">
                   <input type="radio" name="payment" checked={paymentMethod === 'PIX'} onChange={() => setPaymentMethod('PIX')} className="accent-black w-4 h-4" />
                   <span className="font-bold text-sm text-zinc-900">Pix</span>
                 </div>
                 <span className="text-xs text-green-600 font-bold bg-green-100 px-2 py-1 rounded">Aprovação Imediata</span>
               </label>
               
               {/* PIX Body */}
               {paymentMethod === 'PIX' && (
                 <div className="p-4 bg-white text-sm text-zinc-600 border-t border-zinc-200">
                    Ao finalizar o pedido, mostraremos a chave PIX para você realizar o pagamento no aplicativo do seu banco. Sem taxas extras.
                 </div>
               )}
            </div>
          </div>

          {error && <div className="p-4 bg-red-50 text-red-600 border border-red-200 mb-6 text-sm">{error}</div>}

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white uppercase text-xs tracking-widest font-bold py-5 hover:bg-zinc-800 disabled:bg-zinc-400 transition-colors flex justify-center items-center"
          >
            {loading ? "Processando..." : "Fazer pedido"}
          </button>
        </form>
      </div>

      {/* Right Column - Summary */}
      <div className="w-full md:w-2/5 p-6 md:p-16">
         <div className="max-w-md mx-auto md:mx-0 sticky top-10">
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-6 border-b border-zinc-300 pb-2">Resumo do Pedido</h2>
            <div className="flex flex-col gap-4 mb-6 border-b border-zinc-200 pb-6">
              {items.map(item => (
                <div key={item.id} className="flex gap-4 items-center">
                  <div className="relative w-16 h-20 bg-zinc-200 shrink-0 border border-zinc-300 rounded-sm overflow-hidden">
                    <Image src={item.image} alt={item.name} fill className="object-cover mix-blend-multiply" />
                    <span className="absolute -top-1 -right-1 bg-zinc-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold shadow-md">{item.quantity}</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xs font-bold text-zinc-900">{item.name}</h3>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">Tam: {item.size}</p>
                  </div>
                  <p className="text-sm font-medium text-zinc-900">R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}</p>
                </div>
              ))}
            </div>
            
            <div className="flex justify-between items-center mb-3 text-sm text-zinc-600">
               <span>Subtotal</span>
               <span>R$ {cartTotal().toFixed(2).replace('.', ',')}</span>
            </div>
            <div className="flex justify-between items-center mb-6 text-sm text-zinc-600">
               <span>Custo de frete</span>
               <span className="text-xs font-bold text-green-600">Grátis</span>
            </div>
            <div className="flex justify-between items-center pt-4 border-t border-zinc-300">
               <span className="text-sm font-bold text-zinc-900">Total</span>
               <span className="text-2xl font-serif text-zinc-900">R$ {cartTotal().toFixed(2).replace('.', ',')}</span>
            </div>
         </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  const { cartTotal } = useCartStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <Elements 
      stripe={stripePromise} 
      options={{ 
        mode: 'payment',
        paymentMethodTypes: ['card'],
        amount: Math.max(100, Math.round(cartTotal() * 100)),
        currency: 'brl',
        appearance: {
          theme: 'stripe',
          variables: {
            colorPrimary: '#000000',
            colorBackground: '#ffffff',
            colorText: '#18181b',
            colorDanger: '#ef4444',
            fontFamily: 'ui-sans-serif, system-ui, sans-serif',
            spacingUnit: '4px',
            borderRadius: '2px',
          }
        }
      }}
    >
      <CheckoutContent />
    </Elements>
  );
}
