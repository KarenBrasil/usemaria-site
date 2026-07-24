'use client'

import { useCartStore } from "@/contexts/CartContext";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardNumberElement, CardExpiryElement, CardCvcElement, useStripe, useElements } from "@stripe/react-stripe-js";

// Check keys safely
const rawKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "";
const isSecretKey = rawKey.startsWith("sk_");
const isValidKey = rawKey.startsWith("pk_");

const stripePromise = isValidKey ? loadStripe(rawKey) : null;

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
  
  // Nuvemshop style steps: 1 = Contato, 2 = Entrega, 3 = Pagamento
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  useEffect(() => {
    if (items.length === 0) {
      router.push("/");
    }
  }, [items, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const nextStep = () => {
    setError(null);
    if (currentStep === 1) {
      if (!formData.email || !formData.name || !formData.phone || !formData.document) {
        setError("Preencha todos os dados de contato para continuar.");
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!formData.zipcode || !formData.street || !formData.number || !formData.city || !formData.state) {
        setError("Preencha todos os dados de entrega obrigatórios.");
        return;
      }
      setCurrentStep(3);
    }
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (paymentMethod === 'CARD') {
        if (!stripe || !elements) {
          throw new Error("O sistema de cartão não carregou corretamente. Atualize a página.");
        }
      }

      // 1. Create order on backend
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: { name: formData.name, email: formData.email, phone: formData.phone },
          items: items.map(i => ({ productId: i.productId, size: i.size, quantity: i.quantity, price: i.price })),
          total: cartTotal(),
          paymentMethod
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao gerar pedido no servidor.");
      }
      
      if (paymentMethod === 'PIX') {
        clearCart();
        router.push(`/checkout/sucesso?orderId=${data.orderId}`);
      } else if (paymentMethod === 'CARD' && stripe && elements) {
        const cardElement = elements.getElement(CardNumberElement);
        if (!cardElement) throw new Error("Preencha os dados do cartão.");

        // 2. Confirm the payment with Stripe natively
        const { error: confirmError } = await stripe.confirmCardPayment(data.clientSecret, {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: formData.name,
              email: formData.email,
              phone: formData.phone
            }
          }
        });

        if (confirmError) {
          throw new Error(confirmError.message);
        }
        
        clearCart();
        router.push(`/checkout/sucesso?orderId=${data.orderId}`);
      }
    } catch (err: any) {
      setError(err.message || "Ocorreu um erro ao processar seu pedido.");
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) return null;

  // Estilo dos inputs do Stripe para combinar com o design
  const CARD_ELEMENT_OPTIONS = {
    style: {
      base: {
        color: "#18181b",
        fontFamily: '"Inter", sans-serif',
        fontSmoothing: "antialiased",
        fontSize: "14px",
        "::placeholder": { color: "#a1a1aa" }
      },
      invalid: { color: "#ef4444", iconColor: "#ef4444" }
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F8F6] font-sans pb-20 relative text-zinc-800">
      
      {isSecretKey && (
        <div className="absolute top-0 left-0 w-full z-50 bg-red-600 text-white p-4 text-center font-bold text-sm shadow-lg">
          ERRO CRÍTICO: Você colou a sua CHAVE SECRETA (sk_...) no campo da Chave Pública (pk_...). Corrija na Vercel!
        </div>
      )}

      {/* Header Centralizado */}
      <header className="bg-white border-b border-zinc-200 py-6 text-center">
        <Link href="/" className="text-2xl font-serif tracking-[0.2em] font-bold inline-block">USE MARIA</Link>
      </header>

      <div className="max-w-6xl mx-auto px-4 md:px-8 mt-10 flex flex-col md:flex-row gap-10">
        
        {/* Lado Esquerdo - Formulário em Etapas */}
        <div className="flex-1 max-w-2xl w-full">
          
          {/* Progress Bar (Estilo Nuvemshop) */}
          <div className="flex items-center justify-between relative mb-12 px-2">
            <div className="absolute top-1/2 left-0 w-full h-[1px] bg-zinc-200 -z-10"></div>
            {/* Carrinho (Sempre completo) */}
            <div className="flex flex-col items-center bg-[#F9F8F6] px-2 cursor-pointer" onClick={() => router.push('/')}>
              <div className="w-6 h-6 rounded-full border border-zinc-300 bg-white flex items-center justify-center mb-2">
                <svg className="w-3 h-3 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
              </div>
              <span className="text-xs text-zinc-500">Carrinho</span>
            </div>
            {/* Entrega */}
            <div className="flex flex-col items-center bg-[#F9F8F6] px-2 cursor-pointer" onClick={() => setCurrentStep(currentStep > 1 ? 2 : currentStep)}>
              <div className={`w-6 h-6 rounded-full border flex items-center justify-center mb-2 ${currentStep >= 2 ? 'border-zinc-800 bg-zinc-800 text-white' : 'border-zinc-300 bg-white text-zinc-400'}`}>
                {currentStep > 2 ? <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg> : <span className="text-[10px]">2</span>}
              </div>
              <span className={`text-xs ${currentStep >= 2 ? 'text-zinc-800 font-medium' : 'text-zinc-500'}`}>Entrega</span>
            </div>
            {/* Pagamento */}
            <div className="flex flex-col items-center bg-[#F9F8F6] px-2">
              <div className={`w-6 h-6 rounded-full border flex items-center justify-center mb-2 ${currentStep === 3 ? 'border-zinc-800 bg-zinc-800 text-white' : 'border-zinc-300 bg-white text-zinc-400'}`}>
                <span className="text-[10px]">3</span>
              </div>
              <span className={`text-xs ${currentStep === 3 ? 'text-zinc-800 font-medium' : 'text-zinc-500'}`}>Pagamento</span>
            </div>
          </div>

          <form onSubmit={handlePlaceOrder}>
            
            {/* ETAPA 1: CONTATO */}
            <div className="mb-8">
              {currentStep > 1 ? (
                // Resumo do Contato (Concluído)
                <div className="flex justify-between items-center border-b border-zinc-200 pb-4">
                  <div>
                    <h3 className="text-sm font-medium text-zinc-900 mb-1">Dados de contato</h3>
                    <p className="text-sm text-zinc-500">{formData.email}</p>
                  </div>
                  <button type="button" onClick={() => setCurrentStep(1)} className="text-xs font-bold uppercase tracking-wider text-zinc-900 border border-zinc-300 px-3 py-1 rounded-sm bg-white hover:bg-zinc-50 transition-colors">Alterar</button>
                </div>
              ) : (
                // Formulário do Contato (Ativo)
                <div>
                  <h2 className="text-lg font-normal mb-6">Dados de contato</h2>
                  <div className="space-y-4">
                    <div>
                      <input required name="email" type="email" placeholder="E-mail" value={formData.email} onChange={handleInputChange} className="w-full border border-zinc-300 p-3.5 text-sm rounded-sm bg-white focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition-all placeholder:text-zinc-400" />
                    </div>
                    <div>
                      <input required name="name" placeholder="Nome Completo" value={formData.name} onChange={handleInputChange} className="w-full border border-zinc-300 p-3.5 text-sm rounded-sm bg-white focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition-all placeholder:text-zinc-400" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <input required name="phone" placeholder="Telefone / WhatsApp" value={formData.phone} onChange={handleInputChange} className="w-full border border-zinc-300 p-3.5 text-sm rounded-sm bg-white focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition-all placeholder:text-zinc-400" />
                      <input required name="document" placeholder="CPF ou CNPJ" value={formData.document} onChange={handleInputChange} className="w-full border border-zinc-300 p-3.5 text-sm rounded-sm bg-white focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition-all placeholder:text-zinc-400" />
                    </div>
                    {error && <div className="text-red-600 text-xs mt-2">{error}</div>}
                    <button type="button" onClick={nextStep} className="mt-6 w-full md:w-auto px-8 bg-[#C2A3A1] hover:bg-[#b09290] text-white font-medium text-sm py-4 rounded-sm transition-colors uppercase tracking-widest float-right">Continuar para Entrega</button>
                    <div className="clear-both"></div>
                  </div>
                </div>
              )}
            </div>

            {/* ETAPA 2: ENTREGA */}
            {currentStep >= 2 && (
              <div className="mb-8">
                {currentStep > 2 ? (
                  // Resumo da Entrega (Concluído)
                  <div className="flex justify-between items-center border-b border-zinc-200 pb-4">
                    <div>
                      <h3 className="text-sm font-medium text-zinc-900 mb-1">Dados para entrega</h3>
                      <p className="text-sm text-zinc-500">{formData.street}, {formData.number} - {formData.city}/{formData.state}</p>
                    </div>
                    <button type="button" onClick={() => setCurrentStep(2)} className="text-xs font-bold uppercase tracking-wider text-zinc-900 border border-zinc-300 px-3 py-1 rounded-sm bg-white hover:bg-zinc-50 transition-colors">Alterar</button>
                  </div>
                ) : (
                  // Formulário de Entrega (Ativo)
                  <div>
                    <h2 className="text-lg font-normal mb-6 pt-4">Entrega</h2>
                    <div className="space-y-4">
                      <input required name="zipcode" placeholder="CEP" value={formData.zipcode} onChange={handleInputChange} className="w-full md:w-1/3 border border-zinc-300 p-3.5 text-sm rounded-sm bg-white focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition-all placeholder:text-zinc-400" />
                      
                      <div className="grid grid-cols-4 gap-4">
                        <input required name="street" placeholder="Rua / Avenida" value={formData.street} onChange={handleInputChange} className="col-span-3 border border-zinc-300 p-3.5 text-sm rounded-sm bg-white focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition-all placeholder:text-zinc-400" />
                        <input required name="number" placeholder="Número" value={formData.number} onChange={handleInputChange} className="col-span-1 border border-zinc-300 p-3.5 text-sm rounded-sm bg-white focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition-all placeholder:text-zinc-400" />
                      </div>
                      
                      <input name="complement" placeholder="Apto, Bloco, Referência (opcional)" value={formData.complement} onChange={handleInputChange} className="w-full border border-zinc-300 p-3.5 text-sm rounded-sm bg-white focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition-all placeholder:text-zinc-400" />
                      
                      <div className="grid grid-cols-3 gap-4">
                        <input required name="neighborhood" placeholder="Bairro" value={formData.neighborhood} onChange={handleInputChange} className="border border-zinc-300 p-3.5 text-sm rounded-sm bg-white focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition-all placeholder:text-zinc-400" />
                        <input required name="city" placeholder="Cidade" value={formData.city} onChange={handleInputChange} className="border border-zinc-300 p-3.5 text-sm rounded-sm bg-white focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition-all placeholder:text-zinc-400" />
                        <input required name="state" placeholder="Estado (UF)" value={formData.state} onChange={handleInputChange} className="border border-zinc-300 p-3.5 text-sm rounded-sm bg-white focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition-all placeholder:text-zinc-400" />
                      </div>
                      
                      {error && <div className="text-red-600 text-xs mt-2">{error}</div>}
                      <button type="button" onClick={nextStep} className="mt-6 w-full md:w-auto px-8 bg-[#C2A3A1] hover:bg-[#b09290] text-white font-medium text-sm py-4 rounded-sm transition-colors uppercase tracking-widest float-right">Continuar para Pagamento</button>
                      <div className="clear-both"></div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ETAPA 3: PAGAMENTO */}
            {currentStep === 3 && (
              <div className="mb-8 pt-4">
                <h2 className="text-lg font-normal mb-6">Forma de pagamento</h2>
                
                <div className="border border-zinc-300 rounded-sm overflow-hidden bg-white shadow-sm">
                  
                  {/* OPÇÃO CARTÃO DE CRÉDITO */}
                  <label className={`p-5 flex items-center justify-between cursor-pointer border-b border-zinc-200 transition-colors ${paymentMethod === 'CARD' ? 'bg-zinc-50/50' : 'bg-white'}`}>
                    <div className="flex items-center gap-4">
                      <input type="radio" name="payment" checked={paymentMethod === 'CARD'} onChange={() => setPaymentMethod('CARD')} className="w-4 h-4 text-zinc-900 border-zinc-300 focus:ring-zinc-900 accent-zinc-900" />
                      <span className="font-medium text-sm">Cartão de crédito</span>
                    </div>
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">ATÉ 3x SEM JUROS</span>
                  </label>
                  
                  {paymentMethod === 'CARD' && (
                    <div className="p-6 bg-zinc-50/50 border-b border-zinc-200">
                      {!isValidKey ? (
                        <div className="text-red-500 text-xs text-center font-bold p-4 bg-red-50 rounded border border-red-200">
                          Chave do Stripe ausente ou inválida. Contate o suporte.
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {/* Card Number Input (Stripe Native) */}
                          <div className="border border-zinc-300 rounded-sm bg-white p-3.5 focus-within:border-zinc-500 focus-within:ring-1 focus-within:ring-zinc-500 transition-all">
                            <CardNumberElement options={CARD_ELEMENT_OPTIONS} />
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            {/* Card Expiry Input */}
                            <div className="border border-zinc-300 rounded-sm bg-white p-3.5 focus-within:border-zinc-500 focus-within:ring-1 focus-within:ring-zinc-500 transition-all">
                              <CardExpiryElement options={CARD_ELEMENT_OPTIONS} />
                            </div>
                            {/* Card CVC Input */}
                            <div className="border border-zinc-300 rounded-sm bg-white p-3.5 focus-within:border-zinc-500 focus-within:ring-1 focus-within:ring-zinc-500 transition-all">
                              <CardCvcElement options={CARD_ELEMENT_OPTIONS} />
                            </div>
                          </div>
                          
                          <div className="pt-2">
                             <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-2 block">Parcelas</label>
                             <select className="w-full border border-zinc-300 p-3.5 text-sm rounded-sm bg-white focus:outline-none focus:border-zinc-500 text-zinc-800">
                               <option>1x de R$ {cartTotal().toFixed(2).replace('.', ',')} sem juros</option>
                               <option>2x de R$ {(cartTotal() / 2).toFixed(2).replace('.', ',')} sem juros</option>
                               <option>3x de R$ {(cartTotal() / 3).toFixed(2).replace('.', ',')} sem juros</option>
                             </select>
                          </div>
                          
                          <div className="flex gap-2 items-center pt-2 opacity-50">
                            <div className="w-8 h-5 bg-blue-800 rounded flex items-center justify-center text-white text-[8px] font-bold">VISA</div>
                            <div className="w-8 h-5 bg-orange-600 rounded flex items-center justify-center text-white text-[8px] font-bold">MC</div>
                            <span className="text-[10px] ml-2">Cartões processados com segurança</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* OPÇÃO PIX */}
                  <label className={`p-5 flex items-center justify-between cursor-pointer transition-colors ${paymentMethod === 'PIX' ? 'bg-zinc-50/50' : 'bg-white'}`}>
                    <div className="flex items-center gap-4">
                      <input type="radio" name="payment" checked={paymentMethod === 'PIX'} onChange={() => setPaymentMethod('PIX')} className="w-4 h-4 text-zinc-900 border-zinc-300 focus:ring-zinc-900 accent-zinc-900" />
                      <span className="font-medium text-sm">Pix</span>
                    </div>
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">PAGUE R$ {cartTotal().toFixed(2).replace('.', ',')}</span>
                  </label>
                  
                  {paymentMethod === 'PIX' && (
                    <div className="p-6 bg-zinc-50/50 text-sm text-zinc-600 border-t border-zinc-200">
                       Ao finalizar o pedido, mostraremos a chave PIX para você realizar o pagamento no aplicativo do seu banco de forma rápida e segura.
                    </div>
                  )}
                </div>

                {error && <div className="p-4 mt-6 bg-red-50 text-red-600 border border-red-200 text-sm font-medium rounded-sm">{error}</div>}

                <div className="mt-8 flex justify-end">
                  <button 
                    type="submit"
                    disabled={loading || (paymentMethod === 'CARD' && !isValidKey)}
                    className="w-full md:w-auto px-12 bg-[#C2A3A1] hover:bg-[#b09290] disabled:bg-zinc-400 text-white font-medium text-sm py-4 rounded-sm transition-colors uppercase tracking-widest"
                  >
                    {loading ? "Processando..." : "Fazer pedido"}
                  </button>
                </div>

              </div>
            )}
          </form>
        </div>

        {/* Lado Direito - Resumo do Pedido (Desktop Fixo) */}
        <div className="w-full md:w-[35%]">
           <div className="bg-[#F9F8F6] p-6 sticky top-10 border border-zinc-200/50 rounded-sm">
              
              <div className="flex flex-col gap-4 mb-6">
                {items.map(item => (
                  <div key={item.id} className="flex gap-4 items-center">
                    <div className="relative w-16 h-16 bg-zinc-100 shrink-0 border border-zinc-200 rounded-sm overflow-hidden">
                      <Image src={item.image} alt={item.name} fill className="object-cover mix-blend-multiply" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xs text-zinc-900 font-medium">{item.name}</h3>
                      <p className="text-[10px] text-zinc-500 uppercase mt-1 tracking-wider">Tam: {item.size} × {item.quantity}</p>
                    </div>
                    <p className="text-xs font-medium text-zinc-900">R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}</p>
                  </div>
                ))}
              </div>
              
              <div className="border-t border-zinc-200 pt-4 mb-4">
                <div className="flex justify-between items-center mb-3 text-xs text-zinc-600">
                   <span>Subtotal</span>
                   <span>R$ {cartTotal().toFixed(2).replace('.', ',')}</span>
                </div>
                <div className="flex justify-between items-center text-xs text-zinc-600">
                   <span>Custo de frete</span>
                   <span className="font-bold text-green-600">Grátis</span>
                </div>
              </div>
              
              <div className="border-t border-zinc-200 pt-4 flex justify-between items-center">
                 <span className="text-sm font-medium text-zinc-900">Total</span>
                 <span className="text-xl text-zinc-900">R$ {cartTotal().toFixed(2).replace('.', ',')}</span>
              </div>
              
           </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  const { items } = useCartStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || items.length === 0) return null;

  if (!isValidKey || !stripePromise) {
    return <CheckoutContent />;
  }

  // Com inputs individuais, o Elements não precisa esperar o clientSecret para montar.
  return (
    <Elements 
      stripe={stripePromise} 
      options={{ 
        fonts: [{ cssSrc: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap' }] 
      }}
    >
      <CheckoutContent />
    </Elements>
  );
}
