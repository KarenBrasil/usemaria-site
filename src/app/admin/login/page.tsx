import { login } from "./actions"

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-sm border border-zinc-200 p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold tracking-[0.2em] uppercase">Use Maria</h1>
          <p className="text-sm text-zinc-500 mt-2">Acesso restrito</p>
        </div>
        
        <form action={login} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Senha de Acesso</label>
            <input 
              type="password" 
              name="password" 
              className="w-full border border-zinc-300 rounded p-3 focus:outline-none focus:border-zinc-500 transition-colors"
              placeholder="Digite a senha"
              required
            />
          </div>
          <button 
            type="submit" 
            className="w-full bg-zinc-900 text-white font-bold tracking-widest uppercase text-sm py-3 rounded hover:bg-zinc-800 transition-colors"
          >
            Entrar no Painel
          </button>
        </form>
      </div>
    </div>
  )
}
