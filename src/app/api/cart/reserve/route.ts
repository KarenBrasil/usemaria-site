import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { cartId, action, items } = await request.json();

    if (!cartId) {
      return NextResponse.json({ error: 'cartId é obrigatório' }, { status: 400 });
    }

    // Ação: CLEAR (limpar todas as reservas do carrinho, ex: quando expira o tempo ou usuário remove tudo)
    if (action === 'clear') {
      await prisma.reservation.deleteMany({
        where: { cartId }
      });
      return NextResponse.json({ success: true, message: 'Reservas removidas' });
    }

    // Ação: RESERVE (tentar reservar uma lista de itens)
    if (action === 'reserve') {
      if (!items || !Array.isArray(items)) {
        return NextResponse.json({ error: 'items é obrigatório e deve ser um array' }, { status: 400 });
      }

      const now = new Date();
      // Limpa todas as reservas expiradas de todos os usuários para manter o banco limpo
      await prisma.reservation.deleteMany({
        where: { expiresAt: { lt: now } }
      });

      const newReservationsData = [];
      const expiresAt = new Date(now.getTime() + 15 * 60000); // 15 minutos

      for (const item of items) {
        // Encontra o ProductSize
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          include: { sizes: true }
        });

        const productSize = product?.sizes.find(s => s.size === item.size);
        if (!productSize) {
          return NextResponse.json({ error: `Tamanho ${item.size} do produto não encontrado.` }, { status: 404 });
        }

        // Soma as reservas ATIVAS de OUTROS usuários para este productSizeId
        const activeReservations = await prisma.reservation.aggregate({
          where: {
            productSizeId: productSize.id,
            expiresAt: { gt: now },
            cartId: { not: cartId } // Não conta o próprio carrinho, pois ele será substituído
          },
          _sum: {
            quantity: true
          }
        });

        const reservedByOthers = activeReservations._sum.quantity || 0;
        const availableStock = productSize.stock - reservedByOthers;

        if (item.quantity > availableStock) {
          return NextResponse.json({ 
            error: `Estoque insuficiente para ${product?.name} (Tam: ${item.size}). Disponível: ${availableStock > 0 ? availableStock : 0}` 
          }, { status: 400 });
        }

        newReservationsData.push({
          cartId,
          productSizeId: productSize.id,
          quantity: item.quantity,
          expiresAt
        });
      }

      // Se passou em todas as checagens, atualiza as reservas do carrinho
      // 1. Remove as reservas antigas do cartId
      await prisma.reservation.deleteMany({
        where: { cartId }
      });

      // 2. Cria as novas reservas
      if (newReservationsData.length > 0) {
        await prisma.reservation.createMany({
          data: newReservationsData
        });
      }

      return NextResponse.json({ success: true, expiresAt });
    }

    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });

  } catch (error: any) {
    console.error('Reservation API Error:', error);
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
  }
}
