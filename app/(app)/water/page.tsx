'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function WaterPage() {
  const supabase = createClient()
  const [cups, setCups] = useState(0)
  const [target, setTarget] = useState(10)
  const [editing, setEditing] = useState(false)
  const [targetInput, setTargetInput] = useState('10')
  const [saving, setSaving] = useState(false)
  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const [{ data: profile }, { data: water }] = await Promise.all([
        supabase.from('profiles').select('water_target_cups').eq('id', user.id).single(),
        supabase.from('water_logs').select('cups_consumed').eq('user_id', user.id).eq('log_date', today).single(),
      ])
      if (profile) { setTarget(profile.water_target_cups || 10); setTargetInput(String(profile.water_target_cups || 10)) }
      setCups(water?.cups_consumed ?? 0)
    }
    load()
  }, [today])

  async function toggleCup(i: number) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const newCups = i < cups ? i : i + 1
    setCups(newCups)
    const { data: existing } = await supabase.from('water_logs').select('id').eq('user_id', user.id).eq('log_date', today).single()
    if (existing) {
      await supabase.from('water_logs').update({ cups_consumed: newCups }).eq('id', existing.id)
    } else {
      await supabase.from('water_logs').insert({ user_id: user.id, log_date: today, cups_consumed: newCups, cup_size_ml: 250 })
    }
  }

  async function saveTarget() {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const t = parseInt(targetInput) || 10
    await supabase.from('profiles').update({ water_target_cups: t }).eq('id', user.id)
    setTarget(t)
    setSaving(false)
    setEditing(false)
  }

  const pct = Math.min((cups / target) * 100, 100)
  const done = cups >= target

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black">Water Intake</h1>
          <p className="text-sm mt-0.5" style={{ color: '#64748b' }}>{new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
        <button onClick={() => setEditing(v => !v)}
          className="px-3 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all"
          style={{ background: editing ? 'rgba(34,211,238,0.15)' : '#111', border: `1px solid ${editing ? '#22d3ee' : '#222'}`, color: editing ? '#22d3ee' : '#64748b' }}>
          {editing ? '✕' : '⚙️ Target'}
        </button>
      </div>

      {/* Big stat */}
      <div className="rounded-xl p-6 mb-6 text-center relative overflow-hidden" style={{ background: '#111', border: '1px solid #1a1a1a' }}>
        <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: 'linear-gradient(90deg,#22d3ee,#6366f1)' }} />
        <div className="text-7xl font-black mb-1" style={{ color: done ? '#22c55e' : '#22d3ee' }}>{cups}</div>
        <div className="text-sm font-bold mb-4" style={{ color: '#64748b' }}>/ {target} cups today{done ? ' ✅' : ''}</div>
        <div className="h-3 rounded-full mb-2" style={{ background: '#1a1a1a' }}>
          <div className="h-3 rounded-full transition-all duration-700"
            style={{ width: `${pct}%`, background: done ? 'linear-gradient(90deg,#22c55e,#22d3ee)' : 'linear-gradient(90deg,#22d3ee,#6366f1)' }} />
        </div>
        <div className="text-xs font-bold" style={{ color: '#3f4a58' }}>
          {done ? 'Daily goal reached! 🎉' : `${target - cups} more cups to reach your goal`}
        </div>
      </div>

      {/* Cup grid */}
      <div className="rounded-xl p-5 mb-4" style={{ background: '#111', border: '1px solid #1a1a1a' }}>
        <div className="text-xs font-extrabold uppercase tracking-widest mb-4" style={{ color: '#64748b' }}>Tap to log — each cup = 250ml</div>
        <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(56px, 1fr))' }}>
          {Array.from({ length: target }).map((_, i) => {
            const filled = i < cups
            return (
              <button key={i} onClick={() => toggleCup(i)}
                className="aspect-square rounded-xl flex items-center justify-center text-2xl transition-all hover:scale-110 active:scale-95"
                style={{
                  background: filled ? 'rgba(34,211,238,0.15)' : '#181818',
                  border: `2px solid ${filled ? '#22d3ee' : '#222'}`,
                  color: filled ? '#22d3ee' : '#3f4a58',
                  boxShadow: filled ? '0 0 12px rgba(34,211,238,0.2)' : 'none',
                }}>
                💧
              </button>
            )
          })}
        </div>
      </div>

      {/* Quick +/- */}
      <div className="flex gap-3 mb-4">
        <button onClick={() => toggleCup(cups - 1)}
          disabled={cups === 0}
          className="flex-1 py-3 rounded-xl text-sm font-black uppercase tracking-widest transition-all disabled:opacity-30"
          style={{ background: '#111', border: '1px solid #222', color: '#64748b' }}>
          − Remove Cup
        </button>
        <button onClick={() => toggleCup(cups)}
          disabled={cups >= target}
          className="flex-1 py-3 rounded-xl text-sm font-black uppercase tracking-widest transition-all disabled:opacity-30 text-black"
          style={{ background: 'linear-gradient(90deg,#22d3ee,#6366f1)' }}>
          + Add Cup 💧
        </button>
      </div>

      {/* Edit target */}
      {editing && (
        <div className="rounded-xl p-5" style={{ background: '#111', border: '1px solid #222' }}>
          <div className="text-xs font-extrabold uppercase tracking-widest mb-3" style={{ color: '#22d3ee' }}>Daily Water Target</div>
          <div className="flex gap-3">
            <input type="number" min="1" max="20"
              className="flex-1 rounded-md px-3 py-2 text-sm font-semibold outline-none bg-[#181818] border border-[#222] text-[#f1f5f9] focus:border-cyan-400 transition-all"
              value={targetInput} onChange={e => setTargetInput(e.target.value)} />
            <button onClick={saveTarget} disabled={saving}
              className="px-6 py-2 rounded-xl text-sm font-black uppercase tracking-widest text-black disabled:opacity-60"
              style={{ background: 'linear-gradient(90deg,#22d3ee,#6366f1)' }}>
              {saving ? '…' : 'Save'}
            </button>
          </div>
          <div className="text-xs mt-2" style={{ color: '#3f4a58' }}>Recommended: 8–12 cups (2–3 litres) per day</div>
        </div>
      )}
    </div>
  )
}
