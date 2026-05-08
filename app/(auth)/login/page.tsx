'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function signInWithGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${location.origin}/callback` },
    })
  }

  async function signInWithEmail(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false); return }
    router.push('/dashboard')
  }

  async function signUpWithEmail(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { emailRedirectTo: `${location.origin}/callback` },
    })
    if (error) { setError(error.message); setLoading(false); return }
    router.push('/onboarding')
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8"
      style={{ background: 'radial-gradient(ellipse at 30% 20%, rgba(249,115,22,.08) 0%, transparent 60%), radial-gradient(ellipse at 80% 80%, rgba(99,102,241,.06) 0%, transparent 55%), #080808' }}>
      <div className="w-full max-w-sm">

        {/* Brand */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4"
            style={{ background: 'linear-gradient(135deg,#f97316,#eab308)', boxShadow: '0 0 32px rgba(249,115,22,.4)', animation: 'pglow 2.5s ease-in-out infinite' }}>
            🔥
          </div>
          <h1 className="text-2xl font-black tracking-tight">
            <span style={{ background: 'linear-gradient(90deg,#f97316,#eab308)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Alvin&apos;s
            </span>{' '}Journey
          </h1>
          <p className="text-sm mt-1" style={{ color: '#64748b' }}>Your personal diet &amp; workout tracker</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-7 relative overflow-hidden"
          style={{ background: '#111', border: '1px solid #222' }}>
          <div className="absolute top-0 left-0 right-0 h-0.5"
            style={{ background: 'linear-gradient(90deg,#f97316,#eab308)' }} />

          {/* Google */}
          <button onClick={signInWithGoogle}
            className="w-full flex items-center justify-center gap-3 py-3 rounded-lg mb-5 text-sm font-bold transition-all"
            style={{ background: '#181818', border: '1px solid #222' }}
            onMouseEnter={e => { (e.target as HTMLElement).style.borderColor = '#f97316' }}
            onMouseLeave={e => { (e.target as HTMLElement).style.borderColor = '#222' }}>
            <span className="w-5 h-5 rounded-full bg-white flex items-center justify-center text-xs font-black text-gray-800">G</span>
            Continue with Google
          </button>

          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px" style={{ background: '#222' }} />
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#64748b' }}>or</span>
            <div className="flex-1 h-px" style={{ background: '#222' }} />
          </div>

          {/* Email form */}
          <form className="space-y-3">
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-widest mb-1" style={{ color: '#64748b' }}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="w-full rounded-md px-3 py-2 text-sm font-semibold outline-none transition-all"
                style={{ background: '#181818', border: '1px solid #222', color: '#f1f5f9' }}
                placeholder="alvin.niode@gmail.com"
                onFocus={e => { e.target.style.borderColor = '#f97316'; e.target.style.boxShadow = '0 0 0 3px rgba(249,115,22,.15)' }}
                onBlur={e => { e.target.style.borderColor = '#222'; e.target.style.boxShadow = 'none' }} />
            </div>
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-widest mb-1" style={{ color: '#64748b' }}>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                className="w-full rounded-md px-3 py-2 text-sm font-semibold outline-none transition-all"
                style={{ background: '#181818', border: '1px solid #222', color: '#f1f5f9' }}
                placeholder="••••••••"
                onFocus={e => { e.target.style.borderColor = '#f97316'; e.target.style.boxShadow = '0 0 0 3px rgba(249,115,22,.15)' }}
                onBlur={e => { e.target.style.borderColor = '#222'; e.target.style.boxShadow = 'none' }} />
            </div>

            {error && <p className="text-xs font-bold" style={{ color: '#ef4444' }}>{error}</p>}

            <button type="submit" onClick={signInWithEmail} disabled={loading}
              className="w-full py-3 rounded-lg text-sm font-black uppercase tracking-widest text-black transition-all disabled:opacity-60"
              style={{ background: 'linear-gradient(90deg,#f97316,#eab308)' }}>
              {loading ? 'Signing in…' : 'Sign In'}
            </button>

            <button type="button" onClick={signUpWithEmail} disabled={loading}
              className="w-full py-2.5 rounded-lg text-sm font-bold transition-all"
              style={{ background: 'none', border: '1px solid #222', color: '#64748b' }}>
              Create new account →
            </button>
          </form>
        </div>

        <style>{`@keyframes pglow{0%,100%{box-shadow:0 0 20px rgba(249,115,22,.3)}50%{box-shadow:0 0 40px rgba(249,115,22,.7)}}`}</style>
      </div>
    </div>
  )
}
