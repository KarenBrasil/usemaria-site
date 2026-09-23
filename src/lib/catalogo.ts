import { unstable_cache } from 'next/cache'
import prisma from '@/lib/prisma'

/**
 * Leituras do catalogo com cache.
 *
 * Antes, cada visita na home e em /colecoes fazia 3 consultas no banco.
 * Com trafego de anuncio isso estoura a cota de saida do Supabase.
 * Agora o banco so e consultado quando o admin muda algo (updateTag nas
 * actions) ou, no maximo, uma vez por hora.
 *
 * Filtros e busca rodam em memoria em cima desta lista cacheada.
 */

export const TAG_CATALOGO = 'catalogo'
export const TAG_CONFIG = 'config'

const UMA_HORA = 3600

export const getCatalogo = unstable_cache(
  async () =>
    prisma.product.findMany({
      where: { isDraft: false },
      // So os campos que os cards usam.
      select: {
        id: true,
        name: true,
        description: true,
        image: true,
        price: true,
        oldPrice: true,
        wholesalePrice: true,
        isNew: true,
        isPromotion: true,
        isWholesale: true,
        categoryId: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
  ['catalogo-v1'],
  { tags: [TAG_CATALOGO], revalidate: UMA_HORA }
)

export const getCategorias = unstable_cache(
  async () => prisma.category.findMany({ orderBy: { name: 'asc' } }),
  ['categorias-v1'],
  { tags: [TAG_CATALOGO], revalidate: UMA_HORA }
)

export const getConfiguracoes = unstable_cache(
  async () => prisma.storeSettings.findUnique({ where: { id: 'default' } }),
  ['config-v1'],
  { tags: [TAG_CONFIG], revalidate: UMA_HORA }
)

type FiltroCatalogo = { categoryId?: string; filterType?: string }

export function filtrarCatalogo<T extends { categoryId: string | null; isWholesale: boolean; isPromotion: boolean; isNew: boolean }>(
  produtos: T[],
  { categoryId, filterType }: FiltroCatalogo
): T[] {
  return produtos.filter(
    (p) =>
      (!categoryId || p.categoryId === categoryId) &&
      (filterType !== 'atacado' || p.isWholesale) &&
      (filterType !== 'promocao' || p.isPromotion) &&
      (filterType !== 'novidade' || p.isNew)
  )
}
