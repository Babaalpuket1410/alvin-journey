'use client'
import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/database'

type BodyScan = Database['public']['Tables']['body_scans']['Row']

export default function ProgressPage() {
  const supabase = createClient()
  const [scans, setScans] = useState<BodyScan[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [scanPhotos, setScanPhotos] = useState<Record<string, string>>({})
  const fileRef = useRef<HTMLInputElement>(null)
  const [newScanId, setNewScanId] = useState<string | null>(null)
  const [form, setForm] = useState({
    scan_date: new Date().toISOString().split('T')[0],
    weight_kg: '', body_fat_pct: '', muscle_kg: '', visceral_fat_grade: '',
    health_score: '', bmr: '', bmi: '', notes: '',
  })

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)
      const { data } = await supabase.from('body_scans').select('*').eq('user_id', user.id).order('scan_date', { ascending: false })
      setScans(data || [])
      // Load photos
      const { data: photos } = await supabase.from('progress_photos').select('*').eq('user_id', user.id)
      if (photos) {
        const map: Record<string, string> = {}
        for (const p of photos) {
          const { data } = supabase.storage.from('progress-photos').getPublicUrl(p.storage_path)
          if (p.scan_id) map[p.scan_id] = data.publicUrl
        }
        setScanPhotos(map)
      }
    }
    load()
  }, [])

  async function addScan() {
    if (!userId) return
    const { data } = await supabase.from('body_scans').insert({
      user_id: userId,
      scan_date: form.scan_date,
      weight_kg: parseFloat(form.weight_kg) || 0,
      body_fat_pct: form.body_fat_pct ? parseFloat(form.body_fat_pct) : null,
      muscle_kg: form.muscle_kg ? parseFloat(form.muscle_kg) : null,
      visceral_fat_grade: form.visceral_fat_grade ? parseInt(form.visceral_fat_grade) : null,
      health_score: form.health_score ? parseInt(form.health_score) : null,
      bmr: form.bmr ? parseFloat(form.bmr) : null,
      bmi: form.bmi ? parseFloat(form.bmi) : null,
      notes: form.notes || null,
    }).select().single()
    if (data) {
      setScans(v => [data, ...v])
      setNewScanId(data.id)
      setAddOpen(false)
      setForm({ scan_date: new Date().toISOString().split('T')[0], weight_kg: '', body_fat_pct: '', muscle_kg: '', visceral_fat_grade: '', health_score: '', bmr: '', bmi: '', notes: '' })
    }
  }

  async function uploadPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files?.[0] || !userId || !newScanId) return
    const file = e.target.files[0]
    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = `${userId}/${newScanId}/front.${ext}`
    await supabase.storage.from('progress-photos').upload(path, file, { upsert: true })
    await supabase.from('progress_photos').insert({ user_id: userId, scan_id: newScanId, photo_date: new Date().toISOString().split('T')[0], angle: 'front', storage_path: path })
    const { data } = supabase.storage.from('progress-photos').getPublicUrl(path)
    setScanPhotos(v => ({ ...v, [newScanId]: data.publicUrl }))
    setUploading(false)
    setNewScanId(null)
  }

  const latest = scans[0]
  const prev = scans[1]
  const weightDiff = latest && prev ? (latest.weight_kg - prev.weight_kg) : null
  const bfDiff = latest && prev && latest.body_fat_pct && prev.body_fat_pct ? (latest.body_fat_pct - prev.body_fat_pct) : null

  const inputCls = "w-full rounded-md px-3 py-2 text-sm font-semibold outline-none bg-[#181818] border border-[#222] text-[#f1f5f9] focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 transition-all"

  function DiffBadge({ diff, unit, invert = false }: { diff: number; unit: string; invert?: boolean }) {
    const good = invert ? diff < 0 : diff > 0
    const color = diff === 0 ? '#64748b' : good ? '#22c55e' : '#ef4444'
    return (
      <span className="text-xs font-black px-1.5 py-0.5 rounded" style={{ background: `${color}22`, color }}>
        {diff > 0 ? '+' : ''}{diff.toFixed(1)}{unit}
      </span>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={uploadPhoto} />

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black">Progress</h1>
          <p className="text-sm mt-0.5" style={{ color: '#64748b' }}>Body scan history & photos</p>
        </div>
        <button onClick={() => setAddOpen(true)}
          className="px-4 py-2 rounded-xl text-sm font-black uppercase tracking-widest text-black"
          style={{ background: 'linear-gradient(90deg,#f97316,#eab308)' }}>
          + Log Scan
        </button>
      </div>

      {/* Latest stats */}
      {latest && (
        <div className="rounded-xl p-5 mb-4 relative overflow-hidden" style={{ background: '#111', border: '1px solid #1a1a1a' }}>
          <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: 'linear-gradient(90deg,#f97316,#eab308)' }} />
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-extrabold uppercase tracking-widest" style={{ color: '#f97316' }}>Latest Scan</div>
            <div className="text-xs font-bold" style={{ color: '#64748b' }}>{new Date(latest.scan_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Weight', value: latest.weight_kg, unit: 'kg', diff: weightDiff, color: '#f97316', invert: false },
              { label: 'Body Fat', value: latest.body_fat_pct, unit: '%', diff: bfDiff, color: '#6366f1', invert: false },
              { label: 'Muscle', value: latest.muscle_kg, unit: 'kg', diff: null, color: '#22c55e' },
              { label: 'Health Score', value: latest.health_score, unit: '/100', diff: null, color: '#eab308' },
            ].map(s => s.value !== null && s.value !== undefined ? (
              <div key={s.label} className="rounded-xl p-3 text-center" style={{ background: '#181818' }}>
                <div className="text-xl font-black" style={{ color: s.color }}>{s.value}</div>
                <div className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: '#64748b' }}>{s.label} {s.unit}</div>
                {s.diff !== null && s.diff !== undefined && <DiffBadge diff={s.diff} unit={s.unit} invert={s.invert} />}
              </div>
            ) : null)}
          </div>
          {latest.visceral_fat_grade && (
            <div className="mt-3 px-3 py-2 rounded-lg text-xs font-bold"
              style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>
              ⚠️ Visceral Fat Grade: {latest.visceral_fat_grade} — {latest.visceral_fat_grade > 12 ? 'High Risk' : latest.visceral_fat_grade > 9 ? 'Moderate Risk' : 'Normal Range'}
            </div>
          )}
          {latest.bmr && <div className="mt-2 text-xs" style={{ color: '#3f4a58' }}>BMR: {latest.bmr} kcal/day • BMI: {latest.bmi}</div>}
        </div>
      )}

      {/* Photo section */}
      {(newScanId || scans.some(s => scanPhotos[s.id])) && (
        <div className="rounded-xl p-5 mb-4" style={{ background: '#111', border: '1px solid #1a1a1a' }}>
          <div className="text-xs font-extrabold uppercase tracking-widest mb-3" style={{ color: '#64748b' }}>Progress Photos</div>
          {newScanId && (
            <button onClick={() => fileRef.current?.click()}
              className="w-full rounded-xl py-3 text-sm font-black uppercase tracking-widest transition-all mb-3"
              style={{ background: uploading ? '#1a1a1a' : 'rgba(34,197,94,0.1)', border: '1px dashed #22c55e', color: '#22c55e' }}>
              {uploading ? '⏳ Uploading…' : '📸 Add Progress Photo for Latest Scan'}
            </button>
          )}
          <div className="grid grid-cols-3 gap-2">
            {scans.filter(s => scanPhotos[s.id]).map(s => (
              <div key={s.id} className="relative rounded-lg overflow-hidden aspect-square">
                <img src={scanPhotos[s.id]} alt={`Progress ${s.scan_date}`} className="w-full h-full object-cover" />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent py-1.5 px-2">
                  <div className="text-[9px] font-bold text-white">{new Date(s.scan_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</div>
                  <div className="text-[9px] text-white/70">{s.weight_kg}kg</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* History */}
      <div>
        <div className="text-xs font-extrabold uppercase tracking-widest mb-3" style={{ color: '#64748b' }}>Scan History</div>
        {scans.length === 0 ? (
          <div className="rounded-xl p-8 text-center" style={{ background: '#111', border: '1px solid #1a1a1a' }}>
            <div className="text-3xl mb-2">📊</div>
            <div className="text-sm font-black mb-1">No scans yet</div>
            <div className="text-xs mb-3" style={{ color: '#64748b' }}>Log your first body scan to track progress</div>
            <button onClick={() => setAddOpen(true)}
              className="px-6 py-2 rounded-xl text-sm font-black uppercase tracking-widest text-black"
              style={{ background: 'linear-gradient(90deg,#f97316,#eab308)' }}>
              Log First Scan
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {scans.map(s => (
              <div key={s.id} className="rounded-xl px-4 py-3 flex items-center justify-between"
                style={{ background: '#111', border: '1px solid #1a1a1a' }}>
                <div>
                  <div className="text-sm font-black">{new Date(s.scan_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                  <div className="text-xs mt-0.5 flex gap-3" style={{ color: '#64748b' }}>
                    <span style={{ color: '#f97316' }}>{s.weight_kg}kg</span>
                    {s.body_fat_pct && <span>BF: {s.body_fat_pct}%</span>}
                    {s.muscle_kg && <span>Muscle: {s.muscle_kg}kg</span>}
                    {s.health_score && <span style={{ color: '#eab308' }}>Score: {s.health_score}</span>}
                  </div>
                  {s.notes && <div className="text-xs mt-0.5" style={{ color: '#3f4a58' }}>{s.notes}</div>}
                </div>
                {scanPhotos[s.id] && <img src={scanPhotos[s.id]} alt="" className="w-12 h-12 rounded-lg object-cover" />}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add scan modal */}
      {addOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0" style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-lg rounded-2xl overflow-hidden" style={{ background: '#0f0f0f', border: '1px solid #222', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="sticky top-0 flex items-center justify-between px-5 py-4 border-b z-10" style={{ background: '#0f0f0f', borderColor: '#222' }}>
              <div className="text-sm font-black uppercase tracking-widest" style={{ color: '#f97316' }}>Log Body Scan</div>
              <button onClick={() => setAddOpen(false)} style={{ color: '#64748b' }} className="text-lg font-bold">✕</button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-widest mb-1 text-[#64748b]">Date</label>
                <input type="date" className={inputCls} value={form.scan_date} onChange={e => setForm(f => ({ ...f, scan_date: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[['weight_kg', 'Weight (kg) *'], ['body_fat_pct', 'Body Fat %'], ['muscle_kg', 'Muscle (kg)'], ['visceral_fat_grade', 'Visceral Grade'], ['health_score', 'Health Score'], ['bmr', 'BMR (kcal)'], ['bmi', 'BMI']].map(([k, lbl]) => (
                  <div key={k}>
                    <label className="block text-xs font-extrabold uppercase tracking-widest mb-1 text-[#64748b]">{lbl}</label>
                    <input type="number" step="0.1" className={inputCls} value={form[k as keyof typeof form]}
                      onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} />
                  </div>
                ))}
              </div>
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-widest mb-1 text-[#64748b]">Notes</label>
                <input className={inputCls} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="e.g. After SK-X90 body scan" />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setAddOpen(false)} className="flex-1 py-3 rounded-xl text-sm font-black uppercase tracking-widest" style={{ background: '#111', border: '1px solid #222', color: '#64748b' }}>Cancel</button>
                <button onClick={addScan} className="flex-1 py-3 rounded-xl text-sm font-black uppercase tracking-widest text-black" style={{ background: 'linear-gradient(90deg,#f97316,#eab308)' }}>Save Scan</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
