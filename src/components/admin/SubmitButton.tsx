'use client'

import { useFormStatus } from "react-dom"
import { useEffect, useState } from "react"

export default function SubmitButton({ text, loadingText = "Salvando..." }: { text: string, loadingText?: string }) {
  const { pending } = useFormStatus()
  const [showPopup, setShowPopup] = useState(false)
  const [isClicked, setIsClicked] = useState(false)

  useEffect(() => {
    if (pending) {
      setShowPopup(true)
    } else {
      // Quando parar de carregar, mantém o popup por 1 segundo mostrando sucesso e depois some
      if (showPopup) {
        setTimeout(() => setShowPopup(false), 1000)
      }
    }
  }, [pending])

  const handleClick = () => {
    setIsClicked(true)
    setTimeout(() => setIsClicked(false), 200)
  }

  return (
    <>
      <button 
        type="submit" 
        onClick={handleClick}
        disabled={pending}
        className={`w-full md:w-auto bg-zinc-900 text-white text-sm font-bold uppercase tracking-widest py-4 px-12 rounded-xl shadow-lg hover:bg-black transition-all ${isClicked ? 'scale-95 bg-amber-500' : ''} ${pending ? 'opacity-80 cursor-not-allowed' : ''}`}
      >
        {pending ? loadingText : text}
      </button>

      {showPopup && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-white/80 backdrop-blur-sm">
          <div className="bg-white px-10 py-8 rounded-3xl shadow-2xl border border-zinc-100 flex flex-col items-center justify-center animate-in zoom-in duration-300">
            {pending ? (
              <>
                <div className="w-12 h-12 border-4 border-zinc-200 border-t-black rounded-full animate-spin mb-6"></div>
                <h3 className="text-xl font-bold text-zinc-900 tracking-tight">Processando...</h3>
                <p className="text-zinc-500 text-sm mt-2">Aguarde enquanto salvamos as alterações.</p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </div>
                <h3 className="text-xl font-bold text-zinc-900 tracking-tight">Concluído!</h3>
                <p className="text-zinc-500 text-sm mt-2">Ação realizada com sucesso.</p>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
