'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface DashData {
  name: string
  healthScore: number
  weightKg: number
  bfPct: number
  muscleKg: number
  bmr: number
  visceralGrade: number
  calorieTarget: number
  waterTarget: number
  calorieToday: number
  waterToday: number
  goal: string
}

function Ring({ value, max, size = 100, stroke = 10, color = '#f97316', label, sub }: {
  value: number; max: number; size?: number; stroke?: number; color?: string; label: string; sub?: string
}) {
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const pct = Math.min(value / max, 1)
  const offset = circ * (1 - pct)
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1a1a1a" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s ease' }} />
      </svg>
      <div className="text-center -mt-1">
        <div className="text-xl font-black" style={{ color }}>{value}</div>
        <div className="text-xs font-bold uppercase tracking-widest" style={{ color: '#64748b' }}>{label}</div>
        {sub && <div className="text-xs" style={{ color: '#3f4a58' }}>{sub}</div>}
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, unit, color = '#f97316', sub }: {
  icon: string; label: string; value: string | number; unit: string; color?: string; sub?: string
}) {
  return (
    <div className="rounded-xl p-4 relative overflow-hidden" style={{ background: '#111', border: '1px solid #1a1a1a' }}>
      <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: `linear-gradient(90deg,${color},transparent)` }} />
      <div className="text-lg mb-1">{icon}</div>
      <div className="text-xs font-extrabold uppercase tracking-widest mb-1" style={{ color: '#64748b' }}>{label}</div>
      <div className="text-2xl font-black" style={{ color }}>
        {value}<span className="text-sm font-bold ml-1" style={{ color: '#64748b' }}>{unit}</span>
      </div>
      {sub && <div className="text-xs mt-1" style={{ color: '#3f4a58' }}>{sub}</div>}
    </div>
  )
}

function ProgressBar({ value, max, color = '#f97316', label, valueLabel }: {
  value: number; max: number; color?: string; label: string; valueLabel: string
}) {
  const pct = Math.min((value / max) * 100, 100)
  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-xs font-extrabold uppercase tracking-widest" style={{ color: '#64748b' }}>{label}</span>
        <span className="text-xs font-black" style={{ color }}>{valueLabel}</span>
      </div>
      <div className="h-2 rounded-full" style={{ background: '#1a1a1a' }}>
        <div className="h-2 rounded-full transition-all duration-1000"
          style={{ width: `${pct}%`, background: `linear-gradient(90deg,${color},${color}dd)` }} />
      </div>
    </div>
  )
}

const GOAL_LABELS: Record<string, string> = {
  lose_fat: '🔥 Lose Fat', build_muscle: '💪 Build Muscle',
  body_recomp: '⚡ Body Recomp', maintain: '⚖️ Maintain', improve_health: '❤️ Improve Health',
}

