'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const QUALITY_LABELS = ['', '😫 Terrible', '😞 Poor', '😐 Fair', '😊 Good', '😄 Excellent']
const QUALITY_COLORS = ['', '#ef4444', '#f97316', '#eab308', '#22c55e', '#22d3ee']

export default function SleepPage() {
  const supabase = createClient()
  const [userId, setUserId] = useState<string | null>(null)
  const [logId, setLogId] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [log, setLog] = useState<{ bedtime: string | null; wake_time: string | null; duration_hrs: number | null; quality: number | null; notes: string | null } | null>(null)
  const [history, setHistory] = useState<any[]>([])
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ bedtime: '22:00', wake_time: '06:00', quality: '4', notes: '' })

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)
      const { data: hist } = await supabase.from('sleep_logs').select('*').eq('user_id', user.id).order('log_date', { ascending: false }).limit(14)
      setHistory(hist || [])
    }
    init()
  }, [])

  useEffect(() => { if (userId) loadDate(selectedDate) }, [selectedDate, userId])

  async function loadDate(date: string) {
    if (!userId) return
    const { data } = await supabase.from('sleep_logs').select('*').eq('user_id', userId).eq('log_date', date).single()
    if (data) {
      setLog(data); setLogId(data.id)
      setForm({ bedtime: data.bedtime || '22:00', wake_time: data.wake_time || '06:00', quality: String(data.quality || 4), notes: data.notes || '' })
    } else {
      setLog(null); setLogId(null)
      setForm({ bedtime: '22:00', wake_time: '06:00', quality: '4', notes: '' })
    }
  }

  function calcDuration(bed: string, wake: string): number {
    const [bh, bm] = bed.split(':').map(Number)
    const [wh, wm] = wake.split(':').map(Number)
    let mins = (wh * 60 + wm) - (bh * 60 + bm)
    if (mins < 0) mins += 24 * 60
    return Math.round((mins / 60) * 10) / 10
  }

  async function save() {
    if (!userId) return
    setSaving(true)
    const duration = calcDuration(form.bedtime, form.wake_time)
    const payload = {
      user_id: userId, log_date: selectedDate,
      bedtime: form.bedtime, wake_time: form.wake_time,
      duration_hrs: duration, quality: parseInt(form.quality) || null,
      notes: form.notes || null,
    }
    if (logId) {
      await supabase.from('sleep_logs').update(payload).eq('id', logId)
    } else {
      const { data } = await supabase.from('sleep_logs').insert(payload).select('id').single()
      if (data) setLogId(data.id)
    }
    setLog({ ...payload, duration_hrs: duration })
    const { data: hist } = await supabase.from('sleep_logs').select('*').eq('user_id', userId).order('log_date', { ascending: false }).limit(14)
    setHistory(hist || [])
    setSaving(false); setEditing(false)
  }

  const avgDuration = history.length ? Math.round((history.reduce((s, h) => s + (h.duration_hrs || 0), 0) / history.length) * 10) / 10 : 0
  const avgQuality = history.length ? Math.round(history.reduce((s, h) => s + (h.quality || 0), 0) / history.length * 10) / 10 : 0

  const inputCls = "w-full rounded-md px-3 py-2 text-sm font-semibold outline-none bg-[#181818] border border-[#222] text-[#f1f5f9] focus:border-indigo-500 transition-all"

  const durColor = (h: number) => h >= 8 ? '#22c55e' : h >= 7 ? '#eab308' : h >= 6 ? '#f97316' : '#ef4444'

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black">Sleep</h1>
          <p className="text-sm mt-0.5" style={{ color: '#64748b' }}>Track your sleep quality</p>
        </div>
        <div className="flex items-center gap-2">
          <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
            className="rounded-lg px-3 py-2 text-xs font-bold outline-none transition-all"
            style={{ background: '#111', border: '1px solid #222', color: '#f1f5f9' }} />
          <button onClick={() => setEditing(v => !v)}
            className="px-3 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all"
            style={{ background: editing ? 'rgba(99,102,241,0.15)' : '#111', border: `1px solid ${editing ? '#6366f1' : '#222'}`, color: editing ? '#6366f1' : '#64748b' }}>
            {editing ? '✕' : '+ Log'}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="rounded-xl p-4 relative overflow-hidden" style={{ background: '#111', border: '1px solid #1a1a1a' }}>
          <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: 'linear-gradient(90deg,#6366f1,#22d3ee)' }} />
          <div className="text-xs font-extrabold uppercase tracking-widest mb-1" style={{ color: '#64748b' }}>14-day Avg Duration</div>
          <div className="text-3xl font-black" style={{ color: durColor(avgDuration) }}>{avgDuration}<span className="text-sm font-bold ml-1" style={{ color: '#64748b' }}>hrs</span></div>
          <div className="text-xs mt-1" style={{ color: '#3f4a58' }}>Target: 7–9 hours</div>
        </div>
        <div className="rounded-xl p-4 relative overflow-hidden" style={{ background: '#111', border: '1px solid #1a1a1a' }}>
          <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: 'linear-gradient(90deg,#eab308,#f97316)' }} />
          <div className="text-xs font-extrabold uppercase tracking-widest mb-1" style={{ color: '#64748b' }}>14-day Avg Quality</div>
          <div className="text-3xl font-black" style={{ color: QUALITY_COLORS[Math.round(avgQuality)] || '#64748b' }}>{avgQuality}<span className="text-sm font-bold ml-1" style={{ color: '#64748b' }}>/5</span></div>
          <div className="text-xs mt-1" style={{ color: '#3f4a58' }}>{QUALITY_LABELS[Math.round(avgQuality)] || '—'}</div>
        </div>
      </div>

      {/* Today's log */}
      {log && !editing && (
        <div className="rounded-xl p-5 mb-4 relative overflow-hidden" style={{ background: '#111', border: '1px solid #1a1a1a' }}>
          <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: 'linear-gradient(90deg,#6366f1,#22d3ee)' }} />
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-extrabold uppercase tracking-widest" style={{ color: '#6366f1' }}>
              {selectedDate === new Date().toISOString().split('T')[0] ? "Last Night" : selectedDate}
            </div>
            <button onClick={() => setEditing(true)} className="text-xs font-bold" style={{ color: '#64748b' }}>Edit</button>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-4xl font-black" style={{ color: durColor(log.duration_hrs || 0) }}>{log.duration_hrs}</div>
              <div className="text-xs font-bold uppercase tracking-widest" style={{ color: '#64748b' }}>hours</div>
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span style={{ color: '#64748b' }}>🌙 Bedtime</span>
                <span style={{ color: '#f1f5f9' }}>{log.bedtime}</span>
              </div>
              <div className="flex justify-between text-xs font-bold">
                <span style={{ color: '#64748b' }}>☀️ Wake up</span>
                <span style={{ color: '#f1f5f9' }}>{log.wake_time}</span>
              </div>
              {log.quality && (
                <div className="flex justify-between text-xs font-bold">
                  <span style={{ color: '#64748b' }}>Quality</span>
                  <span style={{ color: QUALITY_COLORS[log.quality] }}>{QUALITY_LABELS[log.quality]}</span>
                </div>
              )}
            </div>
          </div>
          {log.notes && <div className="mt-3 text-xs px-3 py-2 rounded-lg" style={{ background: '#181818', color: '#94a3b8' }}>{log.notes}</div>}
        </div>
      )}

      {!log && !editing && (
        <div className="rounded-xl p-8 text-center mb-4" style={{ background: '#111', border: '1px solid #1a1a1a' }}>
          <div className="text-3xl mb-2">😴</div>
          <div className="text-sm font-black mb-1">No sleep logged</div>
          <div className="text-xs mb-3" style={{ color: '#64748b' }}>Track your sleep for this date</div>
          <button onClick={() => setEditing(true)}
            className="px-6 py-2 rounded-xl text-sm font-black uppercase tracking-widest"
            style={{ background: 'linear-gradient(90deg,#6366f1,#22d3ee)', color: 'white' }}>
            Log Sleep
          </button>
        </div>
      )}

      {/* Log form */}
      {editing && (
        <div className="rounded-xl p-5 mb-4" style={{ background: '#111', border: '1px solid #222' }}>
          <div className="text-xs font-extrabold uppercase tracking-widest mb-4" style={{ color: '#6366f1' }}>Log Sleep</div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-widest mb-1 text-[#64748b]">🌙 Bedtime</label>
              <input type="time" className={inputCls} value={form.bedtime} onChange={e => setForm(f => ({ ...f, bedtime: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-widest mb-1 text-[#64748b]">☀️ Wake Time</label>
              <input type="time" className={inputCls} value={form.wake_time} onChange={e => setForm(f => ({ ...f, wake_time: e.target.value }))} />
            </div>
          </div>
          <div className="mb-3">
            <div className="text-xs font-extrabold uppercase tracking-widest mb-2 text-[#64748b]">Quality</div>
            <div className="flex gap-2">
              {[1,2,3,4,5].map(q => (
                <button key={q} onClick={() => setForm(f => ({ ...f, quality: String(q) }))}
                  className="flex-1 py-2 rounded-xl text-xs font-black transition-all"
                  style={{ background: form.quality === String(q) ? `${QUALITY_COLORS[q]}22` : '#181818', border: `1px solid ${form.quality === String(q) ? QUALITY_COLORS[q] : '#222'}`, color: form.quality === String(q) ? QUALITY_COLORS[q] : '#64748b' }}>
                  {q}
                </button>
              ))}
            </div>
            <div className="text-xs mt-1 text-center" style={{ color: QUALITY_COLORS[parseInt(form.quality)] }}>{QUALITY_LABELS[parseInt(form.quality)]}</div>
          </div>
          <div className="mb-4">
            <label className="block text-xs font-extrabold uppercase tracking-widest mb-1 text-[#64748b]">Notes (optional)</label>
            <input className={inputCls} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="e.g. Woke up twice, vivid dreams..." />
          </div>
          <div className="text-xs font-bold text-center mb-3" style={{ color: '#6366f1' }}>
            Duration: {calcDuration(form.bedtime, form.wake_time)} hours
          </div>
          <div className="flex gap-3">
            <button onClick={() => setEditing(false)} className="flex-1 py-3 rounded-xl text-sm font-black uppercase tracking-widest" style={{ background: '#181818', border: '1px solid #222', color: '#64748b' }}>Cancel</button>
            <button onClick={save} disabled={saving} className="flex-1 py-3 rounded-xl text-sm font-black uppercase tracking-widest disabled:opacity-60" style={{ background: 'linear-gradient(90deg,#6366f1,#22d3ee)', color: 'white' }}>
              {saving ? 'Saving…' : 'Save Sleep'}
            </button>
          </div>
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div>
          <div className="text-xs font-extrabold uppercase tracking-widest mb-3" style={{ color: '#64748b' }}>Sleep History</div>
          <div className="space-y-2">
            {history.map(h => (
              <div key={h.id} className="rounded-xl px-4 py-3 flex items-center justify-between"
                style={{ background: '#111', border: '1px solid #1a1a1a' }}>
                <div>
                  <div className="text-sm font-black">{new Date(h.log_date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}</div>
                  <div className="text-xs mt-0.5 flex gap-3" style={{ color: '#64748b' }}>
                    <span>{h.bedtime} → {h.wake_time}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-black" style={{ color: durColor(h.duration_hrs || 0) }}>{h.duration_hrs}h</div>
                  {h.quality && <div className="text-xs" style={{ color: QUALITY_COLORS[h.quality] }}>{QUALITY_LABELS[h.quality]}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
