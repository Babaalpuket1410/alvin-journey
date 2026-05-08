'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Totals { calories: number; protein: number; carbs: number; fat: number }
interface Profile { calorie_target: number; protein_target: number; carb_target: number; fat_target: number }

function MacroBar({ label, value, target, color }: { label: string; value: number; target: number; color: string }) {
  const pct = Math.min((value / target) * 100, 100)
  const over = value > target
  return (
    <div className="rounded-xl p-4" style={{ background: '#111', border: '1px solid #1a1a1a' }}>
      <div className="flex justify-between mb-2">
        <span className="text-xs font-extrabold uppercase tracking-widest" style={{ color: '#64748b' }}>{label}</span>
        <span className="text-xs font-black" style={{ color: over ? '#ef4444' : color }}>{value}g <span style={{ color: '#3f4a58' }}>/ {target}g</span></span>
      </div>
      <div className="h-2.5 rounded-full" style={{ background: '#1a1a1a' }}>
        <div className="h-2.5 rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: over ? '#ef4444' : `linear-gradient(90deg,${color},${color}bb)` }} />
      </div>
      <div className="text-xs mt-1.5 font-bold" style={{ color: '#3f4a58' }}>
        {target - value > 0 ? `${target - value}g remaining` : `${value - target}g over target`}
      </div>
    </div>
  )
}

