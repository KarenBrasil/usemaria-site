"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function Toast() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const success = searchParams.get("success");
    if (success) {
      if (success === "created") {
        setMessage("Produto adicionado com sucesso!");
      } else if (success === "updated") {
        setMessage("Produto atualizado com sucesso!");
      } else {
        setMessage("Ação concluída com sucesso!");
      }
      setShow(true);

      // Remove the query param after showing
      const newUrl = window.location.pathname;
      window.history.replaceState({}, "", newUrl);

      // Hide after 3 seconds
      const timer = setTimeout(() => setShow(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  if (!show) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div className="bg-zinc-900 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 border border-zinc-800">
        <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-green-500"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-sm">Sucesso</span>
          <span className="text-xs text-zinc-300">{message}</span>
        </div>
      </div>
    </div>
  );
}
