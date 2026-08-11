import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const settings = await prisma.storeSettings.findUnique({
    where: { id: "default" }
  })

  // Fallback se não existir
  const defaultSettings = settings || {
    storeName: "USE MARIA",
    hero1Image: "/images/catalog/page-0001.jpg",
    hero1Subtitle: "Nova Coleção",
    hero1Title: "Vista Sua Fé",
    hero1Text: "T-shirts femininas estampadas com delicadeza e propósito. Vista-se de amor e devoção todos os dias.",
    feature1Title: "Qualidade Premium",
    feature1Text: "Algodão sustentável",
    feature2Title: "Compre no Atacado",
    feature2Text: "A partir de 10 peças",
    feature3Title: "Design Exclusivo",
    feature3Text: "Estampas católicas",
    feature4Title: "Envio para todo Brasil",
    feature4Text: "Rapidez e segurança",
    collectionTitle: "Nossas Estampas",
    collectionSubtitle: "Escolha a devoção que mais toca o seu coração.",
    editorialTitle: "Devoção em cada detalhe",
    editorialSubtitle: "Acompanhe nosso trabalho no instagram",
    hero2Image: "/images/catalog/page-0006.jpg",
    hero2Subtitle: "Escolha da Estilista",
    hero2Title: "O Look Perfeito",
    hero2Text: "Capturado por @fotografo",
    whatsappNumber: "5585994277446",
    instagramUrl: "#",
    tiktokUrl: "#",
    pixKey: "CNPJ: 00.000.000/0001-00",
    pixName: "USE MARIA OFICIAL"
  }

  async function saveSettings(formData: FormData) {
    'use server'
    
    // Converte form data para objeto
    const data = Object.fromEntries(formData.entries()) as Record<string, string>;

    await prisma.storeSettings.upsert({
      where: { id: "default" },
      update: data,
      create: { id: "default", ...data } as any
    })

    revalidatePath('/') // Revalida a home pública
    revalidatePath('/admin/configuracoes') // Revalida a página atual
  }

  return (
    <div className="w-full max-w-4xl pb-20">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-black">Configurações do Site</h1>
      </div>

      <form action={saveSettings} className="bg-white p-6 md:p-8 rounded-2xl border border-zinc-200 shadow-sm space-y-10">
        
        {/* Identidade e Contato */}
        <section>
          <h2 className="text-xl font-bold mb-6 border-b pb-3 text-zinc-900">1. Identidade & Redes Sociais</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1">Nome da Loja (Logo Texto)</label>
                <input type="text" name="storeName" defaultValue={defaultSettings.storeName} className="w-full border border-zinc-200 p-3 rounded-lg text-sm focus:outline-none focus:border-black bg-zinc-50 focus:bg-white transition-all" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1">Número do WhatsApp (Apenas Números)</label>
                <input type="text" name="whatsappNumber" defaultValue={defaultSettings.whatsappNumber} className="w-full border border-zinc-200 p-3 rounded-lg text-sm focus:outline-none focus:border-black bg-zinc-50 focus:bg-white transition-all" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1">Link do Instagram</label>
                <input type="text" name="instagramUrl" defaultValue={defaultSettings.instagramUrl} className="w-full border border-zinc-200 p-3 rounded-lg text-sm focus:outline-none focus:border-black bg-zinc-50 focus:bg-white transition-all" />
              </div>
            </div>

            <div className="space-y-4 bg-zinc-50 p-6 rounded-xl border border-zinc-100">
              <h3 className="text-sm font-bold uppercase tracking-widest mb-1 text-black">Pagamento PIX</h3>
              <p className="text-xs text-zinc-500 mb-4">Dados para o pagamento manual.</p>
              <div>
                <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1">Chave PIX</label>
                <input type="text" name="pixKey" defaultValue={defaultSettings.pixKey} placeholder="Ex: CNPJ, Email ou Celular" className="w-full border border-zinc-200 p-3 rounded-lg text-sm focus:outline-none focus:border-black transition-all" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1">Nome do Recebedor (Opcional)</label>
                <input type="text" name="pixName" defaultValue={defaultSettings.pixName} placeholder="Ex: Loja Maria LTDA" className="w-full border border-zinc-200 p-3 rounded-lg text-sm focus:outline-none focus:border-black transition-all" />
              </div>
            </div>
          </div>
        </section>

        {/* Hero 1 */}
        <section>
          <h2 className="text-xl font-bold mb-6 border-b pb-3 text-zinc-900">2. Banner Principal (Topo do Site)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className="text-xs uppercase tracking-widest text-zinc-500">Subtítulo (Pequeno, acima do título)</label>
              <input name="hero1Subtitle" defaultValue={defaultSettings.hero1Subtitle} className="border border-zinc-200 p-3 rounded-lg bg-zinc-50 focus:bg-white focus:border-black text-sm transition-all" required />
            </div>
            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className="text-xs uppercase tracking-widest text-zinc-500">Título Grande</label>
              <input name="hero1Title" defaultValue={defaultSettings.hero1Title} className="border border-zinc-200 p-3 rounded-lg bg-zinc-50 focus:bg-white focus:border-black text-lg font-serif transition-all" required />
            </div>
            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className="text-xs uppercase tracking-widest text-zinc-500">Parágrafo Descritivo</label>
              <textarea name="hero1Text" defaultValue={defaultSettings.hero1Text} rows={3} className="border border-zinc-200 p-3 rounded-lg bg-zinc-50 focus:bg-white focus:border-black text-sm transition-all" required />
            </div>
            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className="text-xs uppercase tracking-widest text-zinc-500">Caminho da Imagem Principal</label>
              <input name="hero1Image" defaultValue={defaultSettings.hero1Image} className="border border-zinc-200 p-3 rounded-lg bg-zinc-50 focus:bg-white focus:border-black text-sm transition-all" required />
            </div>
          </div>
        </section>

        {/* Features Bar */}
        <section>
          <h2 className="text-xl font-bold mb-6 border-b pb-3 text-zinc-900">3. Barra de Diferenciais (Ícones)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-zinc-50 p-6 rounded-xl border border-zinc-100">
            <div className="space-y-3">
              <div>
                <label className="text-[10px] uppercase font-bold text-zinc-400">Diferencial 1 - Título</label>
                <input name="feature1Title" defaultValue={defaultSettings.feature1Title} className="w-full border p-2 text-xs rounded mt-1" />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-zinc-400">Diferencial 1 - Subtítulo</label>
                <input name="feature1Text" defaultValue={defaultSettings.feature1Text} className="w-full border p-2 text-xs rounded mt-1" />
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] uppercase font-bold text-zinc-400">Diferencial 2 - Título</label>
                <input name="feature2Title" defaultValue={defaultSettings.feature2Title} className="w-full border p-2 text-xs rounded mt-1" />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-zinc-400">Diferencial 2 - Subtítulo</label>
                <input name="feature2Text" defaultValue={defaultSettings.feature2Text} className="w-full border p-2 text-xs rounded mt-1" />
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] uppercase font-bold text-zinc-400">Diferencial 3 - Título</label>
                <input name="feature3Title" defaultValue={defaultSettings.feature3Title} className="w-full border p-2 text-xs rounded mt-1" />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-zinc-400">Diferencial 3 - Subtítulo</label>
                <input name="feature3Text" defaultValue={defaultSettings.feature3Text} className="w-full border p-2 text-xs rounded mt-1" />
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] uppercase font-bold text-zinc-400">Diferencial 4 - Título</label>
                <input name="feature4Title" defaultValue={defaultSettings.feature4Title} className="w-full border p-2 text-xs rounded mt-1" />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-zinc-400">Diferencial 4 - Subtítulo</label>
                <input name="feature4Text" defaultValue={defaultSettings.feature4Text} className="w-full border p-2 text-xs rounded mt-1" />
              </div>
            </div>
          </div>
        </section>

        {/* Collection Section */}
        <section>
          <h2 className="text-xl font-bold mb-6 border-b pb-3 text-zinc-900">4. Títulos da Galeria de Produtos</h2>
          <div className="grid grid-cols-1 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs uppercase tracking-widest text-zinc-500">Título da Seção de Produtos</label>
              <input name="collectionTitle" defaultValue={defaultSettings.collectionTitle} className="border border-zinc-200 p-3 rounded-lg bg-zinc-50 focus:bg-white focus:border-black text-sm transition-all" required />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs uppercase tracking-widest text-zinc-500">Subtítulo da Seção</label>
              <input name="collectionSubtitle" defaultValue={defaultSettings.collectionSubtitle} className="border border-zinc-200 p-3 rounded-lg bg-zinc-50 focus:bg-white focus:border-black text-sm transition-all" required />
            </div>
          </div>
        </section>

        {/* Editorial Section */}
        <section>
          <h2 className="text-xl font-bold mb-6 border-b pb-3 text-zinc-900">5. Seção Editorial (Instagram)</h2>
          <div className="grid grid-cols-1 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs uppercase tracking-widest text-zinc-500">Título Editorial</label>
              <input name="editorialTitle" defaultValue={defaultSettings.editorialTitle} className="border border-zinc-200 p-3 rounded-lg bg-zinc-50 focus:bg-white focus:border-black text-sm transition-all" required />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs uppercase tracking-widest text-zinc-500">Subtítulo Editorial</label>
              <input name="editorialSubtitle" defaultValue={defaultSettings.editorialSubtitle} className="border border-zinc-200 p-3 rounded-lg bg-zinc-50 focus:bg-white focus:border-black text-sm transition-all" required />
            </div>
          </div>
        </section>

        {/* Fix for unused fields in prisma from before, but let's keep them hidden if unused on site, or add them here. 
            Currently hero2 is not deeply used on the new clean design, but we keep it saved. */}
        <input type="hidden" name="tiktokUrl" value={defaultSettings.tiktokUrl} />
        <input type="hidden" name="hero2Title" value={defaultSettings.hero2Title} />
        <input type="hidden" name="hero2Subtitle" value={defaultSettings.hero2Subtitle} />
        <input type="hidden" name="hero2Text" value={defaultSettings.hero2Text} />
        <input type="hidden" name="hero2Image" value={defaultSettings.hero2Image} />

        <div className="pt-6">
          <button type="submit" className="w-full bg-zinc-900 text-white font-bold tracking-widest uppercase text-sm py-5 rounded-xl hover:bg-black transition-colors shadow-lg">
            Salvar Todas as Configurações
          </button>
        </div>
      </form>
    </div>
  )
}