export default function CaloriesPage() {
  const supabase = createClient()
  const [totals, setTotals] = useState<Totals>({ calories: 0, protein: 0, carbs: 0, fat: 0 })
  const [profile, setProfile] = useState<Profile>({ calorie_target: 2200, protein_target: 160, carb_target: 220, fat_target: 73 })
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ calorie_target: '2200', protein_target: '160', carb_target: '220', fat_target: '73' })
  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const [{ data: prof }, { data: meals }] = await Promise.all([
        supabase.from('profiles').select('calorie_target,protein_target,carb_target,fat_target').eq('id', user.id).single(),
        supabase.from('meal_logs').select('calories,protein_g,carbs_g,fat_g').eq('user_id', user.id).eq('log_date', today),
      ])
      if (prof) {
        setProfile(prof)
        setForm({ calorie_target: String(prof.calorie_target), protein_target: String(prof.protein_target), carb_target: String(prof.carb_target), fat_target: String(prof.fat_target) })
      }
      if (meals) setTotals({
        calories: meals.reduce((s, m) => s + (m.calories || 0), 0),
        protein: meals.reduce((s, m) => s + (m.protein_g || 0), 0),
        carbs: meals.reduce((s, m) => s + (m.carbs_g || 0), 0),
        fat: meals.reduce((s, m) => s + (m.fat_g || 0), 0),
      })
    }
    load()
  }, [today])

  async function saveTargets() {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('profiles').update({
      calorie_target: parseInt(form.calorie_target) || 2200,
      protein_target: parseInt(form.protein_target) || 160,
      carb_target: parseInt(form.carb_target) || 220,
      fat_target: parseInt(form.fat_target) || 73,
    }).eq('id', user.id)
    setProfile({ calorie_target: parseInt(form.calorie_target), protein_target: parseInt(form.protein_target), carb_target: parseInt(form.carb_target), fat_target: parseInt(form.fat_target) })
    setSaving(false)
    setEditing(false)
  }

  const calPct = Math.min((totals.calories / profile.calorie_target) * 100, 100)
  const calOver = totals.calories > profile.calorie_target
  const remaining = profile.calorie_target - totals.calories

  const inputCls = "w-full rounded-md px-3 py-2 text-sm font-semibold outline-none bg-[#181818] border border-[#222] text-[#f1f5f9] focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 transition-all"

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black">Calories</h1>
          <p className="text-sm mt-0.5" style={{ color: '#64748b' }}>{new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
        <button onClick={() => setEditing(v => !v)}
          className="px-3 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all"
          style={{ background: editing ? 'rgba(249,115,22,0.15)' : '#111', border: `1px solid ${editing ? '#f97316' : '#222'}`, color: editing ? '#f97316' : '#64748b' }}>
          {editing ? '✕ Cancel' : '⚙️ Targets'}
        </button>
      </div>

      {/* Main calorie ring */}
      <div className="rounded-xl p-6 mb-4 relative overflow-hidden" style={{ background: '#111', border: '1px solid #1a1a1a' }}>
        <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: 'linear-gradient(90deg,#f97316,#eab308)' }} />
        <div className="flex items-center gap-6">
          <svg width={140} height={140} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
            <circle cx={70} cy={70} r={58} fill="none" stroke="#1a1a1a" strokeWidth={14} />
            <circle cx={70} cy={70} r={58} fill="none" stroke={calOver ? '#ef4444' : '#f97316'} strokeWidth={14}
              strokeDasharray={364} strokeDashoffset={364 * (1 - calPct / 100)}
              strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s ease' }} />
          </svg>
          <div className="flex-1">
            <div className="text-xs font-extrabold uppercase tracking-widest mb-1" style={{ color: '#64748b' }}>Today&apos;s Intake</div>
            <div className="text-5xl font-black mb-1" style={{ color: calOver ? '#ef4444' : '#f97316' }}>{totals.calories}</div>
            <div className="text-sm font-bold" style={{ color: '#64748b' }}>/ {profile.calorie_target} kcal target</div>
            <div className="mt-2 text-sm font-black" style={{ color: calOver ? '#ef4444' : '#22c55e' }}>
              {calOver ? `${Math.abs(remaining)} kcal over` : `${remaining} kcal remaining`}
            </div>
          </div>
        </div>
      </div>

      {/* Macro breakdown */}
      <div className="space-y-3 mb-4">
        <MacroBar label="Protein" value={totals.protein} target={profile.protein_target} color="#6366f1" />
        <MacroBar label="Carbs" value={totals.carbs} target={profile.carb_target} color="#eab308" />
        <MacroBar label="Fat" value={totals.fat} target={profile.fat_target} color="#22d3ee" />
      </div>

      {/* Macro split */}
      <div className="rounded-xl p-4 mb-4" style={{ background: '#111', border: '1px solid #1a1a1a' }}>
        <div className="text-xs font-extrabold uppercase tracking-widest mb-3" style={{ color: '#64748b' }}>Calorie Split by Macro</div>
        <div className="h-3 rounded-full overflow-hidden flex">
          {[
            { val: totals.protein * 4, color: '#6366f1' },
            { val: totals.carbs * 4, color: '#eab308' },
            { val: totals.fat * 9, color: '#22d3ee' },
          ].map((m, i) => (
            <div key={i} style={{ width: totals.calories ? `${(m.val / totals.calories) * 100}%` : '33%', background: m.color, transition: 'width 0.7s ease' }} />
          ))}
        </div>
        <div className="grid grid-cols-3 gap-2 mt-3">
          {[
            { label: 'Protein', kcal: totals.protein * 4, color: '#6366f1' },
            { label: 'Carbs', kcal: totals.carbs * 4, color: '#eab308' },
            { label: 'Fat', kcal: totals.fat * 9, color: '#22d3ee' },
          ].map(m => (
            <div key={m.label} className="text-center">
              <div className="text-sm font-black" style={{ color: m.color }}>{m.kcal} kcal</div>
              <div className="text-xs" style={{ color: '#3f4a58' }}>{m.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Edit targets */}
      {editing && (
        <div className="rounded-xl p-5" style={{ background: '#111', border: '1px solid #222' }}>
          <div className="text-xs font-extrabold uppercase tracking-widest mb-4" style={{ color: '#f97316' }}>Edit Daily Targets</div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            {([['calorie_target', 'Daily Calories (kcal)'], ['protein_target', 'Protein (g)'], ['carb_target', 'Carbs (g)'], ['fat_target', 'Fat (g)']] as const).map(([k, lbl]) => (
              <div key={k}>
                <label className="block text-xs font-extrabold uppercase tracking-widest mb-1 text-[#64748b]">{lbl}</label>
                <input type="number" className={inputCls} value={form[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} />
              </div>
            ))}
          </div>
          <button onClick={saveTargets} disabled={saving}
            className="w-full py-3 rounded-xl text-sm font-black uppercase tracking-widest text-black disabled:opacity-60"
            style={{ background: 'linear-gradient(90deg,#f97316,#eab308)' }}>
            {saving ? 'Saving…' : 'Save Targets'}
          </button>
        </div>
      )}
    </div>
  )
}
