import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export default async function SettingsPage() {
  const settings = await prisma.storeSettings.findUnique({
    where: { id: "default" }
  })

  // Fallback se não existir
  const defaultSettings = settings || {
    storeName: "USE MARIA",
    hero1Title: "A Coleção Divina",
    hero1Subtitle: "Lançamento Exclusivo Online",
    hero1Image: "/images/catalog/page-0001.jpg",
    hero2Title: "O Look Perfeito",
    hero2Subtitle: "Escolha da Estilista",
    hero2Text: "Capturado por @fotografo",
    hero2Image: "/images/catalog/page-0006.jpg",
    whatsappNumber: "5585994277446",
    instagramUrl: "#",
    tiktokUrl: "#",
    pixKey: "CNPJ: 00.000.000/0001-00",
    pixName: "USE MARIA OFICIAL"
  }

  async function saveSettings(formData: FormData) {
    'use server'
    const storeName = formData.get('storeName') as string
    const hero1Title = formData.get('hero1Title') as string
    const hero1Subtitle = formData.get('hero1Subtitle') as string
    const hero1Image = formData.get('hero1Image') as string
    const hero2Title = formData.get('hero2Title') as string
    const hero2Subtitle = formData.get('hero2Subtitle') as string
    const hero2Text = formData.get('hero2Text') as string
    const hero2Image = formData.get('hero2Image') as string
    const whatsappNumber = formData.get('whatsappNumber') as string
    const instagramUrl = formData.get('instagramUrl') as string
    const tiktokUrl = formData.get('tiktokUrl') as string
    const pixKey = formData.get('pixKey') as string
    const pixName = formData.get('pixName') as string

    await prisma.storeSettings.upsert({
      where: { id: "default" },
      update: {
        storeName, hero1Title, hero1Subtitle, hero1Image,
        hero2Title, hero2Subtitle, hero2Text, hero2Image,
        whatsappNumber, instagramUrl, tiktokUrl, pixKey, pixName
      },
      create: {
        id: "default",
        storeName, hero1Title, hero1Subtitle, hero1Image,
        hero2Title, hero2Subtitle, hero2Text, hero2Image,
        whatsappNumber, instagramUrl, tiktokUrl, pixKey, pixName
      }
    })

    revalidatePath('/')
    redirect('/admin/configuracoes')
  }

  return (
    <div className="w-full max-w-4xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-black">Configurações do Site</h1>
      </div>

      <form action={saveSettings} className="bg-white p-6 rounded-lg border border-zinc-200 shadow-sm space-y-8">
        
        {/* Identidade */}
        <section>
          <h2 className="text-lg font-bold mb-4 border-b pb-2">Identidade Visual & Contato</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1">Nome da Loja (Logo Texto)</label>
                <input type="text" name="storeName" defaultValue={defaultSettings.storeName} className="w-full border border-zinc-300 p-2 text-sm focus:outline-none focus:border-black" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1">Número do WhatsApp</label>
                <input type="text" name="whatsappNumber" defaultValue={defaultSettings.whatsappNumber} className="w-full border border-zinc-300 p-2 text-sm focus:outline-none focus:border-black" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1">Link do Instagram</label>
                <input type="text" name="instagramUrl" defaultValue={defaultSettings.instagramUrl} className="w-full border border-zinc-300 p-2 text-sm focus:outline-none focus:border-black" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1">Link do TikTok</label>
                <input type="text" name="tiktokUrl" defaultValue={defaultSettings.tiktokUrl} className="w-full border border-zinc-300 p-2 text-sm focus:outline-none focus:border-black" />
              </div>
            </div>

            {/* Pagamento */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-widest mb-2 text-black">Pagamento PIX</h3>
              <p className="text-xs text-zinc-500 mb-4">Dados mostrados na finalização da compra via PIX.</p>
              <div>
                <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1">Chave PIX</label>
                <input type="text" name="pixKey" defaultValue={defaultSettings.pixKey} placeholder="Ex: CNPJ, Email ou Celular" className="w-full border border-zinc-300 p-2 text-sm focus:outline-none focus:border-black" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1">Nome do Recebedor (Opcional)</label>
                <input type="text" name="pixName" defaultValue={defaultSettings.pixName} placeholder="Ex: Loja Maria LTDA" className="w-full border border-zinc-300 p-2 text-sm focus:outline-none focus:border-black" />
              </div>
            </div>
          </div>
        </section>

        {/* Hero 1 */}
        <section>
          <h2 className="text-lg font-bold mb-4 border-b pb-2">Primeiro Banner (Hero 1)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold">Título Principal</label>
              <input name="hero1Title" defaultValue={defaultSettings.hero1Title} className="border p-2 rounded" required />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold">Subtítulo (Lançamento...)</label>
              <input name="hero1Subtitle" defaultValue={defaultSettings.hero1Subtitle} className="border p-2 rounded" required />
            </div>
            <div className="flex flex-col gap-2 md:col-span-2">
              <label className="text-sm font-semibold">Caminho da Imagem Principal</label>
              <input name="hero1Image" defaultValue={defaultSettings.hero1Image} className="border p-2 rounded" required />
            </div>
          </div>
        </section>

        {/* Hero 2 */}
        <section>
          <h2 className="text-lg font-bold mb-4 border-b pb-2">Segundo Banner (Editorial)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold">Título</label>
              <input name="hero2Title" defaultValue={defaultSettings.hero2Title} className="border p-2 rounded" required />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold">Subtítulo (Escolha...)</label>
              <input name="hero2Subtitle" defaultValue={defaultSettings.hero2Subtitle} className="border p-2 rounded" required />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold">Texto Rodapé do Banner</label>
              <input name="hero2Text" defaultValue={defaultSettings.hero2Text} className="border p-2 rounded" required />
            </div>
            <div className="flex flex-col gap-2 md:col-span-2">
              <label className="text-sm font-semibold">Caminho da Imagem Editorial</label>
              <input name="hero2Image" defaultValue={defaultSettings.hero2Image} className="border p-2 rounded" required />
            </div>
          </div>
        </section>

        <button type="submit" className="w-full bg-black text-white font-bold py-3 rounded hover:bg-zinc-800 transition">
          Salvar Configurações
        </button>
      </form>
    </div>
  )
}
