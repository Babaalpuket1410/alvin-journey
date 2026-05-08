'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function StepsPage() {
  const supabase = createClient()
  const [steps, setSteps] = useState(0)
  const [goal, setGoal] = useState(10000)
  const [distance, setDistance] = useState<number | null>(null)
  const [caloriesBurned, setCaloriesBurned] = useState<number | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [logId, setLogId] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ steps: '0', goal: '10000', distance: '', calories_burned: '' })
  const [saving, setSaving] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])

  useEffect(() => { load(selectedDate) }, [selectedDate])

  async function load(date: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)
    const { data } = await supabase.from('steps_logs').select('*').eq('user_id', user.id).eq('log_date', date).single()
    if (data) {
      setSteps(data.steps); setGoal(data.goal)
      setDistance(data.distance_km); setCaloriesBurned(data.calories_burned)
      setLogId(data.id)
      setForm({ steps: String(data.steps), goal: String(data.goal), distance: String(data.distance_km ?? ''), calories_burned: String(data.calories_burned ?? '') })
    } else {
      setSteps(0); setGoal(10000); setDistance(null); setCaloriesBurned(null); setLogId(null)
      setForm({ steps: '0', goal: '10000', distance: '', calories_burned: '' })
    }
  }

  async function save() {
    if (!userId) return
    setSaving(true)
    const payload = {
      user_id: userId, log_date: selectedDate,
      steps: parseInt(form.steps) || 0,
      goal: parseInt(form.goal) || 10000,
      distance_km: form.distance ? parseFloat(form.distance) : null,
      calories_burned: form.calories_burned ? parseInt(form.calories_burned) : null,
    }
    if (logId) {
      await supabase.from('steps_logs').update(payload).eq('id', logId)
    } else {
      const { data } = await supabase.from('steps_logs').insert(payload).select('id').single()
      if (data) setLogId(data.id)
    }
    setSteps(payload.steps); setGoal(payload.goal)
    setDistance(payload.distance_km); setCaloriesBurned(payload.calories_burned)
    setSaving(false); setEditing(false)
  }

  const pct = Math.min((steps / goal) * 100, 100)
  const done = steps >= goal
  const color = done ? '#22c55e' : pct > 60 ? '#eab308' : '#6366f1'
  const inputCls = "w-full rounded-md px-3 py-2 text-sm font-semibold outline-none bg-[#181818] border border-[#222] text-[#f1f5f9] focus:border-indigo-500 transition-all"

  // Quick add amounts
  const quickAdd = [500, 1000, 2000, 5000]

  async function quickAddSteps(n: number) {
    if (!userId) return
    const newSteps = steps + n
    setSteps(newSteps)
    setForm(f => ({ ...f, steps: String(newSteps) }))
    const payload = { user_id: userId, log_date: selectedDate, steps: newSteps, goal }
    if (logId) {
      await supabase.from('steps_logs').update({ steps: newSteps }).eq('id', logId)
    } else {
      const { data } = await supabase.from('steps_logs').insert(payload).select('id').single()
      if (data) setLogId(data.id)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black">Steps</h1>
          <p className="text-sm mt-0.5" style={{ color: '#64748b' }}>Daily step tracker</p>
        </div>
        <div className="flex items-center gap-2">
          <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
            className="rounded-lg px-3 py-2 text-xs font-bold outline-none transition-all"
            style={{ background: '#111', border: '1px solid #222', color: '#f1f5f9' }} />
          <button onClick={() => setEditing(v => !v)}
            className="px-3 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all"
            style={{ background: editing ? 'rgba(99,102,241,0.15)' : '#111', border: `1px solid ${editing ? '#6366f1' : '#222'}`, color: editing ? '#6366f1' : '#64748b' }}>
            {editing ? '✕' : '✏️ Edit'}
          </button>
        </div>
      </div>

      {/* Big ring */}
      <div className="rounded-xl p-6 mb-4 relative overflow-hidden text-center" style={{ background: '#111', border: '1px solid #1a1a1a' }}>
        <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: `linear-gradient(90deg,${color},transparent)` }} />
        <svg width={180} height={180} className="mx-auto mb-2" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={90} cy={90} r={75} fill="none" stroke="#1a1a1a" strokeWidth={14} />
          <circle cx={90} cy={90} r={75} fill="none" stroke={color} strokeWidth={14}
            strokeDasharray={471} strokeDashoffset={471 * (1 - pct / 100)}
            strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
        </svg>
        <div className="text-5xl font-black -mt-2 mb-1" style={{ color }}>{steps.toLocaleString()}</div>
        <div className="text-sm font-bold mb-1" style={{ color: '#64748b' }}>/ {goal.toLocaleString()} steps {done ? '🎉' : ''}</div>
        <div className="text-xs font-bold" style={{ color: done ? '#22c55e' : '#3f4a58' }}>
          {done ? 'Goal reached!' : `${(goal - steps).toLocaleString()} steps to go`}
        </div>
        {(distance || caloriesBurned) && (
          <div className="flex justify-center gap-6 mt-3">
            {distance && <div className="text-center"><div className="text-lg font-black" style={{ color: '#22d3ee' }}>{distance}km</div><div className="text-xs" style={{ color: '#3f4a58' }}>Distance</div></div>}
            {caloriesBurned && <div className="text-center"><div className="text-lg font-black" style={{ color: '#f97316' }}>{caloriesBurned}</div><div className="text-xs" style={{ color: '#3f4a58' }}>kcal burned</div></div>}
          </div>
        )}
      </div>

      {/* Quick add */}
      {!editing && (
        <div className="rounded-xl p-4 mb-4" style={{ background: '#111', border: '1px solid #1a1a1a' }}>
          <div className="text-xs font-extrabold uppercase tracking-widest mb-3" style={{ color: '#64748b' }}>Quick Add</div>
          <div className="grid grid-cols-4 gap-2">
            {quickAdd.map(n => (
              <button key={n} onClick={() => quickAddSteps(n)}
                className="py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95"
                style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', color: '#6366f1' }}>
                +{n >= 1000 ? `${n/1000}k` : n}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Edit form */}
      {editing && (
        <div className="rounded-xl p-5" style={{ background: '#111', border: '1px solid #222' }}>
          <div className="text-xs font-extrabold uppercase tracking-widest mb-4" style={{ color: '#6366f1' }}>Log Steps</div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            {[['steps', 'Steps'], ['goal', 'Daily Goal'], ['distance', 'Distance (km)'], ['calories_burned', 'Calories Burned']].map(([k, lbl]) => (
              <div key={k}>
                <label className="block text-xs font-extrabold uppercase tracking-widest mb-1 text-[#64748b]">{lbl}</label>
                <input type="number" className={inputCls} value={form[k as keyof typeof form]}
                  onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} />
              </div>
            ))}
          </div>
          <button onClick={save} disabled={saving}
            className="w-full py-3 rounded-xl text-sm font-black uppercase tracking-widest disabled:opacity-60"
            style={{ background: 'linear-gradient(90deg,#6366f1,#22d3ee)', color: 'white' }}>
            {saving ? 'Saving…' : 'Save Steps'}
          </button>
        </div>
      )}
    </div>
  )
}
