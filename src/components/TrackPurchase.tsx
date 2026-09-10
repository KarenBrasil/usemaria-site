'use client'

import { useEffect } from "react";
import { fbEvent } from "@/lib/fbpixel";

export default function TrackPurchase({
  orderId,
  value,
  contentIds,
  numItems,
}: {
  orderId: string;
  value: number;
  contentIds: string[];
  numItems: number;
}) {
  useEffect(() => {
    // Sem essa trava, recarregar a página de sucesso conta a mesma venda de novo.
    const key = `fb-purchase-${orderId}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {}

    fbEvent("Purchase", {
      content_ids: contentIds,
      content_type: "product",
      value,
      currency: "BRL",
      num_items: numItems,
    });
  }, [orderId, value, contentIds, numItems]);

  return null;
}
