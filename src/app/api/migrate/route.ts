import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    // 1. Atualizar todos os produtos para R$ 54,90 (varejo) e R$ 34,90 (atacado)
    const updatedProducts = await prisma.product.updateMany({
      data: {
        price: 54.90,
        wholesalePrice: 34.90
      }
    });

    // 2. Atualizar as configurações da loja para o PIX da Anny Talyta
    const updatedSettings = await prisma.storeSettings.update({
      where: { id: 'default' },
      data: {
        pixKey: '04107666310',
        pixName: 'Anny Talyta de Oliveira Santos'
      }
    });

    return NextResponse.json({ 
      success: true, 
      productsUpdated: updatedProducts.count,
      settings: updatedSettings
    });
  } catch (error: any) {
    console.error("Migrate error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
