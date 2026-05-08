'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const GOAL_CONFIG: Record<string, { weeklyOptions: string[]; hint: string; calDefault: number }> = {
  lose_fat:       { weeklyOptions: ['−0.25 kg/week (Gentle)','−0.5 kg/week (Recommended)','−0.75 kg/week (Aggressive)','−1.0 kg/week (Very Aggressive)'], hint: '🔥 Calorie deficit is key. We recommend −500 kcal/day for steady −0.5 kg/week.', calDefault: 2200 },
  build_muscle:   { weeklyOptions: ['+0.1 kg/week (Lean Bulk)','+0.25 kg/week (Moderate)','+0.5 kg/week (Aggressive Bulk)'], hint: '💪 Calorie surplus required. +200–400 kcal/day. High protein (1.6–2.2 g/kg BW).', calDefault: 2700 },
  body_recomp:    { weeklyOptions: ['3 workouts/week','4 workouts/week','5 workouts/week'], hint: '⚡ Eat at maintenance. Lose fat AND gain muscle simultaneously — slower but sustainable.', calDefault: 2400 },
  maintain:       { weeklyOptions: ['Weekly weigh-in','Bi-weekly weigh-in','Monthly weigh-in'], hint: '⚖️ Eat at TDEE. Focus on consistency and habit-building.', calDefault: 2500 },
  improve_health: { weeklyOptions: ['2 workouts/week','3 workouts/week','4 workouts/week','5+ workouts/week'], hint: '❤️ Consistency over intensity. Reduce visceral fat as top priority.', calDefault: 2300 },
}

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = createClient()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    full_name: '', date_of_birth: '', gender: 'male', timezone: 'Asia/Jakarta',
    height_cm: '', activity_level: 'moderate',
    primary_goal: 'lose_fat', target_weight_kg: '', weekly_target: '',
    calorie_target: '2200', protein_target: '160', carb_target: '220', fat_target: '73', water_target_cups: '10',
  })

  const cfg = GOAL_CONFIG[form.primary_goal]

  function set(k: string, v: string) {
    setForm(f => {
      const next = { ...f, [k]: v }
      if (k === 'primary_goal') {
        next.calorie_target = String(GOAL_CONFIG[v].calDefault)
        next.weekly_target = ''
      }
      return next
    })
  }

  async function save() {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    await supabase.from('profiles').update({
      full_name: form.full_name || user.email!,
      date_of_birth: form.date_of_birth || null,
      gender: form.gender, timezone: form.timezone,
      height_cm: form.height_cm ? parseFloat(form.height_cm) : null,
      activity_level: form.activity_level, primary_goal: form.primary_goal,
      target_weight_kg: form.target_weight_kg ? parseFloat(form.target_weight_kg) : null,
      weekly_target: form.weekly_target || cfg.weeklyOptions[1] || cfg.weeklyOptions[0],
      calorie_target: parseInt(form.calorie_target) || 2200,
      protein_target: parseInt(form.protein_target) || 160,
      carb_target: parseInt(form.carb_target) || 220,
      fat_target: parseInt(form.fat_target) || 73,
      water_target_cups: parseInt(form.water_target_cups) || 10,
    }).eq('id', user.id)

    router.push('/dashboard')
  }

  const inputCls = "w-full rounded-md px-3 py-2 text-sm font-semibold outline-none bg-[#181818] border border-[#222] text-[#f1f5f9] focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 transition-all"

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10"
      style={{ background: 'radial-gradient(ellipse at 70% 10%, rgba(99,102,241,.07) 0%, transparent 50%), #080808' }}>
      <div className="w-full max-w-xl">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4"
            style={{ background: 'linear-gradient(135deg,#f97316,#eab308)' }}>👋</div>
          <h2 className="text-2xl font-black tracking-tight">
            Welcome! Set up your <span style={{ background: 'linear-gradient(90deg,#f97316,#eab308)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>profile</span>
          </h2>
          <p className="text-sm mt-1" style={{ color: '#64748b' }}>We need a few details to personalise your journey</p>
        </div>

        {/* Step 1 */}
        <div className="text-xs font-extrabold uppercase tracking-widest mb-2" style={{ color: '#f97316' }}>Step 1 — Personal Info</div>
        <div className="rounded-xl p-6 mb-4 relative overflow-hidden" style={{ background: '#111', border: '1px solid #222' }}>
          <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: 'linear-gradient(90deg,#6366f1,#22d3ee)' }} />
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div><label className="block text-xs font-extrabold uppercase tracking-widest mb-1 text-[#64748b]">Full Name</label><input className={inputCls} value={form.full_name} onChange={e=>set('full_name',e.target.value)} placeholder="Your full name" /></div>
            <div><label className="block text-xs font-extrabold uppercase tracking-widest mb-1 text-[#64748b]">Date of Birth</label><input type="date" className={inputCls} value={form.date_of_birth} onChange={e=>set('date_of_birth',e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-3 gap-3 mb-3">
            <div><label className="block text-xs font-extrabold uppercase tracking-widest mb-1 text-[#64748b]">Gender</label>
              <select className={inputCls} value={form.gender} onChange={e=>set('gender',e.target.value)}>
                <option value="male">Male</option><option value="female">Female</option>
              </select></div>
            <div><label className="block text-xs font-extrabold uppercase tracking-widest mb-1 text-[#64748b]">Timezone</label>
              <select className={inputCls} value={form.timezone} onChange={e=>set('timezone',e.target.value)}>
                <option value="Asia/Jakarta">WIB (Jakarta)</option>
                <option value="Asia/Makassar">WITA (Makassar)</option>
                <option value="Asia/Jayapura">WIT (Jayapura)</option>
              </select></div>
            <div><label className="block text-xs font-extrabold uppercase tracking-widest mb-1 text-[#64748b]">Activity Level</label>
              <select className={inputCls} value={form.activity_level} onChange={e=>set('activity_level',e.target.value)}>
                <option value="sedentary">Sedentary</option><option value="light">Light</option>
                <option value="moderate">Moderate</option><option value="active">Active</option>
                <option value="very_active">Very Active</option>
              </select></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs font-extrabold uppercase tracking-widest mb-1 text-[#64748b]">Height (cm)</label><input type="number" className={inputCls} value={form.height_cm} onChange={e=>set('height_cm',e.target.value)} placeholder="171" /></div>
            <div><label className="block text-xs font-extrabold uppercase tracking-widest mb-1 text-[#64748b]">Current Weight (kg)</label><input type="number" className={inputCls} placeholder="Enter in Progress tab" disabled style={{opacity:.5}} /></div>
          </div>
        </div>

        {/* Step 2 */}
        <div className="text-xs font-extrabold uppercase tracking-widest mb-2" style={{ color: '#f97316' }}>Step 2 — Your Goals</div>
        <div className="rounded-xl p-6 mb-6 relative overflow-hidden" style={{ background: '#111', border: '1px solid #222' }}>
          <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: 'linear-gradient(90deg,#f97316,#eab308)' }} />
          <div className="grid grid-cols-3 gap-3 mb-3">
            <div><label className="block text-xs font-extrabold uppercase tracking-widest mb-1 text-[#64748b]">Primary Goal</label>
              <select className={inputCls} value={form.primary_goal} onChange={e=>set('primary_goal',e.target.value)}>
                <option value="lose_fat">🔥 Lose Fat</option>
                <option value="build_muscle">💪 Build Muscle</option>
                <option value="body_recomp">⚡ Body Recomposition</option>
                <option value="maintain">⚖️ Maintain Weight</option>
                <option value="improve_health">❤️ Improve Health</option>
              </select></div>
            <div><label className="block text-xs font-extrabold uppercase tracking-widest mb-1 text-[#64748b]">Target Weight (kg)</label><input type="number" className={inputCls} value={form.target_weight_kg} onChange={e=>set('target_weight_kg',e.target.value)} placeholder="72" /></div>
            <div><label className="block text-xs font-extrabold uppercase tracking-widest mb-1 text-[#64748b]">Weekly Target</label>
              <select className={inputCls} value={form.weekly_target} onChange={e=>set('weekly_target',e.target.value)}>
                {cfg.weeklyOptions.map(o=><option key={o} value={o}>{o}</option>)}
              </select></div>
          </div>

          {/* hint */}
          <div className="rounded-lg px-4 py-3 mb-4 text-sm border-l-4" style={{ background: '#181818', borderLeftColor: '#f97316', color: '#94a3b8' }}>{cfg.hint}</div>

          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs font-extrabold uppercase tracking-widest mb-1 text-[#64748b]">Daily Calorie Target</label><input type="number" className={inputCls} value={form.calorie_target} onChange={e=>set('calorie_target',e.target.value)} /></div>
            <div><label className="block text-xs font-extrabold uppercase tracking-widest mb-1 text-[#64748b]">Daily Water (cups)</label><input type="number" className={inputCls} value={form.water_target_cups} onChange={e=>set('water_target_cups',e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-3 gap-3 mt-3">
            <div><label className="block text-xs font-extrabold uppercase tracking-widest mb-1 text-[#64748b]">Protein (g)</label><input type="number" className={inputCls} value={form.protein_target} onChange={e=>set('protein_target',e.target.value)} /></div>
            <div><label className="block text-xs font-extrabold uppercase tracking-widest mb-1 text-[#64748b]">Carbs (g)</label><input type="number" className={inputCls} value={form.carb_target} onChange={e=>set('carb_target',e.target.value)} /></div>
            <div><label className="block text-xs font-extrabold uppercase tracking-widest mb-1 text-[#64748b]">Fat (g)</label><input type="number" className={inputCls} value={form.fat_target} onChange={e=>set('fat_target',e.target.value)} /></div>
          </div>
        </div>

        <button onClick={save} disabled={saving}
          className="w-full py-4 rounded-xl text-base font-black uppercase tracking-widest text-black transition-all disabled:opacity-60"
          style={{ background: 'linear-gradient(90deg,#f97316,#eab308)' }}>
          {saving ? 'Saving…' : 'Complete Setup & Start Journey 🔥'}
        </button>
        <div className="text-center mt-4">
          <button onClick={()=>router.push('/login')} className="text-xs" style={{ color: '#64748b' }}>← Back to login</button>
        </div>
      </div>
    </div>
  )
}
