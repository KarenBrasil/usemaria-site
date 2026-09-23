import sharp from 'sharp'
import { getSupabaseClient } from '@/lib/supabase'

/**
 * Recebe a foto enviada pelo painel admin e devolve uma URL para guardar no banco.
 *
 * Regra de ouro: NUNCA deixar uma foto gigante virar base64 dentro do banco.
 * Uma foto em base64 no banco viaja inteira dentro do HTML em TODA visita do
 * site, o que estoura a cota de transferencia da Vercel muito rapido.
 *
 * Ordem: 1) comprime  2) manda pro Supabase Storage  3) se falhar, da erro.
 */

const LARGURA_MAX = 1200
const QUALIDADE = 80

export async function enviarImagem(file: File): Promise<string> {
  const original = Buffer.from(await file.arrayBuffer())

  // 1) Comprime: reduz para no maximo 1200px de largura e converte para webp.
  let imagem: Buffer
  try {
    imagem = await sharp(original)
      .rotate()
      .resize({ width: LARGURA_MAX, withoutEnlargement: true })
      .webp({ quality: QUALIDADE })
      .toBuffer()
  } catch (e) {
    console.error('[upload] Nao consegui comprimir, usando original:', e)
    imagem = original
  }

  const nome = `${Date.now()}-${Math.random().toString(36).substring(2)}.webp`
  const caminho = `products/${nome}`

  // 2) Supabase Storage (o lugar certo).
  try {
    const supabase = getSupabaseClient()
    const { error } = await supabase.storage
      .from('products')
      .upload(caminho, imagem, {
        cacheControl: '31536000',
        contentType: 'image/webp',
        upsert: false,
      })

    if (error) {
      // Antes este erro era engolido em silencio e por isso ninguem percebeu
      // que TODAS as fotos estavam indo parar dentro do banco em base64.
      console.error('[upload] Supabase Storage recusou o envio:', error.message)
    } else {
      const { data } = supabase.storage.from('products').getPublicUrl(caminho)
      return data.publicUrl
    }
  } catch (e) {
    console.error('[upload] Supabase Storage indisponivel:', e instanceof Error ? e.message : e)
  }

  // Sem fallback em base64: foto dentro do banco estoura a cota de saida do
  // Supabase (foi o que bloqueou o projeto). Melhor falhar alto e o admin
  // tentar de novo do que engordar cada visita do site.
  throw new Error('Nao foi possivel salvar a foto no Supabase Storage. Confira se o bucket "products" existe e e publico, e tente de novo.')
}
