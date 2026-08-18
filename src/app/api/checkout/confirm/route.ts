import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { orderId, status, errorMsg } = await request.json();

    if (!orderId) {
      return NextResponse.json({ error: "orderId is required" }, { status: 400 });
    }

    if (status === 'PAID') {
      await prisma.order.update({
        where: { id: orderId },
        data: { status: 'PAID', paymentError: null }
      });
      return NextResponse.json({ success: true, status: 'PAID' });
    }

    if (status === 'FAILED') {
      await prisma.order.update({
        where: { id: orderId },
        data: { paymentError: errorMsg || 'Falha ao processar cartão.' }
      });
      return NextResponse.json({ success: true, status: 'FAILED' });
    }

    return NextResponse.json({ error: "Invalid status" }, { status: 400 });

  } catch (err: any) {
    console.error("Confirm Checkout Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
