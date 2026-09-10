'use client'

import { useEffect } from "react";
import { fbEvent } from "@/lib/fbpixel";

export default function TrackViewContent({
  id,
  name,
  price,
}: {
  id: string;
  name: string;
  price: number;
}) {
  useEffect(() => {
    fbEvent("ViewContent", {
      content_ids: [id],
      content_name: name,
      content_type: "product",
      value: price,
      currency: "BRL",
    });
  }, [id, name, price]);

  return null;
}
