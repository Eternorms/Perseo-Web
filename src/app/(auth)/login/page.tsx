import { login } from './actions'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950">
      <div className="w-full max-w-sm space-y-6 p-8 bg-neutral-900 rounded-2xl border border-neutral-800">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold text-white">Perseo</h1>
          <p className="text-sm text-neutral-400">Entre com sua conta</p>
        </div>
        <form action={login} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs text-neutral-400 uppercase tracking-wide">Email</label>
            <input
              name="email"
              type="email"
              required
              className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm placeholder-neutral-500 focus:outline-none focus:border-neutral-500"
              placeholder="seu@email.com"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-neutral-400 uppercase tracking-wide">Senha</label>
            <input
              name="password"
              type="password"
              required
              className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm placeholder-neutral-500 focus:outline-none focus:border-neutral-500"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2 bg-white text-neutral-900 rounded-lg text-sm font-medium hover:bg-neutral-100 transition-colors"
          >
            Entrar
          </button>
        </form>
      </div>
    </div>
  )
}