export default function DashboardPage() {
  const supabase = createClient()
  const [data, setData] = useState<DashData | null>(null)
  const [loading, setLoading] = useState(true)
  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [{ data: profile }, { data: scan }, { data: meals }, { data: water }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('body_scans').select('*').eq('user_id', user.id).order('scan_date', { ascending: false }).limit(1).single(),
        supabase.from('meal_logs').select('calories').eq('user_id', user.id).eq('log_date', today),
        supabase.from('water_logs').select('cups_consumed').eq('user_id', user.id).eq('log_date', today).single(),
      ])

      const calorieToday = meals?.reduce((s, m) => s + (m.calories || 0), 0) ?? 0

      setData({
        name: profile?.full_name?.split(' ')[0] || 'there',
        healthScore: scan?.health_score ?? 54,
        weightKg: scan?.weight_kg ?? 0,
        bfPct: scan?.body_fat_pct ?? 0,
        muscleKg: scan?.muscle_kg ?? 0,
        bmr: scan?.bmr ?? 0,
        visceralGrade: scan?.visceral_fat_grade ?? 0,
        calorieTarget: profile?.calorie_target ?? 2200,
        waterTarget: profile?.water_target_cups ?? 10,
        calorieToday,
        waterToday: water?.cups_consumed ?? 0,
        goal: profile?.primary_goal ?? 'lose_fat',
      })
      setLoading(false)
    }
    load()
  }, [today])

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="text-3xl mb-3 animate-pulse">🔥</div>
        <div className="text-sm font-bold" style={{ color: '#64748b' }}>Loading your stats…</div>
      </div>
    </div>
  )

  if (!data) return null

  const scoreColor = data.healthScore >= 70 ? '#22c55e' : data.healthScore >= 50 ? '#eab308' : '#ef4444'

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-black">
          {greeting()}, <span style={{ background: 'linear-gradient(90deg,#f97316,#eab308)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{data.name}</span> 👋
        </h1>
        <p className="text-sm mt-1" style={{ color: '#64748b' }}>
          {GOAL_LABELS[data.goal]} — {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      {/* Health Score + Quick Stats */}
      <div className="rounded-xl p-5 mb-4 relative overflow-hidden" style={{ background: '#111', border: '1px solid #1a1a1a' }}>
        <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: 'linear-gradient(90deg,#f97316,#eab308)' }} />
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-extrabold uppercase tracking-widest mb-1" style={{ color: '#64748b' }}>Health Score</div>
            <div className="text-6xl font-black mb-1" style={{ color: scoreColor }}>{data.healthScore}</div>
            <div className="text-xs font-bold" style={{ color: '#64748b' }}>/ 100 — {data.healthScore < 60 ? 'Needs Improvement' : data.healthScore < 75 ? 'Getting Better' : 'Great Shape'}</div>
            <div className="mt-3 flex items-center gap-2">
              <div className="h-2 rounded-full flex-1" style={{ background: '#1a1a1a' }}>
                <div className="h-2 rounded-full" style={{ width: `${data.healthScore}%`, background: `linear-gradient(90deg,${scoreColor},${scoreColor}88)`, transition: 'width 1s ease' }} />
              </div>
            </div>
          </div>
          <svg width={120} height={120} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
            <circle cx={60} cy={60} r={50} fill="none" stroke="#1a1a1a" strokeWidth={12} />
            <circle cx={60} cy={60} r={50} fill="none" stroke={scoreColor} strokeWidth={12}
              strokeDasharray={314} strokeDashoffset={314 * (1 - data.healthScore / 100)}
              strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s ease' }} />
          </svg>
        </div>

        {data.visceralGrade > 0 && (
          <div className="mt-3 px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2"
            style={{ background: data.visceralGrade > 12 ? 'rgba(239,68,68,0.1)' : 'rgba(234,179,8,0.1)', color: data.visceralGrade > 12 ? '#ef4444' : '#eab308', border: `1px solid ${data.visceralGrade > 12 ? 'rgba(239,68,68,0.2)' : 'rgba(234,179,8,0.2)'}` }}>
            ⚠️ Visceral Fat Grade: {data.visceralGrade} — {data.visceralGrade > 12 ? 'High Risk' : 'Moderate'} — Reducing visceral fat is priority #1
          </div>
        )}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <StatCard icon="⚖️" label="Weight" value={data.weightKg || '—'} unit="kg"
          sub={data.weightKg ? `BMI ~${((data.weightKg / (1.71 * 1.71))).toFixed(1)}` : undefined} />
        <StatCard icon="📊" label="Body Fat" value={data.bfPct || '—'} unit="%" color="#6366f1"
          sub={data.bfPct ? (data.bfPct > 30 ? 'Obese range' : data.bfPct > 25 ? 'High range' : 'Normal range') : undefined} />
        <StatCard icon="💪" label="Muscle Mass" value={data.muscleKg || '—'} unit="kg" color="#22c55e" />
        <StatCard icon="🔥" label="BMR" value={data.bmr || '—'} unit="kcal" color="#eab308"
          sub="Base metabolic rate" />
      </div>

      {/* Today's progress */}
      <div className="rounded-xl p-5 mb-4" style={{ background: '#111', border: '1px solid #1a1a1a' }}>
        <div className="text-xs font-extrabold uppercase tracking-widest mb-4" style={{ color: '#64748b' }}>Today&apos;s Progress</div>
        <div className="space-y-4">
          <ProgressBar value={data.calorieToday} max={data.calorieTarget} label="Calories"
            valueLabel={`${data.calorieToday} / ${data.calorieTarget} kcal`} />
          <ProgressBar value={data.waterToday} max={data.waterTarget} color="#22d3ee" label="Water"
            valueLabel={`${data.waterToday} / ${data.waterTarget} cups`} />
        </div>
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="rounded-lg p-3 text-center" style={{ background: '#181818' }}>
            <div className="text-2xl font-black" style={{ color: '#f97316' }}>{data.calorieTarget - data.calorieToday}</div>
            <div className="text-xs font-bold uppercase tracking-widest" style={{ color: '#64748b' }}>kcal remaining</div>
          </div>
          <div className="rounded-lg p-3 text-center" style={{ background: '#181818' }}>
            <div className="text-2xl font-black" style={{ color: '#22d3ee' }}>{Math.max(0, data.waterTarget - data.waterToday)}</div>
            <div className="text-xs font-bold uppercase tracking-widest" style={{ color: '#64748b' }}>cups left</div>
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { href: '/workout', icon: '💪', label: 'Log Workout', color: '#6366f1' },
          { href: '/meals', icon: '🍽️', label: 'Log Meal', color: '#22c55e' },
          { href: '/progress', icon: '📈', label: 'Log Weight', color: '#f97316' },
        ].map(q => (
          <a key={q.href} href={q.href}
            className="rounded-xl p-3 text-center transition-all hover:scale-105 active:scale-95"
            style={{ background: '#111', border: `1px solid ${q.color}22` }}>
            <div className="text-2xl mb-1">{q.icon}</div>
            <div className="text-xs font-extrabold uppercase tracking-widest" style={{ color: q.color }}>{q.label}</div>
          </a>
        ))}
      </div>
    </div>
  )
}
