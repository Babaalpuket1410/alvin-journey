'use client'
import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/database'

type Exercise = Database['public']['Tables']['exercises']['Row']

const MUSCLE_GROUPS = ['Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Legs', 'Glutes', 'Core', 'Cardio', 'Full Body']
const STRENGTH_EXERCISES = ['Bench Press', 'Incline Bench', 'Pull-ups', 'Lat Pulldown', 'Barbell Row', 'Shoulder Press', 'Lateral Raise', 'Bicep Curl', 'Tricep Dip', 'Squat', 'Leg Press', 'Deadlift', 'Lunges', 'Plank', 'Cable Fly', 'Chest Dip']
const CARDIO_EXERCISES = ['Treadmill', 'Cycling', 'Elliptical', 'Rowing Machine', 'Jump Rope', 'Stair Climber', 'Swimming', 'HIIT', 'Walking', 'Running']
const INTENSITY = ['Low', 'Moderate', 'High', 'Max']

function RestTimer({ seconds, onDone }: { seconds: number; onDone: () => void }) {
  const [left, setLeft] = useState(seconds)
  useEffect(() => {
    if (left <= 0) { onDone(); return }
    const t = setTimeout(() => setLeft(v => v - 1), 1000)
    return () => clearTimeout(t)
  }, [left, onDone])
  const pct = (left / seconds) * 100
  const color = left <= 10 ? '#ef4444' : left <= 30 ? '#eab308' : '#22c55e'
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}>
      <div className="rounded-2xl p-8 text-center relative overflow-hidden max-w-xs w-full mx-4"
        style={{ background: '#111', border: `2px solid ${color}` }}>
        <div className="text-xs font-extrabold uppercase tracking-widest mb-4" style={{ color: '#64748b' }}>Rest Timer</div>
        <svg width={160} height={160} className="mx-auto mb-4" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={80} cy={80} r={70} fill="none" stroke="#1a1a1a" strokeWidth={10} />
          <circle cx={80} cy={80} r={70} fill="none" stroke={color} strokeWidth={10}
            strokeDasharray={440} strokeDashoffset={440 * (1 - pct / 100)} strokeLinecap="round" />
        </svg>
        <div className="text-6xl font-black -mt-6 mb-2" style={{ color }}>{left}s</div>
        <div className="text-sm font-bold mb-4" style={{ color: '#64748b' }}>Resting…</div>
        <button onClick={onDone}
          className="w-full py-3 rounded-xl text-sm font-black uppercase tracking-widest text-black"
          style={{ background: 'linear-gradient(90deg,#f97316,#eab308)' }}>
          Skip Rest ⚡
        </button>
      </div>
    </div>
  )
}

