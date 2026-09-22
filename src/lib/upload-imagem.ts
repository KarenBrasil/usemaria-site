import sharp from 'sharp'
import { getSupabaseClient } from '@/lib/supabase'

/**
 * Recebe a foto enviada pelo painel admin e devolve uma URL para guardar no banco.
 *
 * Regra de ouro: NUNCA deixar uma foto gigante virar base64 dentro do banco.
 * Uma foto em base64 no banco viaja inteira dentro do HTML em TODA visita do
 * site, o que estoura a cota de transferencia da Vercel muito rapido.
 *
 * Ordem: 1) comprime  2) manda pro Supabase Storage  3) se falhar, base64 pequeno.
 */

const LARGURA_MAX = 1200
const QUALIDADE = 80
// Acima disso NAO vai para o banco de jeito nenhum.
const LIMITE_BASE64 = 200 * 1024

export async function enviarImagem(file: File): Promise<string | null> {
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

  // 3) Ultimo recurso: base64, e somente se ficou pequeno depois da compressao.
  if (imagem.length <= LIMITE_BASE64) {
    console.warn(`[upload] Salvando em base64 (${Math.round(imagem.length / 1024)} KB). Configure o bucket "products" no Supabase para parar com isto.`)
    return `data:image/webp;base64,${imagem.toString('base64')}`
  }

  console.error(`[upload] Foto descartada: ${Math.round(imagem.length / 1024)} KB e grande demais para o banco e o Supabase Storage falhou.`)
  return null
}
