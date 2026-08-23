'use client'

import { useCartStore } from "@/contexts/CartContext";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardNumberElement, CardExpiryElement, CardCvcElement, useStripe, useElements } from "@stripe/react-stripe-js";

const STRIPE_PK = (process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY || process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || process.env.STRIPE_PUBLIC_KEY || "").trim();
const rawKey = STRIPE_PK;
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
    zipcode: "", street: "", number: "", complement: "", neighborhood: "", city: "", state: "",
    cardName: "", country: "BR", saveInfo: false
  });
  const numberInputRef = useRef<HTMLInputElement>(null);
  
  const [paymentMethod, setPaymentMethod] = useState<'PIX' | 'CARD'>('CARD');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [shippingOptions, setShippingOptions] = useState<any[]>([]);
  const [shippingLoading, setShippingLoading] = useState(false);
  const [selectedShipping, setSelectedShipping] = useState<any>(null);
  
  const shippingCost = selectedShipping ? selectedShipping.price : 0;
  
  useEffect(() => {
    const cep = formData.zipcode.replace(/\D/g, '');
    if (cep.length === 8) {
      setShippingLoading(true);

      // 1. Busca Endereço no ViaCEP
      fetch(`https://viacep.com.br/ws/${cep}/json/`)
        .then(res => res.json())
        .then(data => {
          if (!data.erro) {
            setFormData(prev => ({
              ...prev,
              street: data.logradouro || prev.street,
              neighborhood: data.bairro || prev.neighborhood,
              city: data.localidade || prev.city,
              state: data.uf || prev.state
            }));
            if (numberInputRef.current) {
              numberInputRef.current.focus();
            }
          }
        })
        .catch(console.error);

      // 2. Frete Manual Fixo via WhatsApp
      setShippingLoading(true);
      setTimeout(() => {
        let title = "Frete Nacional Brasil";
        if (cep.startsWith('60') || cep.startsWith('61')) {
           title = "Frete para Fortaleza ou região metropolitana - Retirada ou Motoboy";
        }
        
        const option = {
          id: 'whatsapp-combinar',
          name: 'Combinar via WhatsApp',
          company: title,
          price: 0,
          delivery_time: 0,
          currency: 'BRL'
        };
        
        setShippingOptions([option]);
        setSelectedShipping(option);
        setShippingLoading(false);
      }, 500); // Simulando loading para o usuário ver
    } else {
      setShippingOptions([]);
    }
  }, [formData.zipcode, items]);
  
  // Nuvemshop style steps: 1 = Contato, 2 = Entrega, 3 = Pagamento
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  useEffect(() => {
    if (items.length === 0) {
      router.push("/");
    }
  }, [items, router]);

  useEffect(() => {
    const saved = localStorage.getItem('useMariaCheckoutData');
    if (saved) {
      try {
        setFormData(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let { name, value } = e.target;
    
    // Máscara de CEP
    if (name === 'zipcode') {
      value = value.replace(/\D/g, '');
      if (value.length > 5) {
        value = value.replace(/^(\d{5})(\d)/, '$1-$2');
      }
      if (value.length > 9) {
        value = value.substring(0, 9);
      }
    }
    
    const newData = { ...formData, [name]: value };
    setFormData(newData);
    localStorage.setItem('useMariaCheckoutData', JSON.stringify(newData));
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

    if (!selectedShipping) {
      setError("Por favor, selecione uma opção de frete antes de finalizar a compra.");
      setLoading(false);
      return;
    }

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
          cartId: useCartStore.getState().cartId,
          customer: { name: formData.name, email: formData.email, phone: formData.phone, cpf: formData.document },
          address: {
            zipcode: formData.zipcode,
            street: formData.street,
            number: formData.number,
            complement: formData.complement,
            neighborhood: formData.neighborhood,
            city: formData.city,
            state: formData.state
          },
          items: items.map(i => ({ productId: i.productId, size: i.size, quantity: i.quantity, price: i.price })),
          total: cartTotal() + shippingCost,
          paymentMethod,
          shipping: { method: selectedShipping.name, cost: shippingCost, company: selectedShipping.company, serviceId: selectedShipping.id?.toString() }
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao gerar pedido no servidor.");
      }
      
      if (paymentMethod === 'PIX') {
        clearCart();
        router.push(`/checkout/sucesso?orderId=${data.orderId}&method=PIX`);
      } else if (paymentMethod === 'CARD' && stripe && elements) {
        const cardElement = elements.getElement(CardNumberElement);
        if (!cardElement) throw new Error("Preencha os dados do cartão.");

        // 2. Confirm the payment with Stripe natively
        const { error: confirmError } = await stripe.confirmCardPayment(data.clientSecret, {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: formData.cardName || formData.name,
              email: formData.email,
              phone: formData.phone,
              address: { country: formData.country }
            }
          }
        });

        if (confirmError) {
          // Send error to backend to show in admin panel
          await fetch('/api/checkout/confirm', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId: data.orderId, status: 'FAILED', errorMsg: confirmError.message })
          }).catch(() => {}); // Ignore fail
          throw new Error(confirmError.message);
        }
        
        // Tell backend payment is PAID
        await fetch('/api/checkout/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId: data.orderId, status: 'PAID' })
        });

        clearCart();
        router.push(`/checkout/sucesso?orderId=${data.orderId}&method=CARD`);
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
    disableLink: true,
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
                      <input required name="phone" type="tel" placeholder="Telefone / WhatsApp" value={formData.phone} onChange={handleInputChange} className="w-full border border-zinc-300 p-3.5 text-sm rounded-sm bg-white focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition-all placeholder:text-zinc-400" />
                      <input required name="document" type="tel" placeholder="CPF ou CNPJ" value={formData.document} onChange={handleInputChange} className="w-full border border-zinc-300 p-3.5 text-sm rounded-sm bg-white focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition-all placeholder:text-zinc-400" />
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
                      <input required name="zipcode" type="tel" placeholder="CEP" value={formData.zipcode} onChange={handleInputChange} className="w-full border border-zinc-300 p-3.5 text-sm rounded-sm bg-white focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition-all placeholder:text-zinc-400" />
                      
                      <div className="grid grid-cols-4 gap-4">
                        <input required name="street" placeholder="Rua / Avenida" value={formData.street} onChange={handleInputChange} className="col-span-3 border border-zinc-300 p-3.5 text-sm rounded-sm bg-white focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition-all placeholder:text-zinc-400" />
                        <input required name="number" type="tel" ref={numberInputRef} placeholder="Número" value={formData.number} onChange={handleInputChange} className="col-span-1 border border-zinc-300 p-3.5 text-sm rounded-sm bg-white focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition-all placeholder:text-zinc-400" />
                      </div>
                      
                      <input name="complement" placeholder="Apto, Bloco, Referência (opcional)" value={formData.complement} onChange={handleInputChange} className="w-full border border-zinc-300 p-3.5 text-sm rounded-sm bg-white focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition-all placeholder:text-zinc-400" />
                      
                      <div className="grid grid-cols-3 gap-4 mb-6">
                        <input required name="neighborhood" placeholder="Bairro" value={formData.neighborhood} onChange={handleInputChange} className="border border-zinc-300 p-3.5 text-sm rounded-sm bg-white focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition-all placeholder:text-zinc-400" />
                        <input required name="city" placeholder="Cidade" value={formData.city} onChange={handleInputChange} className="border border-zinc-300 p-3.5 text-sm rounded-sm bg-white focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition-all placeholder:text-zinc-400" />
                        <input required name="state" placeholder="Estado (UF)" value={formData.state} onChange={handleInputChange} className="border border-zinc-300 p-3.5 text-sm rounded-sm bg-white focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition-all placeholder:text-zinc-400" />
                      </div>
                      
                      {/* Opções de Frete (Dinâmicas) */}
                      {formData.zipcode.replace(/\D/g, '').length === 8 && (
                        <div className="border-t border-zinc-200 pt-6 mt-6">
                          <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-4">Opções de Frete</h3>
                          {shippingLoading ? (
                            <div className="text-sm text-zinc-500 animate-pulse">Calculando frete...</div>
                          ) : shippingOptions.length > 0 ? (
                            <div className="space-y-3">
                              {shippingOptions.map(option => (
                                <label key={option.id} className={`p-4 flex items-center justify-between cursor-pointer border rounded-sm transition-colors ${selectedShipping?.id === option.id ? 'border-zinc-900 bg-zinc-50' : 'border-zinc-200 bg-white'}`}>
                                  <div className="flex items-center gap-3">
                                    <input 
                                      type="radio" 
                                      name="shipping" 
                                      checked={selectedShipping?.id === option.id} 
                                      onChange={() => setSelectedShipping(option)} 
                                      className="w-4 h-4 text-zinc-900 accent-zinc-900" 
                                    />
                                    <div>
                                      <span className="font-bold text-sm block">{option.company}</span>
                                      <span className="text-xs text-zinc-500">{option.name}</span>
                                    </div>
                                  </div>
                                  <span className="text-sm font-medium">R$ {option.price.toFixed(2).replace('.', ',')}</span>
                                </label>
                              ))}
                            </div>
                          ) : (
                            <div className="text-sm text-zinc-500">Não foi possível calcular o frete para este CEP.</div>
                          )}
                        </div>
                      )}
                      
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
                  
                  {/* OPÇÃO CARTÃO DE CRÉDITO - ESTILO STRIPE NATIVO */}
                  <label className={`p-5 flex items-center justify-between cursor-pointer border-b border-zinc-200 transition-colors ${paymentMethod === 'CARD' ? 'bg-zinc-50/30' : 'bg-white'}`}>
                    <div className="flex items-center gap-3">
                      <input type="radio" name="payment" checked={paymentMethod === 'CARD'} onChange={() => { setPaymentMethod('CARD'); setError(null); }} className="w-4 h-4 text-blue-600 border-zinc-300 focus:ring-blue-600 accent-blue-600" />
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-zinc-700" fill="currentColor" viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.89 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/></svg>
                        <span className="font-bold text-sm text-zinc-800">Cartão</span>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">Aprovação imediata</span>
                  </label>
                  
                  {paymentMethod === 'CARD' && (
                    <div className="p-6 bg-white border-b border-zinc-200">
                      {!isValidKey ? (
                        <div className="text-red-500 text-xs text-center font-bold p-4 bg-red-50 rounded border border-red-200">
                          Chave do Stripe ausente ou inválida. Contate o suporte.
                        </div>
                      ) : (
                        <div className="space-y-5">
                          
                          <div>
                            <label className="text-sm text-zinc-600 font-medium mb-2 block">Dados do cartão</label>
                            
                            {/* AGRUPAMENTO DE CAMPOS STRIPE STYLE */}
                            <div className="border border-zinc-300 rounded shadow-sm bg-white focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 overflow-hidden transition-all">
                              
                              {/* Número do Cartão */}
                              <div className="p-3 border-b border-zinc-200 relative flex items-center">
                                <div className="flex-1">
                                  <CardNumberElement options={{ ...CARD_ELEMENT_OPTIONS, style: { base: { fontSize: '15px', color: '#333' } } }} />
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                                  {/* Visa SVG */}
                                  <svg className="w-8 h-5" viewBox="0 0 32 20" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="32" height="20" rx="3" fill="#fff" stroke="#e5e7eb"/><path d="M12.65 14h2.15l1.36-8.52h-2.16L12.65 14zM21.36 5.82c-.37-.17-.97-.33-1.67-.33-1.85 0-3.15.98-3.16 2.4-.02 1.04.93 1.56 1.63 1.9.72.35.96.57.96.87 0 .47-.56.69-1.09.69-.73 0-1.23-.1-1.78-.35l-.25-.12-.31 1.9c.43.2 1.23.36 2.05.37 1.98 0 3.26-.97 3.28-2.48.01-1.1-.95-1.61-1.68-1.96-.65-.32-1.05-.53-1.05-.85 0-.42.48-.69 1.06-.69.58 0 .98.12 1.39.3l.17.08.31-1.73zM24.1 14h2.06l-1.77-8.52h-1.61c-.42 0-.77.24-.95.63L18.5 14h2.27l.45-1.25h2.78l.26 1.25h-.16zm-1.94-2.93l1.14-3.15 1.37 3.15h-2.51zM10.63 5.56H9.01c-.49 0-.86.28-1.05.72L4.56 14h2.28l.45-1.27h2.79l.26 1.27h2.19l-1.9-8.44z" fill="#1434CB"/></svg>
                                  {/* MC SVG */}
                                  <svg className="w-8 h-5" viewBox="0 0 32 20"><rect width="32" height="20" rx="3" fill="#141413"/><circle cx="11.5" cy="10" r="5.5" fill="#EB001B"/><circle cx="20.5" cy="10" r="5.5" fill="#F79E1B"/><path d="M16 14.53A5.49 5.49 0 0113.5 10c0-1.78.85-3.36 2.5-4.53a5.49 5.49 0 010 9.06z" fill="#FF5F00"/></svg>
                                </div>
                              </div>
                              
                              {/* Validade e CVC (Grid 50/50) */}
                              <div className="grid grid-cols-2 divide-x divide-zinc-200 bg-zinc-50/30">
                                <div className="p-3">
                                  <CardExpiryElement options={{ ...CARD_ELEMENT_OPTIONS, style: { base: { fontSize: '15px', color: '#333' } } }} />
                                </div>
                                <div className="p-3 flex items-center">
                                  <div className="flex-1">
                                    <CardCvcElement options={{ ...CARD_ELEMENT_OPTIONS, style: { base: { fontSize: '15px', color: '#333' } } }} />
                                  </div>
                                  <svg className="w-6 h-4 ml-2 text-zinc-400 shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.89 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-5 12H4v-2h11v2zm5 0h-3v-2h3v2z"/></svg>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Nome do Titular */}
                          <div>
                            <label className="text-sm text-zinc-600 font-medium mb-1 block">Nome do titular do cartão</label>
                            <input 
                              type="text" 
                              name="cardName" 
                              placeholder="Nome completo" 
                              value={formData.cardName} 
                              onChange={handleInputChange} 
                              className="w-full border border-zinc-300 rounded p-3 text-[15px] text-zinc-800 bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-sm placeholder:text-zinc-400" 
                            />
                          </div>

                          {/* País/Região */}
                          <div>
                            <label className="text-sm text-zinc-600 font-medium mb-1 block">País ou região</label>
                            <select 
                              name="country" 
                              value={formData.country} 
                              onChange={handleInputChange as any} 
                              className="w-full border border-zinc-300 rounded p-3 text-[15px] text-zinc-800 bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-sm appearance-none"
                            >
                              <option value="BR">Brasil</option>
                              <option value="US">Estados Unidos</option>
                              <option value="PT">Portugal</option>
                            </select>
                          </div>
                          
                          {/* Parcelas (Oculto na foto da Stripe, mas útil manter o seletor visualmente discreto) */}
                          <div className="pt-2">
                             <select className="w-full border border-zinc-300 p-3 text-sm rounded bg-white text-zinc-600 focus:outline-none focus:border-blue-500 shadow-sm">
                               <option>1x de R$ {(cartTotal() + shippingCost).toFixed(2).replace('.', ',')} sem juros</option>
                               <option>2x de R$ {((cartTotal() + shippingCost) / 2).toFixed(2).replace('.', ',')} sem juros</option>
                               <option>3x de R$ {((cartTotal() + shippingCost) / 3).toFixed(2).replace('.', ',')} sem juros</option>
                             </select>
                          </div>

                        </div>
                      )}
                    </div>
                  )}

                  {/* OPÇÃO PIX */}
                  <label className={`p-5 flex items-center justify-between cursor-pointer transition-colors ${paymentMethod === 'PIX' ? 'bg-zinc-50/50' : 'bg-white'}`}>
                    <div className="flex items-center gap-4">
                      <input type="radio" name="payment" checked={paymentMethod === 'PIX'} onChange={() => { setPaymentMethod('PIX'); setError(null); }} className="w-4 h-4 text-zinc-900 border-zinc-300 focus:ring-zinc-900 accent-zinc-900" />
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-emerald-600" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M7.74 3L2 8.74l8.13 8.12 5.74-5.74L7.74 3zm8.52 0l-5.74 5.74 8.12 8.12L24.38 11.1 16.26 3zm-2.77 8.51l-2.96-2.96-2.96 2.96 2.96 2.96 2.96-2.96zM13.1 17.61L18.84 23.35l5.54-5.54-8.12-8.12-3.16 3.16-3.16-3.16-8.12 8.12 5.54 5.54L13.1 17.61z" fillRule="evenodd" clipRule="evenodd"/></svg>
                        <span className="font-bold text-sm text-zinc-800">PIX</span>
                      </div>
                    </div>
                  </label>
                  
                  {paymentMethod === 'PIX' && (
                    <div className="px-6 py-5 bg-zinc-50/50 border-t border-zinc-200">
                      <div className="flex gap-3">
                        <div className="text-zinc-400 mt-0.5">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        </div>
                        <div className="text-sm text-zinc-600">
                          <p className="font-medium text-zinc-800">Finalize a compra para o QR Code ser gerado na próxima etapa.</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {error && <div className="p-4 mt-6 bg-red-50 text-red-600 border border-red-200 text-sm font-medium rounded-sm">{error}</div>}

                <div className="mt-8">
                  <button 
                    type="submit"
                    disabled={loading || (paymentMethod === 'CARD' && !isValidKey)}
                    className="w-full bg-[#0070DF] hover:bg-[#005ebd] disabled:bg-zinc-400 text-white font-semibold text-[17px] py-3.5 rounded shadow-sm transition-colors"
                  >
                    {loading ? "Processando..." : "Finalizar Compra"}
                  </button>
                  <p className="text-xs text-center text-zinc-500 mt-4 leading-relaxed px-4">
                    Ao confirmar o pedido, você autoriza a Use Maria a processar o pagamento com segurança.
                  </p>
                </div>

              </div>
            )}
          </form>
        </div>

        {/* Lado Direito - Resumo do Pedido (Desktop Fixo) */}
        <div className="w-full md:w-[35%]">
           <div className="bg-[#F9F8F6] p-6 sticky top-10 border border-zinc-200/50 rounded-sm">
              
              <div className="flex flex-col gap-4 mb-6">
                {items.map(item => {
                  const isWholesale = items.reduce((count, i) => count + i.quantity, 0) >= 10;
                  const itemPrice = isWholesale ? (item.wholesalePrice || 34.90) : item.price;
                  return (
                    <div key={item.id} className="flex gap-4 items-center">
                      <div className="relative w-16 h-16 bg-zinc-100 shrink-0 border border-zinc-200 rounded-sm overflow-hidden">
                        <Image src={item.image} alt={item.name} fill className="object-cover mix-blend-multiply" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xs text-zinc-900 font-medium">{item.name}</h3>
                        <p className="text-[10px] text-zinc-500 uppercase mt-1 tracking-wider">Tam: {item.size} × {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        {isWholesale && (
                           <p className="text-[10px] text-zinc-400 line-through">R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}</p>
                        )}
                        <p className="text-xs font-medium text-zinc-900">R$ {(itemPrice * item.quantity).toFixed(2).replace('.', ',')}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div className="border-t border-zinc-200 pt-4 mb-4">
                <div className="flex justify-between items-center mb-3 text-xs text-zinc-600">
                   <span>Subtotal</span>
                   <span>R$ {cartTotal().toFixed(2).replace('.', ',')}</span>
                </div>
                <div className="flex justify-between items-center text-xs text-zinc-600">
                   <span>Custo de frete</span>
                   {selectedShipping ? (
                     <span className="font-bold text-zinc-900">R$ {shippingCost.toFixed(2).replace('.', ',')}</span>
                   ) : (
                     <span className="text-zinc-400 italic">A calcular</span>
                   )}
                </div>
              </div>
              
              <div className="border-t border-zinc-200 pt-4 flex justify-between items-center">
                 <span className="text-sm font-medium text-zinc-900">Total</span>
                 <span className="text-xl text-zinc-900">R$ {(cartTotal() + shippingCost).toFixed(2).replace('.', ',')}</span>
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
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-red-100 p-8 rounded-xl max-w-lg text-center border border-red-300">
          <h2 className="text-xl font-bold text-red-700 mb-4">Erro Crítico de Configuração</h2>
          <p className="text-red-900 font-medium mb-4">
            A chave pública da Stripe (pk_live_...) não foi encontrada na Vercel. 
          </p>
          <p className="text-red-800 text-sm">
            Para o desenvolvedor/admin: Verifique se você criou a variável chamada <strong>NEXT_PUBLIC_STRIPE_PUBLIC_KEY</strong> (exatamente com esse nome) no painel da Vercel e se o valor dela começa com <strong>pk_live_</strong>.
          </p>
        </div>
      </div>
    );
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
