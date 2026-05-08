'use client'
import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/database'

type MealLog = Database['public']['Tables']['meal_logs']['Row']
type MealType = 'breakfast' | 'snack_am' | 'lunch' | 'snack_pm' | 'dinner'

const MEALS: { key: MealType; label: string; icon: string; time: string }[] = [
  { key: 'breakfast', label: 'Breakfast', icon: '🌅', time: '06:00–09:00' },
  { key: 'snack_am', label: 'Morning Snack', icon: '☕', time: '09:00–11:00' },
  { key: 'lunch', label: 'Lunch', icon: '🍱', time: '12:00–14:00' },
  { key: 'snack_pm', label: 'Afternoon Snack', icon: '🍎', time: '15:00–17:00' },
  { key: 'dinner', label: 'Dinner', icon: '🌙', time: '18:00–21:00' },
]

interface AddForm {
  food_name: string; calories: string; protein_g: string; carbs_g: string; fat_g: string; notes: string
}

export default function MealsPage() {
  const supabase = createClient()
  const [logs, setLogs] = useState<MealLog[]>([])
  const [photos, setPhotos] = useState<Record<string, string>>({})
  const [adding, setAdding] = useState<MealType | null>(null)
  const [form, setForm] = useState<AddForm>({ food_name: '', calories: '', protein_g: '', carbs_g: '', fat_g: '', notes: '' })
  const [userId, setUserId] = useState<string | null>(null)
  const [uploading, setUploading] = useState<MealType | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [activePhotoMeal, setActivePhotoMeal] = useState<MealType | null>(null)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)
      const [{ data: mealData }, { data: photoData }] = await Promise.all([
        supabase.from('meal_logs').select('*').eq('user_id', user.id).eq('log_date', selectedDate).order('created_at'),
        supabase.from('meal_photos').select('*').eq('user_id', user.id).eq('log_date', selectedDate),
      ])
      setLogs(mealData || [])
      if (photoData) {
        const map: Record<string, string> = {}
        for (const p of photoData) {
          const { data } = supabase.storage.from('meal-photos').getPublicUrl(p.storage_path)
          map[p.meal_type] = data.publicUrl
        }
        setPhotos(map)
      }
    }
    load()
  }, [selectedDate])

  async function addFood() {
    if (!userId || !adding) return
    const { data } = await supabase.from('meal_logs').insert({
      user_id: userId, log_date: selectedDate, meal_type: adding,
      food_name: form.food_name || 'Unknown food',
      calories: parseInt(form.calories) || 0,
      protein_g: parseFloat(form.protein_g) || 0,
      carbs_g: parseFloat(form.carbs_g) || 0,
      fat_g: parseFloat(form.fat_g) || 0,
      notes: form.notes || null,
    }).select().single()
    if (data) setLogs(v => [...v, data])
    setForm({ food_name: '', calories: '', protein_g: '', carbs_g: '', fat_g: '', notes: '' })
    setAdding(null)
  }

  async function deleteFood(id: string) {
    setLogs(v => v.filter(l => l.id !== id))
    await supabase.from('meal_logs').delete().eq('id', id)
  }

  async function uploadPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files?.[0] || !userId || !activePhotoMeal) return
    const file = e.target.files[0]
    setUploading(activePhotoMeal)
    const ext = file.name.split('.').pop()
    const path = `${userId}/${today}/${activePhotoMeal}.${ext}`
    await supabase.storage.from('meal-photos').upload(path, file, { upsert: true })
    const existing = await supabase.from('meal_photos').select('id').eq('user_id', userId).eq('log_date', today).eq('meal_type', activePhotoMeal).single()
    if (existing.data) {
      await supabase.from('meal_photos').update({ storage_path: path }).eq('id', existing.data.id)
    } else {
      await supabase.from('meal_photos').insert({ user_id: userId, log_date: selectedDate, meal_type: activePhotoMeal, storage_path: path })
    }
    const { data } = supabase.storage.from('meal-photos').getPublicUrl(path)
    setPhotos(v => ({ ...v, [activePhotoMeal]: data.publicUrl }))
    setUploading(null)
    setActivePhotoMeal(null)
  }

  const totalCal = logs.reduce((s, l) => s + (l.calories || 0), 0)
  const totalProtein = logs.reduce((s, l) => s + (l.protein_g || 0), 0)
  const totalCarbs = logs.reduce((s, l) => s + (l.carbs_g || 0), 0)
  const totalFat = logs.reduce((s, l) => s + (l.fat_g || 0), 0)

  const inputCls = "w-full rounded-md px-3 py-2 text-sm font-semibold outline-none bg-[#0f0f0f] border border-[#333] text-[#f1f5f9] focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 transition-all"

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={uploadPhoto} />

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black">Meals</h1>
          <p className="text-sm mt-0.5" style={{ color: '#64748b' }}>{new Date(selectedDate).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
        <input type="date" value={selectedDate} onChange={e => { setSelectedDate(e.target.value); setLogs([]); setPhotos({}) }}
          className="rounded-lg px-3 py-2 text-xs font-bold outline-none transition-all"
          style={{ background: '#111', border: '1px solid #222', color: '#f1f5f9' }} />
      </div>

      {/* Daily totals */}
      <div className="grid grid-cols-4 gap-2 mb-6">
        {[
          { label: 'Calories', value: totalCal, unit: 'kcal', color: '#f97316' },
          { label: 'Protein', value: Math.round(totalProtein), unit: 'g', color: '#6366f1' },
          { label: 'Carbs', value: Math.round(totalCarbs), unit: 'g', color: '#eab308' },
          { label: 'Fat', value: Math.round(totalFat), unit: 'g', color: '#22d3ee' },
        ].map(t => (
          <div key={t.label} className="rounded-xl p-3 text-center" style={{ background: '#111', border: '1px solid #1a1a1a' }}>
            <div className="text-lg font-black" style={{ color: t.color }}>{t.value}</div>
            <div className="text-[9px] font-bold uppercase tracking-widest" style={{ color: '#64748b' }}>{t.label}</div>
            <div className="text-[10px]" style={{ color: '#3f4a58' }}>{t.unit}</div>
          </div>
        ))}
      </div>

      {/* Meal sections */}
      <div className="space-y-3">
        {MEALS.map(meal => {
          const items = logs.filter(l => l.meal_type === meal.key)
          const mealCal = items.reduce((s, l) => s + (l.calories || 0), 0)
          const isAdding = adding === meal.key
          const photo = photos[meal.key]
          return (
            <div key={meal.key} className="rounded-xl overflow-hidden" style={{ background: '#111', border: '1px solid #1a1a1a' }}>
              {/* Meal header */}
              <div className="flex items-center justify-between px-4 py-3 cursor-pointer border-b" style={{ borderColor: '#1a1a1a' }}>
                <div className="flex items-center gap-2">
                  <span className="text-xl">{meal.icon}</span>
                  <div>
                    <div className="text-sm font-black">{meal.label}</div>
                    <div className="text-xs" style={{ color: '#3f4a58' }}>{meal.time}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {mealCal > 0 && <span className="text-xs font-black" style={{ color: '#f97316' }}>{mealCal} kcal</span>}
                  {/* Photo button */}
                  <button
                    onClick={() => { setActivePhotoMeal(meal.key); fileRef.current?.click() }}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-sm transition-all hover:bg-[#1a1a1a]"
                    style={{ border: `1px solid ${photo ? '#22c55e33' : '#222'}`, color: photo ? '#22c55e' : '#64748b' }}
                    title="Add food photo">
                    {uploading === meal.key ? '⏳' : photo ? '📸' : '📷'}
                  </button>
                  <button onClick={() => setAdding(isAdding ? null : meal.key)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-black transition-all"
                    style={{ background: isAdding ? 'rgba(249,115,22,0.15)' : '#181818', border: `1px solid ${isAdding ? '#f97316' : '#222'}`, color: isAdding ? '#f97316' : '#64748b' }}>
                    {isAdding ? '✕' : '+'}
                  </button>
                </div>
              </div>

              {/* Photo preview */}
              {photo && (
                <div className="relative">
                  <img src={photo} alt={`${meal.label} photo`} className="w-full h-32 object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <span className="absolute bottom-2 left-3 text-xs font-bold text-white/80">Food journal 📸</span>
                </div>
              )}

              {/* Food items */}
              {items.length > 0 && (
                <div className="divide-y" style={{ borderColor: '#1a1a1a' }}>
                  {items.map(item => (
                    <div key={item.id} className="flex items-center justify-between px-4 py-2.5 group">
                      <div>
                        <div className="text-sm font-semibold">{item.food_name}</div>
                        <div className="text-xs flex gap-2 mt-0.5" style={{ color: '#64748b' }}>
                          <span style={{ color: '#f97316' }}>{item.calories} kcal</span>
                          <span>P: {item.protein_g}g</span>
                          <span>C: {item.carbs_g}g</span>
                          <span>F: {item.fat_g}g</span>
                        </div>
                        {item.notes && <div className="text-xs mt-0.5" style={{ color: '#3f4a58' }}>{item.notes}</div>}
                      </div>
                      <button onClick={() => deleteFood(item.id)}
                        className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded text-xs flex items-center justify-center transition-all"
                        style={{ color: '#ef4444', background: 'rgba(239,68,68,0.1)' }}>✕</button>
                    </div>
                  ))}
                </div>
              )}

              {items.length === 0 && !isAdding && (
                <div className="px-4 py-3 text-xs" style={{ color: '#3f4a58' }}>No food logged yet</div>
              )}

              {/* Add food form */}
              {isAdding && (
                <div className="p-4 space-y-3 border-t" style={{ borderColor: '#1a1a1a', background: '#0f0f0f' }}>
                  <input className={inputCls} placeholder="Food name (e.g. Nasi goreng, Chicken breast)" value={form.food_name} onChange={e => setForm(f => ({ ...f, food_name: e.target.value }))} />
                  <div className="grid grid-cols-4 gap-2">
                    {[['calories', 'Kcal'], ['protein_g', 'Protein g'], ['carbs_g', 'Carbs g'], ['fat_g', 'Fat g']].map(([k, lbl]) => (
                      <div key={k}>
                        <label className="block text-[9px] font-extrabold uppercase tracking-widest mb-1 text-[#3f4a58]">{lbl}</label>
                        <input type="number" className={inputCls + ' py-1.5 text-xs'} value={form[k as keyof AddForm]}
                          onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} placeholder="0" />
                      </div>
                    ))}
                  </div>
                  <input className={inputCls} placeholder="Notes (optional)" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
                  <div className="flex gap-2">
                    <button onClick={() => setAdding(null)} className="flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-widest" style={{ background: '#111', border: '1px solid #222', color: '#64748b' }}>Cancel</button>
                    <button onClick={addFood} className="flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-widest text-black" style={{ background: 'linear-gradient(90deg,#f97316,#eab308)' }}>Add Food</button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
