'use client'

import { useCartStore } from "@/contexts/CartContext";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";

export default function CheckoutPage() {
  const { items, cartTotal, clearCart } = useCartStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "", email: "", phone: "", document: "",
    zipcode: "", street: "", number: "", complement: "", neighborhood: "", city: "", state: "",
  });
  const numberInputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [shippingOptions, setShippingOptions] = useState<any[]>([]);
  const [shippingLoading, setShippingLoading] = useState(false);
  const [selectedShipping, setSelectedShipping] = useState<any>(null);
  
  const shippingCost = selectedShipping ? selectedShipping.price : 0;
  
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (items.length === 0 && mounted) {
      router.push("/");
    }
  }, [items, router, mounted]);

  useEffect(() => {
    const saved = localStorage.getItem('useMariaCheckoutData');
    if (saved) {
      try {
        setFormData(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

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
      }, 500);
    } else {
      setShippingOptions([]);
    }
  }, [formData.zipcode, items]);
  
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);

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
    }
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!selectedShipping) {
      setError("Por favor, selecione uma opção de frete antes de finalizar o pedido.");
      setLoading(false);
      return;
    }

    try {
      // 1. Create order on backend (Status PENDING)
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
          items: items.map(i => ({ productId: i.productId, size: i.size, quantity: i.quantity, price: i.price, name: i.name })),
          total: cartTotal() + shippingCost,
          paymentMethod: 'WHATSAPP',
          shipping: { method: selectedShipping.name, cost: shippingCost, company: selectedShipping.company, serviceId: selectedShipping.id?.toString() }
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao gerar pedido no servidor.");
      }

      // 2. Build WhatsApp message
      const orderIdShort = data.orderId.slice(-6).toUpperCase();
      let msg = `Olá! Gostaria de finalizar o meu pedido.\n\n`;
      msg += `*NOME:* ${formData.name}\n\n`;

      msg += `*📍 ENDEREÇO*\n`;
      msg += `${formData.street}, ${formData.number} ${formData.complement ? '- ' + formData.complement : ''}\n`;
      msg += `${formData.neighborhood} - ${formData.city}/${formData.state}\n`;
      msg += `CEP: ${formData.zipcode}\n\n`;

      msg += `*🛍️ PEDIDO*\n`;
      items.forEach(item => {
        msg += `${item.quantity}x ${item.name} (Tam: ${item.size})\n`;
      });
      msg += `\n*VALOR:* R$ ${(cartTotal() + shippingCost).toFixed(2).replace('.', ',')}\n\n`;

      msg += `🔗 *Ver detalhes no sistema:*\n`;
      msg += `https://lojausemaria.com.br/admin/vendas/${data.orderId}`;

      // Clear Cart and Redirect
      clearCart();
      const encodedMsg = encodeURIComponent(msg);
      window.location.href = `https://wa.me/5585992659192?text=${encodedMsg}`;
      
    } catch (err: any) {
      setError(err.message || "Ocorreu um erro ao processar seu pedido.");
      setLoading(false);
    }
  };

  if (!mounted || items.length === 0) return null;

  return (
    <div className="min-h-screen bg-[#F9F8F6] font-sans pb-20 relative text-zinc-800">
      
      {/* Header Centralizado */}
      <header className="bg-white border-b border-zinc-200 py-6 text-center">
        <Link href="/" className="text-2xl font-serif tracking-[0.2em] font-bold inline-block">USE MARIA</Link>
      </header>

      <div className="max-w-6xl mx-auto px-4 md:px-8 mt-10 flex flex-col md:flex-row gap-10">
        
        {/* Lado Esquerdo - Formulário em Etapas */}
        <div className="flex-1 max-w-2xl w-full">
          
          {/* Progress Bar (Estilo Nuvemshop) */}
          <div className="flex items-center justify-between relative mb-12 px-2 max-w-sm mx-auto">
            <div className="absolute top-1/2 left-0 w-full h-[1px] bg-zinc-200 -z-10"></div>
            {/* Carrinho (Sempre completo) */}
            <div className="flex flex-col items-center bg-[#F9F8F6] px-2 cursor-pointer" onClick={() => router.push('/')}>
              <div className="w-6 h-6 rounded-full border border-zinc-300 bg-white flex items-center justify-center mb-2">
                <svg className="w-3 h-3 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
              </div>
              <span className="text-xs text-zinc-500">Carrinho</span>
            </div>
            {/* Contato e Entrega */}
            <div className="flex flex-col items-center bg-[#F9F8F6] px-2 cursor-pointer" onClick={() => setCurrentStep(1)}>
              <div className={`w-6 h-6 rounded-full border flex items-center justify-center mb-2 ${currentStep >= 1 ? 'border-zinc-800 bg-zinc-800 text-white' : 'border-zinc-300 bg-white text-zinc-400'}`}>
                {currentStep > 1 ? <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg> : <span className="text-[10px]">1</span>}
              </div>
              <span className={`text-xs ${currentStep >= 1 ? 'text-zinc-800 font-medium' : 'text-zinc-500'}`}>Contato</span>
            </div>
            <div className="flex flex-col items-center bg-[#F9F8F6] px-2">
              <div className={`w-6 h-6 rounded-full border flex items-center justify-center mb-2 ${currentStep === 2 ? 'border-zinc-800 bg-zinc-800 text-white' : 'border-zinc-300 bg-white text-zinc-400'}`}>
                <span className="text-[10px]">2</span>
              </div>
              <span className={`text-xs ${currentStep === 2 ? 'text-zinc-800 font-medium' : 'text-zinc-500'}`}>Entrega</span>
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

            {/* ETAPA 2: ENTREGA E FINALIZAÇÃO */}
            {currentStep === 2 && (
              <div className="mb-8 pt-4">
                <h2 className="text-lg font-normal mb-6">Entrega</h2>
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
                            <label key={option.id} className={`p-4 flex items-center justify-between cursor-pointer border rounded-sm transition-colors ${selectedShipping?.id === option.id ? 'border-emerald-600 bg-emerald-50/50' : 'border-zinc-200 bg-white'}`}>
                              <div className="flex items-center gap-3">
                                <input 
                                  type="radio" 
                                  name="shipping" 
                                  checked={selectedShipping?.id === option.id} 
                                  onChange={() => setSelectedShipping(option)} 
                                  className="w-4 h-4 text-emerald-600 accent-emerald-600" 
                                />
                                <div>
                                  <span className="font-bold text-sm block text-zinc-800">{option.company}</span>
                                  <span className="text-xs text-zinc-500 mt-1 block">
                                    Entre em contato para combinar o valor do frete de envio do produto.
                                  </span>
                                </div>
                              </div>
                              {option.price === 0 ? (
                                <span className="text-sm font-medium text-zinc-400 line-through">R$ 0,00</span>
                              ) : (
                                <span className="text-sm font-medium">R$ {option.price.toFixed(2).replace('.', ',')}</span>
                              )}
                            </label>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-zinc-500">Não foi possível calcular o frete para este CEP.</div>
                      )}
                    </div>
                  )}
                  
                  {error && <div className="p-4 mt-6 bg-red-50 text-red-600 border border-red-200 text-sm font-medium rounded-sm">{error}</div>}

                  <div className="mt-8 pt-4 border-t border-zinc-200">
                    <button 
                      type="submit"
                      disabled={loading}
                      className="w-full bg-[#128C7E] hover:bg-[#075E54] flex items-center justify-center gap-2 text-white font-semibold text-[16px] py-4 rounded-sm shadow-sm transition-colors tracking-wide uppercase"
                    >
                      {loading ? (
                        "Gerando Pedido..."
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
                          Finalizar Pedido pelo WhatsApp
                        </>
                      )}
                    </button>
                    <p className="text-xs text-center text-zinc-500 mt-4 leading-relaxed px-4">
                      Ao clicar acima, você será redirecionado para o nosso WhatsApp com os dados da sua compra para combinarmos o pagamento e o envio.
                    </p>
                  </div>
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
                  const isWholesaleActive = items.reduce((count, i) => count + i.quantity, 0) >= 10;
                  const itemPrice = (isWholesaleActive && item.isWholesaleProduct) ? (item.wholesalePrice || 45.90) : item.price;
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
                        {(isWholesaleActive && item.isWholesaleProduct) && (
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
                     shippingCost === 0 ? (
                       <span className="font-bold text-amber-600 text-[10px] uppercase">A Combinar</span>
                     ) : (
                       <span className="font-bold text-zinc-900">R$ {shippingCost.toFixed(2).replace('.', ',')}</span>
                     )
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
