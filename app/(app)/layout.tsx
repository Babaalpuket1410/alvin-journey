'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const TABS = [
  { href: '/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/calories', label: 'Calories', icon: '🔥' },
  { href: '/workout', label: 'Workout', icon: '💪' },
  { href: '/meals', label: 'Meals', icon: '🍽️' },
  { href: '/water', label: 'Water', icon: '💧' },
  { href: '/progress', label: 'Progress', icon: '📈' },
]

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const [user, setUser] = useState<{ name: string; email: string; avatar?: string } | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)

  const loadUser = useCallback(async () => {
    const { data: { user: u } } = await supabase.auth.getUser()
    if (!u) { router.push('/login'); return }
    const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', u.id).single()
    setUser({
      name: profile?.full_name || u.email?.split('@')[0] || 'User',
      email: u.email || '',
      avatar: u.user_metadata?.avatar_url,
    })
  }, [supabase, router])

  useEffect(() => { loadUser() }, [loadUser])

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const initials = user?.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?'

  return (
    <div className="min-h-screen" style={{ background: '#080808' }}>
      {/* Topbar */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-4 py-3 border-b"
        style={{ background: 'rgba(8,8,8,0.95)', borderColor: '#1a1a1a', backdropFilter: 'blur(12px)' }}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
            style={{ background: 'linear-gradient(135deg,#f97316,#eab308)' }}>🔥</div>
          <span className="text-sm font-black tracking-tight hidden sm:block">
            <span style={{ background: 'linear-gradient(90deg,#f97316,#eab308)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {user?.name?.split(' ')[0] || 'My'}&apos;s
            </span>{' '}Journey
          </span>
        </div>

        {/* Desktop tab nav */}
        <nav className="hidden md:flex items-center gap-1">
          {TABS.map(t => (
            <Link key={t.href} href={t.href}
              className="px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all"
              style={{
                background: pathname === t.href ? 'rgba(249,115,22,0.15)' : 'transparent',
                color: pathname === t.href ? '#f97316' : '#64748b',
                border: pathname === t.href ? '1px solid rgba(249,115,22,0.3)' : '1px solid transparent',
              }}>
              {t.icon} {t.label}
            </Link>
          ))}
        </nav>

        {/* Avatar */}
        <div className="relative">
          <button onClick={() => setMenuOpen(v => !v)}
            className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-black text-black transition-all hover:scale-105"
            style={{ background: user?.avatar ? 'transparent' : 'linear-gradient(135deg,#f97316,#eab308)' }}>
            {user?.avatar
              ? <img src={user.avatar} alt={user.name} className="w-9 h-9 rounded-full object-cover" />
              : initials}
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-11 rounded-xl py-2 z-50 min-w-[180px] shadow-xl"
              style={{ background: '#111', border: '1px solid #222' }}>
              <div className="px-4 py-2 border-b" style={{ borderColor: '#222' }}>
                <div className="text-sm font-black text-white">{user?.name}</div>
                <div className="text-xs" style={{ color: '#64748b' }}>{user?.email}</div>
              </div>
              <button onClick={() => { setMenuOpen(false); router.push('/onboarding') }}
                className="w-full text-left px-4 py-2 text-sm transition-all hover:bg-[#181818]" style={{ color: '#94a3b8' }}>
                ⚙️ Edit Profile
              </button>
              <button onClick={signOut}
                className="w-full text-left px-4 py-2 text-sm transition-all hover:bg-[#181818]" style={{ color: '#ef4444' }}>
                🚪 Sign Out
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Page content */}
      <main className="pb-24 md:pb-8">
        {children}
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex border-t"
        style={{ background: 'rgba(8,8,8,0.97)', borderColor: '#1a1a1a', backdropFilter: 'blur(12px)' }}>
        {TABS.map(t => (
          <Link key={t.href} href={t.href}
            className="flex-1 flex flex-col items-center py-2.5 gap-0.5 transition-all"
            style={{ color: pathname === t.href ? '#f97316' : '#3f4a58' }}>
            <span className="text-lg leading-none">{t.icon}</span>
            <span className="text-[9px] font-black uppercase tracking-widest">{t.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  )
}
