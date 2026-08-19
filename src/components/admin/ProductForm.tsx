"use client";

import { useState } from "react";
import Image from "next/image";
import SubmitButton from "./SubmitButton";

type SizeColorStock = {
  size: string;
  color: string;
  stock: number;
};

export default function ProductForm({ initialData = null, action, categories = [] }: { initialData?: any, action: (formData: FormData) => void, categories?: { id: string; name: string }[] }) {
  const [images, setImages] = useState<File[]>([]);
  const hasImagesArray = initialData?.images && initialData.images.length > 0;
  const initialUrls = hasImagesArray ? initialData.images : (initialData?.image ? [initialData.image] : []);
  const [previewUrls, setPreviewUrls] = useState<string[]>(initialUrls);
  
  // Default sizes
  const defaultSizes = ["PP", "P", "M", "G", "GG"];
  
  // Parse initial data for variants
  const initialVariants: SizeColorStock[] = initialData?.sizes?.map((s: any) => ({
    size: s.size,
    color: s.color || "Padrão",
    stock: s.stock
  })) || [];

  const [variants, setVariants] = useState<SizeColorStock[]>(initialVariants);
  const [selectedSize, setSelectedSize] = useState<string>("P");
  const [newColor, setNewColor] = useState<string>("Padrão");
  const [newStock, setNewStock] = useState<number>(1);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const fileArray = Array.from(e.target.files);
      setImages(prev => [...prev, ...fileArray]);
      
      const newUrls = fileArray.map(f => URL.createObjectURL(f));
      setPreviewUrls(prev => [...prev, ...newUrls]);
    }
  };

  const removeImage = (index: number) => {
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
    // If it's a new file, remove from images array
    if (index >= (initialData?.images?.length || 0)) {
      const adjustedIndex = index - (initialData?.images?.length || 0);
      setImages(prev => prev.filter((_, i) => i !== adjustedIndex));
    }
  };

  const addVariant = () => {
    if (newStock > 0) {
      setVariants(prev => [...prev, { size: selectedSize, color: newColor.trim() || "Padrão", stock: newStock }]);
      setNewColor("Padrão");
      setNewStock(1);
    }
  };

  const removeVariant = (index: number) => {
    setVariants(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <form action={(formData) => {
      // Append complex data before submitting
      formData.append("variants", JSON.stringify(variants));
      formData.append("existingImages", JSON.stringify(previewUrls.filter(url => !url.startsWith("blob:"))));
      images.forEach(img => formData.append("newImages", img));
      action(formData);
    }} className="flex flex-col gap-8">
      
      {/* 1. Imagens (Múltiplas) */}
      <section className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-zinc-100 flex flex-col gap-6">
        <h3 className="text-lg font-medium text-zinc-900 border-b border-zinc-100 pb-4 mb-2">Fotos do Produto</h3>
        
        {previewUrls.length > 0 && (
          <div className="flex flex-wrap gap-4 mb-4">
            {previewUrls.map((url, i) => (
              <div key={i} className="relative w-24 h-32 rounded-lg overflow-hidden border border-zinc-200 shadow-sm">
                <Image src={url} alt={`Preview ${i}`} fill className="object-cover" />
                <button type="button" onClick={() => removeImage(i)} className="absolute top-1 right-1 bg-black/50 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-500 transition-colors">
                  &times;
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="relative border border-dashed border-zinc-300 rounded-xl p-4 hover:bg-zinc-50 hover:border-zinc-400 transition-colors group cursor-pointer flex items-center justify-between gap-4">
          <input 
            type="file" 
            accept="image/*"
            multiple
            onChange={handleImageChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          />
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-zinc-100 rounded-lg flex items-center justify-center text-zinc-400 group-hover:text-zinc-600 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-zinc-700">Adicionar mais imagens</p>
            </div>
          </div>
          <span className="text-xs font-bold text-zinc-500 bg-zinc-100 px-3 py-1.5 rounded-full group-hover:bg-black group-hover:text-white transition-colors">Procurar</span>
        </div>
      </section>

      {/* 2. Básicas */}
      <section className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-zinc-100 flex flex-col gap-6">
        <h3 className="text-lg font-medium text-zinc-900 border-b border-zinc-100 pb-4 mb-2">Informações Básicas</h3>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-zinc-700">Nome da peça</label>
          <input name="name" type="text" required defaultValue={initialData?.name} placeholder="Ex: Vestido Floral Midi" className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white outline-none" />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-zinc-700">Descrição e detalhes</label>
          <textarea name="description" rows={4} defaultValue={initialData?.description} className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white outline-none resize-none" />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-zinc-700">Categoria (Opcional)</label>
          <select name="categoryId" defaultValue={initialData?.categoryId || ""} className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white outline-none">
            <option value="">Sem categoria</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-zinc-700">Preço atual (R$)</label>
            <input name="price" type="text" required defaultValue={initialData?.price?.toFixed(2).replace('.', ',')} placeholder="0,00" className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white outline-none" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-zinc-700">Preço antigo</label>
            <input name="oldPrice" type="text" defaultValue={initialData?.oldPrice?.toFixed(2).replace('.', ',')} placeholder="0,00" className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white outline-none" />
          </div>
        </div>
      </section>

      {/* 3. Estoque e Cores */}
      <section className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-zinc-100 flex flex-col gap-6">
        <div className="flex justify-between items-center border-b border-zinc-100 pb-4 mb-2">
          <h3 className="text-lg font-medium text-zinc-900">Grade de Tamanhos e Cores</h3>
        </div>

        {variants.length > 0 && (
          <div className="flex flex-col gap-2 mb-4">
            {variants.map((v, i) => (
              <div key={i} className="flex items-center justify-between p-3 border border-zinc-100 rounded-xl bg-zinc-50/50">
                <div className="flex gap-4 items-center">
                  <span className="w-8 h-8 flex items-center justify-center bg-white border border-zinc-200 rounded-lg text-xs font-bold shadow-sm">{v.size}</span>
                  <span className="text-sm font-medium text-zinc-700">{v.color}</span>
                </div>
                <div className="flex gap-4 items-center">
                  <span className="text-xs font-bold text-zinc-500">{v.stock} unid.</span>
                  <button type="button" onClick={() => removeVariant(i)} className="text-red-500 hover:text-red-700 p-1">
                    &times;
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 flex flex-col gap-4">
          <p className="text-xs font-bold text-amber-800 uppercase tracking-wider">Adicionar Estoque à Grade</p>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
            <div className="flex flex-col gap-2 md:col-span-3">
              <label className="text-[11px] font-semibold text-zinc-600">Tamanho</label>
              <select value={selectedSize} onChange={(e) => setSelectedSize(e.target.value)} className="p-2.5 bg-white border border-zinc-200 rounded-lg outline-none text-sm font-medium">
                {defaultSizes.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-2 md:col-span-4">
              <label className="text-[11px] font-semibold text-zinc-600">Cor (ex: Vermelha, Padrão)</label>
              <input type="text" value={newColor} onChange={(e) => setNewColor(e.target.value)} placeholder="Branca" className="p-2.5 bg-white border border-zinc-200 rounded-lg outline-none text-sm" />
            </div>
            <div className="flex flex-col gap-2 md:col-span-2">
              <label className="text-[11px] font-semibold text-zinc-600">Qtd</label>
              <input type="number" min="1" value={newStock} onChange={(e) => setNewStock(parseInt(e.target.value) || 1)} className="p-2.5 bg-white border border-zinc-200 rounded-lg outline-none text-sm text-center" />
            </div>
            <div className="md:col-span-3">
              <button type="button" onClick={addVariant} className="w-full bg-black text-white px-3 py-2.5 rounded-lg text-xs tracking-widest font-bold hover:bg-zinc-800 transition-colors uppercase border border-black h-full flex items-center justify-center">
                Adicionar +
              </button>
            </div>
          </div>
          <p className="text-[10px] text-amber-700 italic">Preencha o tamanho/cor e clique em "Adicionar +" para inserir na grade antes de salvar o produto.</p>
        </div>
      </section>

      {/* 4. Visibilidade */}
      <section className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-zinc-100 flex flex-col gap-6">
        <h3 className="text-lg font-medium text-zinc-900 border-b border-zinc-100 pb-4 mb-2">Visibilidade e Etiquetas</h3>
        <div className="flex flex-col gap-4">
          <label className="flex items-center justify-between p-4 border border-zinc-100 rounded-xl cursor-pointer hover:bg-zinc-50">
            <span className="font-medium text-sm text-zinc-900">Salvar como Rascunho (Oculto na loja)</span>
            <input type="checkbox" name="isDraft" value="true" defaultChecked={initialData?.isDraft} className="w-5 h-5 accent-zinc-500" />
          </label>
          <label className="flex items-center justify-between p-4 border border-zinc-100 rounded-xl cursor-pointer hover:bg-zinc-50">
            <span className="font-medium text-sm text-zinc-900">Novidade</span>
            <input type="checkbox" name="isNew" value="true" defaultChecked={initialData?.isNew} className="w-5 h-5 accent-black" />
          </label>
          <label className="flex items-center justify-between p-4 border border-zinc-100 rounded-xl cursor-pointer hover:bg-zinc-50">
            <span className="font-medium text-sm text-zinc-900">Atacado</span>
            <input type="checkbox" name="isWholesale" value="true" defaultChecked={initialData?.isWholesale} className="w-5 h-5 accent-amber-500" />
          </label>
          <label className="flex items-center justify-between p-4 border border-zinc-100 rounded-xl cursor-pointer hover:bg-zinc-50">
            <span className="font-medium text-sm text-zinc-900">Promoção</span>
            <input type="checkbox" name="isPromotion" value="true" defaultChecked={initialData?.isPromotion} className="w-5 h-5 accent-red-500" />
          </label>
        </div>
      </section>

      <div className="flex justify-end pt-4">
        <SubmitButton text={initialData ? 'Salvar Alterações' : 'Criar Produto'} />
      </div>
    </form>
  );
}