export default function WorkoutPage() {
  const supabase = createClient()
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)
  const [restTimer, setRestTimer] = useState<{ active: boolean; seconds: number }>({ active: false, seconds: 90 })
  const [addType, setAddType] = useState<'strength' | 'cardio'>('strength')
  const [form, setForm] = useState({
    name: '', category: 'Chest', muscle_groups: ['Chest'] as string[],
    sets: '3', reps: '10', weight_kg: '0', rest_seconds: '90',
    duration_min: '30', distance_km: '', speed_kmh: '', incline_pct: '', intensity: 'Moderate',
  })
  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      let { data: session } = await supabase.from('workout_sessions').select('id').eq('user_id', user.id).eq('session_date', today).single()
      if (!session) {
        const { data: newSession } = await supabase.from('workout_sessions').insert({ user_id: user.id, session_date: today, notes: null }).select('id').single()
        session = newSession
      }
      if (session) {
        setSessionId(session.id)
        const { data: exs } = await supabase.from('exercises').select('*').eq('session_id', session.id).order('created_at')
        setExercises(exs || [])
      }
      setLoading(false)
    }
    load()
  }, [today])

  async function addExercise() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !sessionId) return
    const base = { session_id: sessionId, user_id: user.id, name: form.name || (addType === 'strength' ? 'Exercise' : 'Cardio'), type: addType, category: form.category, muscle_groups: form.muscle_groups, is_done: false, notes: null }
    const data = addType === 'strength'
      ? { ...base, sets: parseInt(form.sets) || 3, reps: parseInt(form.reps) || 10, weight_kg: parseFloat(form.weight_kg) || 0, rest_seconds: parseInt(form.rest_seconds) || 90, duration_min: null, distance_km: null, speed_kmh: null, incline_pct: null, intensity: null }
      : { ...base, sets: null, reps: null, weight_kg: null, rest_seconds: null, duration_min: parseInt(form.duration_min) || 30, distance_km: form.distance_km ? parseFloat(form.distance_km) : null, speed_kmh: form.speed_kmh ? parseFloat(form.speed_kmh) : null, incline_pct: form.incline_pct ? parseFloat(form.incline_pct) : null, intensity: form.intensity }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: ex } = await supabase.from('exercises').insert(data as any).select().single()
    if (ex) setExercises(v => [...v, ex])
    setAddOpen(false)
    setForm({ name: '', category: 'Chest', muscle_groups: ['Chest'], sets: '3', reps: '10', weight_kg: '0', rest_seconds: '90', duration_min: '30', distance_km: '', speed_kmh: '', incline_pct: '', intensity: 'Moderate' })
  }

  async function updateExercise(id: string, patch: Partial<Exercise>) {
    setExercises(v => v.map(e => e.id === id ? { ...e, ...patch } : e))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await supabase.from('exercises').update(patch as any).eq('id', id)
    if (patch.is_done && patch.is_done === true) {
      const ex = exercises.find(e => e.id === id)
      if (ex?.type === 'strength' && ex.rest_seconds) setRestTimer({ active: true, seconds: ex.rest_seconds })
    }
  }

  async function deleteExercise(id: string) {
    setExercises(v => v.filter(e => e.id !== id))
    await supabase.from('exercises').delete().eq('id', id)
  }

  function toggleMuscle(m: string) {
    setForm(f => ({
      ...f,
      muscle_groups: f.muscle_groups.includes(m) ? f.muscle_groups.filter(x => x !== m) : [...f.muscle_groups, m]
    }))
  }

  const inputCls = "rounded-md px-2 py-1 text-xs font-semibold outline-none bg-[#181818] border border-[#222] text-[#f1f5f9] focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 transition-all w-full"

  const strength = exercises.filter(e => e.type === 'strength')
  const cardio = exercises.filter(e => e.type === 'cardio')

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {restTimer.active && <RestTimer seconds={restTimer.seconds} onDone={() => setRestTimer(v => ({ ...v, active: false }))} />}

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black">Workout</h1>
          <p className="text-sm mt-0.5" style={{ color: '#64748b' }}>{new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
        <button onClick={() => setAddOpen(true)}
          className="px-4 py-2 rounded-xl text-sm font-black uppercase tracking-widest text-black"
          style={{ background: 'linear-gradient(90deg,#f97316,#eab308)' }}>
          + Add
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12"><div className="text-3xl animate-pulse">💪</div><div className="text-sm mt-2" style={{ color: '#64748b' }}>Loading workout…</div></div>
      ) : exercises.length === 0 ? (
        <div className="rounded-xl p-10 text-center" style={{ background: '#111', border: '1px solid #1a1a1a' }}>
          <div className="text-4xl mb-3">💪</div>
          <div className="text-lg font-black mb-1">No exercises yet</div>
          <div className="text-sm mb-4" style={{ color: '#64748b' }}>Tap + Add to start today&apos;s workout</div>
          <button onClick={() => setAddOpen(true)}
            className="px-6 py-2 rounded-xl text-sm font-black uppercase tracking-widest text-black"
            style={{ background: 'linear-gradient(90deg,#f97316,#eab308)' }}>
            Start Workout 🔥
          </button>
        </div>
      ) : (
        <>
          {/* Strength section */}
          {strength.length > 0 && (
            <div className="mb-6">
              <div className="text-xs font-extrabold uppercase tracking-widest mb-3" style={{ color: '#f97316' }}>
                💪 Strength — {strength.length} exercise{strength.length !== 1 ? 's' : ''}
              </div>
              <div className="space-y-2">
                {strength.map(ex => (
                  <ExerciseRow key={ex.id} ex={ex} onUpdate={patch => updateExercise(ex.id, patch)} onDelete={() => deleteExercise(ex.id)} />
                ))}
              </div>
            </div>
          )}
          {/* Cardio section */}
          {cardio.length > 0 && (
            <div className="mb-6">
              <div className="text-xs font-extrabold uppercase tracking-widest mb-3" style={{ color: '#22d3ee' }}>
                🏃 Cardio — {cardio.length} exercise{cardio.length !== 1 ? 's' : ''}
              </div>
              <div className="space-y-2">
                {cardio.map(ex => (
                  <ExerciseRow key={ex.id} ex={ex} onUpdate={patch => updateExercise(ex.id, patch)} onDelete={() => deleteExercise(ex.id)} />
                ))}
              </div>
            </div>
          )}

          {/* Stats summary */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl p-3 text-center" style={{ background: '#111', border: '1px solid #1a1a1a' }}>
              <div className="text-2xl font-black" style={{ color: '#f97316' }}>{exercises.filter(e => e.is_done).length}</div>
              <div className="text-xs font-bold uppercase tracking-widest" style={{ color: '#64748b' }}>Done</div>
            </div>
            <div className="rounded-xl p-3 text-center" style={{ background: '#111', border: '1px solid #1a1a1a' }}>
              <div className="text-2xl font-black" style={{ color: '#eab308' }}>{exercises.length}</div>
              <div className="text-xs font-bold uppercase tracking-widest" style={{ color: '#64748b' }}>Total</div>
            </div>
            <div className="rounded-xl p-3 text-center" style={{ background: '#111', border: '1px solid #1a1a1a' }}>
              <div className="text-2xl font-black" style={{ color: '#22c55e' }}>{Math.round((exercises.filter(e => e.is_done).length / exercises.length) * 100)}%</div>
              <div className="text-xs font-bold uppercase tracking-widest" style={{ color: '#64748b' }}>Progress</div>
            </div>
          </div>
        </>
      )}

      {/* Add exercise modal */}
      {addOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0" style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-lg rounded-2xl overflow-hidden" style={{ background: '#0f0f0f', border: '1px solid #222', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="sticky top-0 flex items-center justify-between px-5 py-4 border-b z-10" style={{ background: '#0f0f0f', borderColor: '#222' }}>
              <div className="text-sm font-black uppercase tracking-widest" style={{ color: '#f97316' }}>Add Exercise</div>
              <button onClick={() => setAddOpen(false)} style={{ color: '#64748b' }} className="text-lg font-bold">✕</button>
            </div>
            <div className="p-5 space-y-4">
              {/* Type toggle */}
              <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: '#222' }}>
                {(['strength', 'cardio'] as const).map(t => (
                  <button key={t} onClick={() => setAddType(t)}
                    className="flex-1 py-2 text-xs font-black uppercase tracking-widest transition-all"
                    style={{ background: addType === t ? (t === 'strength' ? 'rgba(249,115,22,0.15)' : 'rgba(34,211,238,0.15)') : 'transparent', color: addType === t ? (t === 'strength' ? '#f97316' : '#22d3ee') : '#64748b' }}>
                    {t === 'strength' ? '💪 Strength' : '🏃 Cardio'}
                  </button>
                ))}
              </div>

              {/* Exercise name */}
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-widest mb-1 text-[#64748b]">Exercise Name</label>
                <div className="relative">
                  <input list="ex-list" className={inputCls.replace('text-xs', 'text-sm') + ' py-2'} value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder={addType === 'strength' ? 'e.g. Bench Press' : 'e.g. Treadmill'} />
                  <datalist id="ex-list">
                    {(addType === 'strength' ? STRENGTH_EXERCISES : CARDIO_EXERCISES).map(e => <option key={e} value={e} />)}
                  </datalist>
                </div>
              </div>

              {/* Muscle groups */}
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-widest mb-2 text-[#64748b]">Muscle Groups</label>
                <div className="flex flex-wrap gap-1.5">
                  {MUSCLE_GROUPS.map(m => (
                    <button key={m} onClick={() => toggleMuscle(m)}
                      className="px-2.5 py-1 rounded-full text-xs font-bold transition-all"
                      style={{
                        background: form.muscle_groups.includes(m) ? 'rgba(249,115,22,0.15)' : '#181818',
                        border: `1px solid ${form.muscle_groups.includes(m) ? '#f97316' : '#222'}`,
                        color: form.muscle_groups.includes(m) ? '#f97316' : '#64748b',
                      }}>
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Strength fields */}
              {addType === 'strength' && (
                <div className="grid grid-cols-4 gap-2">
                  {[['sets', 'Sets'], ['reps', 'Reps'], ['weight_kg', 'Weight (kg)'], ['rest_seconds', 'Rest (s)']].map(([k, lbl]) => (
                    <div key={k}>
                      <label className="block text-xs font-extrabold uppercase tracking-widest mb-1 text-[#64748b]">{lbl}</label>
                      <input type="number" className={inputCls} value={form[k as keyof typeof form] as string}
                        onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} />
                    </div>
                  ))}
                </div>
              )}

              {/* Cardio fields */}
              {addType === 'cardio' && (
                <div className="grid grid-cols-2 gap-2">
                  {[['duration_min', 'Duration (min)'], ['distance_km', 'Distance (km)'], ['speed_kmh', 'Speed (km/h)'], ['incline_pct', 'Incline (%)']].map(([k, lbl]) => (
                    <div key={k}>
                      <label className="block text-xs font-extrabold uppercase tracking-widest mb-1 text-[#64748b]">{lbl}</label>
                      <input type="number" className={inputCls} value={form[k as keyof typeof form] as string}
                        onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} />
                    </div>
                  ))}
                  <div className="col-span-2">
                    <label className="block text-xs font-extrabold uppercase tracking-widest mb-1 text-[#64748b]">Intensity</label>
                    <select className={inputCls} value={form.intensity} onChange={e => setForm(f => ({ ...f, intensity: e.target.value }))}>
                      {INTENSITY.map(i => <option key={i} value={i}>{i}</option>)}
                    </select>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button onClick={() => setAddOpen(false)}
                  className="flex-1 py-3 rounded-xl text-sm font-black uppercase tracking-widest transition-all"
                  style={{ background: '#111', border: '1px solid #222', color: '#64748b' }}>Cancel</button>
                <button onClick={addExercise}
                  className="flex-1 py-3 rounded-xl text-sm font-black uppercase tracking-widest text-black"
                  style={{ background: 'linear-gradient(90deg,#f97316,#eab308)' }}>Add Exercise</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ExerciseRow({ ex, onUpdate, onDelete }: { ex: Exercise; onUpdate: (p: Partial<Exercise>) => void; onDelete: () => void }) {
  const [editing, setEditing] = useState(false)
  const [vals, setVals] = useState({
    sets: String(ex.sets ?? ''), reps: String(ex.reps ?? ''), weight_kg: String(ex.weight_kg ?? ''),
    rest_seconds: String(ex.rest_seconds ?? ''), duration_min: String(ex.duration_min ?? ''),
    distance_km: String(ex.distance_km ?? ''), speed_kmh: String(ex.speed_kmh ?? ''),
    incline_pct: String(ex.incline_pct ?? ''), intensity: ex.intensity ?? 'Moderate',
  })

  const inputCls = "rounded px-1.5 py-1 text-xs font-semibold outline-none bg-[#0f0f0f] border border-[#333] text-[#f1f5f9] focus:border-orange-500 w-16 text-center"

  function save() {
    const patch = ex.type === 'strength'
      ? { sets: parseInt(vals.sets) || null, reps: parseInt(vals.reps) || null, weight_kg: parseFloat(vals.weight_kg) || null, rest_seconds: parseInt(vals.rest_seconds) || null }
      : { duration_min: parseInt(vals.duration_min) || null, distance_km: vals.distance_km ? parseFloat(vals.distance_km) : null, speed_kmh: vals.speed_kmh ? parseFloat(vals.speed_kmh) : null, incline_pct: vals.incline_pct ? parseFloat(vals.incline_pct) : null, intensity: vals.intensity }
    onUpdate(patch)
    setEditing(false)
  }

  return (
    <div className="rounded-xl p-4 transition-all"
      style={{ background: '#111', border: `1px solid ${ex.is_done ? '#22c55e33' : '#1a1a1a'}`, opacity: ex.is_done ? 0.8 : 1 }}>
      <div className="flex items-start gap-3">
        {/* Done checkbox */}
        <button onClick={() => onUpdate({ is_done: !ex.is_done })}
          className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 transition-all"
          style={{ background: ex.is_done ? '#22c55e' : 'transparent', border: `2px solid ${ex.is_done ? '#22c55e' : '#333'}` }}>
          {ex.is_done && <span className="text-[10px] font-black text-black">✓</span>}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="text-sm font-black" style={{ color: ex.is_done ? '#64748b' : '#f1f5f9', textDecoration: ex.is_done ? 'line-through' : 'none' }}>{ex.name}</div>
              {/* Muscle chips */}
              {ex.muscle_groups?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {ex.muscle_groups.map(m => (
                    <span key={m} className="px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                      style={{ background: 'rgba(249,115,22,0.1)', color: '#f97316', border: '1px solid rgba(249,115,22,0.2)' }}>{m}</span>
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-1">
              <button onClick={() => setEditing(v => !v)} className="p-1.5 rounded-lg transition-all hover:bg-[#1a1a1a]" style={{ color: '#64748b', fontSize: 12 }}>✏️</button>
              <button onClick={onDelete} className="p-1.5 rounded-lg transition-all hover:bg-[#1a1a1a]" style={{ color: '#ef4444', fontSize: 12 }}>✕</button>
            </div>
          </div>

          {/* Inline display */}
          {!editing && (
            <div className="flex flex-wrap gap-3 mt-2">
              {ex.type === 'strength' ? (
                <>
                  {ex.sets && <Chip label="Sets" value={String(ex.sets)} />}
                  {ex.reps && <Chip label="Reps" value={String(ex.reps)} />}
                  <Chip label="Weight" value={ex.weight_kg === 0 ? 'BW' : `${ex.weight_kg}kg`} />
                  {ex.rest_seconds && <Chip label="Rest" value={`${ex.rest_seconds}s`} color="#6366f1" />}
                </>
              ) : (
                <>
                  {ex.duration_min && <Chip label="Duration" value={`${ex.duration_min}min`} color="#22d3ee" />}
                  {ex.distance_km && <Chip label="Distance" value={`${ex.distance_km}km`} color="#22d3ee" />}
                  {ex.speed_kmh && <Chip label="Speed" value={`${ex.speed_kmh}km/h`} color="#22d3ee" />}
                  {ex.incline_pct && <Chip label="Incline" value={`${ex.incline_pct}%`} color="#eab308" />}
                  {ex.intensity && <Chip label="Intensity" value={ex.intensity} color="#6366f1" />}
                </>
              )}
            </div>
          )}

          {/* Inline edit */}
          {editing && (
            <div className="mt-3 space-y-2">
              {ex.type === 'strength' ? (
                <div className="flex flex-wrap gap-2">
                  {[['sets', 'Sets'], ['reps', 'Reps'], ['weight_kg', 'Kg'], ['rest_seconds', 'Rest(s)']].map(([k, lbl]) => (
                    <div key={k} className="flex flex-col items-center gap-1">
                      <label className="text-[9px] font-extrabold uppercase tracking-widest" style={{ color: '#64748b' }}>{lbl}</label>
                      <input type="number" className={inputCls} value={vals[k as keyof typeof vals] as string}
                        onChange={e => setVals(v => ({ ...v, [k]: e.target.value }))} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {[['duration_min', 'Min'], ['distance_km', 'Km'], ['speed_kmh', 'km/h'], ['incline_pct', 'Incline%']].map(([k, lbl]) => (
                    <div key={k} className="flex flex-col items-center gap-1">
                      <label className="text-[9px] font-extrabold uppercase tracking-widest" style={{ color: '#64748b' }}>{lbl}</label>
                      <input type="number" className={inputCls} value={vals[k as keyof typeof vals] as string}
                        onChange={e => setVals(v => ({ ...v, [k]: e.target.value }))} />
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <button onClick={() => setEditing(false)} className="px-3 py-1.5 rounded-lg text-xs font-black uppercase" style={{ background: '#1a1a1a', color: '#64748b' }}>Cancel</button>
                <button onClick={save} className="px-3 py-1.5 rounded-lg text-xs font-black uppercase text-black" style={{ background: 'linear-gradient(90deg,#f97316,#eab308)' }}>Save</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Chip({ label, value, color = '#f97316' }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-[9px] font-extrabold uppercase tracking-widest" style={{ color: '#3f4a58' }}>{label}</span>
      <span className="text-xs font-black" style={{ color }}>{value}</span>
    </div>
  )
}
