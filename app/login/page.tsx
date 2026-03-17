'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import { Lock, Mail, Loader2, Leaf } from 'lucide-react'

export default function Login() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      // Usando window.location força o recarregamento total da página, 
      // garantindo que os cookies da sessão Supabase recém injetados
      // sejam validados pelo middleware antes do app renderizar a Auth Wall.
      window.location.href = '/'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4 transition-colors duration-300">
      <div className="w-full max-w-sm bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 shadow-2xl relative overflow-hidden transition-all">

        {/* Decorativo */}
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <Leaf size={120} className="text-gray-900 dark:text-white" />
        </div>

        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gold-100 dark:bg-gold-900/50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gold-200 dark:border-gold-700/50">
            <Leaf className="w-8 h-8 text-gold-600 dark:text-gold-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Controle UDV</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Núcleo Jardim Real</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4 relative z-10">
          <div>
            <label className="text-xs text-gray-500 dark:text-gray-400 font-medium block mb-1.5 ml-1">E-mail</label>
            <div className="relative">
              <Mail className="w-5 h-5 text-gray-400 dark:text-gray-500 absolute left-3 top-2.5" />
              <input
                type="email"
                required
                placeholder="seu@email.com"
                className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl py-2.5 pl-10 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none transition-all"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500 dark:text-gray-400 font-medium block mb-1.5 ml-1">Senha</label>
            <div className="relative">
              <Lock className="w-5 h-5 text-gray-400 dark:text-gray-500 absolute left-3 top-2.5" />
              <input
                type="password"
                required
                placeholder="••••••••"
                className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl py-2.5 pl-10 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none transition-all"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="text-red-500 dark:text-red-400 text-xs text-center bg-red-50 dark:bg-red-900/20 p-2 rounded-lg border border-red-200 dark:border-red-900/50">
              {error === 'Invalid login credentials' ? 'E-mail ou senha incorretos' : error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gold-600 hover:bg-gold-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 mt-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Entrar'}
          </button>
        </form>

      </div>
    </div>
  )
}