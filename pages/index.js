import { useState, useEffect, useCallback } from 'react'
import Head from 'next/head'

const DEFAULT_TARGETS = { calories: 2000, protein: 80, fiber: 30, sugar: 50 }

function storage() {
  if (typeof window === 'undefined') return null
  return window.localStorage
}

function loadJson(key, fallback) {
  try {
    const v = storage()?.getItem(key)
    return v ? JSON.parse(v) : fallback
  } catch { return fallback }
}

function saveJson(key, val) {
  try { storage()?.setItem(key, JSON.stringify(val)) } catch {}
}

function totals(meals) {
  return meals.reduce(
    (a, m) => ({
      calories: a.calories + (m.calories || 0),
      protein: a.protein + (m.protein_g || 0),
      fiber: a.fiber + (m.fiber_g || 0),
      sugar: a.sugar + (m.sugar_g || 0),
    }),
    { calories: 0, protein: 0, fiber: 0, sugar: 0 }
  )
}

function progressColor(pct) {
  if (pct >= 1) return '#E24B4A'
  if (pct >= 0.8) return '#EF9F27'
  return '#1D9E75'
}

function MacroCard({ label, val, target, unit }) {
  const pct = Math.min(1, target > 0 ? val / target : 0)
  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--color-text-hint)', marginBottom: 4 }}>
        <span>{label}</span>
        <span>{Math.round(val)} / {target} {unit}</span>
      </div>
      <div style={{ fontSize: 20, fontWeight: 500, marginBottom: 2 }}>
        {Math.round(val)}<span style={{ fontSize: 13, fontWeight: 400, color: 'var(--color-text-muted)' }}> {unit}</span>
      </div>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${Math.round(pct * 100)}%`, background: progressColor(pct) }} />
      </div>
    </div>
  )
}

function MealItem({ meal }) {
  return (
    <div className="meal-item">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
        <span style={{ fontWeight: 500, fontSize: 13 }}>{meal.meal_name || 'Meal'}</span>
        <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>{Math.round(meal.calories || 0)} kcal</span>
      </div>
      <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--color-text-hint)' }}>
        <span>Protein {Math.round(meal.protein_g || 0)}g</span>
        <span>Fiber {Math.round(meal.fiber_g || 0)}g</span>
        <span>Sugar {Math.round(meal.sugar_g || 0)}g</span>
      </div>
    </div>
  )
}

function TodayView({ meals, targets }) {
  const t = totals(meals)
  const remCal = Math.max(0, targets.calories - t.calories)
  const remProt = Math.max(0, targets.protein - t.protein)

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
        <MacroCard label="Calories" val={t.calories} target={targets.calories} unit="kcal" />
        <MacroCard label="Protein" val={t.protein} target={targets.protein} unit="g" />
        <MacroCard label="Fiber" val={t.fiber} target={targets.fiber} unit="g" />
        <MacroCard label="Sugar" val={t.sugar} target={targets.sugar} unit="g" />
      </div>

      <div className="card">
        <div className="section-label" style={{ marginBottom: 10 }}>Today's meals</div>
        {meals.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--color-text-hint)', fontSize: 13 }}>
            <div style={{ fontSize: 28, marginBottom: 6, opacity: 0.4 }}>🥗</div>
            No meals logged yet
          </div>
        ) : (
          [...meals].reverse().map((m, i) => <MealItem key={i} meal={m} />)
        )}
        <div style={{
          background: 'var(--color-bg-secondary)',
          borderRadius: 'var(--radius-md)',
          padding: '10px 12px',
          fontSize: 13,
          color: 'var(--color-text-muted)',
          marginTop: 12,
          lineHeight: 1.6,
        }}>
          {remCal > 0 || remProt > 0 ? (
            <>You still need <strong style={{ color: 'var(--color-text)' }}>{Math.round(remCal)} kcal</strong> and <strong style={{ color: 'var(--color-text)' }}>{Math.round(remProt)}g protein</strong> today.</>
          ) : (
            <>You've hit your calorie and protein goals today! 🎉</>
          )}
        </div>
      </div>
    </div>
  )
}

function HistoryView() {
  const [selected, setSelected] = useState(null)
  const [dayData, setDayData] = useState(null)

  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth()
  const monthName = today.toLocaleString('default', { month: 'long', year: 'numeric' })
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const dows = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

  const allKeys = typeof window !== 'undefined'
    ? Object.keys(localStorage).filter(k => k.startsWith('history:')).map(k => k.replace('history:', ''))
    : []
  const hasData = new Set(allKeys)

  function selectDay(key) {
    setSelected(key)
    const raw = loadJson('history:' + key, null)
    setDayData(raw)
  }

  const t = dayData ? totals(dayData.meals || []) : null

  return (
    <div>
      <div className="card">
        <div className="section-label" style={{ marginBottom: 10 }}>{monthName}</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 6 }}>
          {dows.map(d => (
            <div key={d} style={{ fontSize: 11, color: 'var(--color-text-hint)', textAlign: 'center', paddingBottom: 4 }}>{d}</div>
          ))}
          {Array.from({ length: firstDay }).map((_, i) => <div key={'e' + i} />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const d = i + 1
            const pad = String(d).padStart(2, '0')
            const mm = String(month + 1).padStart(2, '0')
            const key = `${year}-${mm}-${pad}`
            const isToday = d === today.getDate()
            const hd = hasData.has(key)
            return (
              <div
                key={key}
                className={`cal-day${hd ? ' has-data' : ''}${isToday ? ' today' : ''}`}
                onClick={hd ? () => selectDay(key) : undefined}
              >
                {d}
              </div>
            )
          })}
        </div>
        <div style={{ fontSize: 11, color: 'var(--color-text-hint)' }}>
          <span style={{
            display: 'inline-block', width: 10, height: 10,
            background: 'var(--color-accent-bg)', border: '0.5px solid var(--color-accent-border)',
            borderRadius: 3, marginRight: 4, verticalAlign: -1,
          }} />
          Logged data — tap to view
        </div>
      </div>

      {selected && dayData && (
        <div className="card" style={{ marginTop: 14 }}>
          <div style={{ fontWeight: 500, fontSize: 14, marginBottom: 10 }}>📅 {selected}</div>
          <div style={{ display: 'flex', gap: 14, fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 12, flexWrap: 'wrap' }}>
            <span><strong style={{ color: 'var(--color-text)' }}>{Math.round(t.calories)}</strong> kcal</span>
            <span><strong style={{ color: 'var(--color-text)' }}>{Math.round(t.protein)}g</strong> protein</span>
            <span><strong style={{ color: 'var(--color-text)' }}>{Math.round(t.fiber)}g</strong> fiber</span>
            <span><strong style={{ color: 'var(--color-text)' }}>{Math.round(t.sugar)}g</strong> sugar</span>
          </div>
          {(dayData.meals || []).map((m, i) => <MealItem key={i} meal={m} />)}
        </div>
      )}
    </div>
  )
}

function SettingsModal({ targets, onSave, onClose }) {
  const [form, setForm] = useState({ ...targets })
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50,
    }}>
      <div className="card" style={{ width: 300, padding: 20 }}>
        <div style={{ fontWeight: 500, fontSize: 15, marginBottom: 14 }}>🎯 Daily targets</div>
        {[
          { key: 'calories', label: 'Calories (kcal)' },
          { key: 'protein', label: 'Protein (g)' },
          { key: 'fiber', label: 'Fiber (g)' },
          { key: 'sugar', label: 'Sugar (g)' },
        ].map(({ key, label }) => (
          <div key={key} style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 12, color: 'var(--color-text-muted)', display: 'block', marginBottom: 4 }}>{label}</label>
            <input
              type="number"
              value={form[key]}
              onChange={e => setForm(f => ({ ...f, [key]: parseInt(e.target.value) || 0 }))}
            />
          </div>
        ))}
        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          <button className="btn-primary" style={{ flex: 1 }} onClick={() => onSave(form)}>Save</button>
          <button style={{ flex: 1 }} onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  const [view, setView] = useState('today')
  const [meals, setMeals] = useState([])
  const [targets, setTargets] = useState(DEFAULT_TARGETS)
  const [desc, setDesc] = useState('')
  const [imageBase64, setImageBase64] = useState(null)
  const [imageType, setImageType] = useState(null)
  const [imageLabel, setImageLabel] = useState('Tap to add photo')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showSettings, setShowSettings] = useState(false)

  useEffect(() => {
    setMeals(loadJson('today-meals', []))
    setTargets({ ...DEFAULT_TARGETS, ...loadJson('targets', {}) })
  }, [])

  function handleImage(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const parts = ev.target.result.split(',')
      setImageBase64(parts[1])
      setImageType(file.type || 'image/jpeg')
      setImageLabel(file.name)
    }
    reader.readAsDataURL(file)
  }

  async function logMeal() {
    if (!desc.trim() && !imageBase64) {
      setError('Please describe your meal or upload a photo.')
      return
    }
    setError('')
    setLoading(true)

    const userContent = []
    if (imageBase64) {
      userContent.push({ type: 'image', source: { type: 'base64', media_type: imageType, data: imageBase64 } })
    }
    const prompt = desc.trim()
      ? `Analyse this meal: "${desc.trim()}"${imageBase64 ? ' (see photo)' : ''}. Return ONLY a JSON object with keys: meal_name (string, short label), calories (number, kcal), protein_g (number), fiber_g (number), sugar_g (number). Make reasonable estimates. No markdown, no extra text.`
      : 'Identify this food from the photo and return ONLY a JSON object with keys: meal_name (string, short label), calories (number, kcal), protein_g (number), fiber_g (number), sugar_g (number). Make reasonable estimates. No markdown, no extra text.'
    userContent.push({ type: 'text', text: prompt })

    try {
      const res = await fetch('/api/log-meal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: userContent }] }),
      })
      const meal = await res.json()
      if (!res.ok) throw new Error(meal.error || 'Error')
      meal.logged_at = new Date().toISOString()
      const next = [...meals, meal]
      setMeals(next)
      saveJson('today-meals', next)
      setDesc('')
      setImageBase64(null)
      setImageType(null)
      setImageLabel('Tap to add photo')
    } catch (err) {
      setError(err.message || 'Failed to analyse meal. Try again.')
    }
    setLoading(false)
  }

  function startNewDay() {
    if (!confirm('Archive today and start fresh?')) return
    const dateKey = new Date().toISOString().split('T')[0]
    saveJson('history:' + dateKey, { meals, date: dateKey })
    setMeals([])
    saveJson('today-meals', [])
  }

  function saveTargets(t) {
    setTargets(t)
    saveJson('targets', t)
    setShowSettings(false)
  }

  return (
    <>
      <Head>
        <title>Nutri — Nutrition Tracker</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🥗</text></svg>" />
      </Head>

      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* Top bar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '11px 16px', borderBottom: '0.5px solid var(--color-border)',
          background: 'var(--color-bg)',
        }}>
          <div style={{ fontWeight: 500, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            🥗 Nutri
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {['today', 'history'].map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                style={{
                  background: view === v ? 'var(--color-bg-secondary)' : 'transparent',
                  borderColor: view === v ? 'var(--color-border-md)' : 'transparent',
                  fontWeight: view === v ? 500 : 400,
                  color: view === v ? 'var(--color-text)' : 'var(--color-text-muted)',
                  textTransform: 'capitalize',
                }}
              >
                {v}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setShowSettings(true)} title="Settings">⚙️</button>
            <button className="btn-danger" onClick={startNewDay}>↺ New day</button>
          </div>
        </div>

        {/* Body */}
        <div style={{ display: 'flex', flex: 1 }}>
          {/* Sidebar */}
          <div style={{
            width: 240, minWidth: 240, padding: 16, display: 'flex', flexDirection: 'column',
            gap: 12, borderRight: '0.5px solid var(--color-border)', background: 'var(--color-bg)',
          }}>
            <div>
              <div className="section-label">Describe your meal</div>
              <textarea
                rows={4}
                placeholder="e.g. 2 rotis with dal and a banana…"
                value={desc}
                onChange={e => setDesc(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && e.metaKey && logMeal()}
              />
            </div>

            <div>
              <div className="section-label">Or upload a photo</div>
              <div
                onClick={() => document.getElementById('file-input').click()}
                style={{
                  border: `0.5px ${imageBase64 ? 'solid var(--color-accent-border)' : 'dashed var(--color-border-md)'}`,
                  borderRadius: 'var(--radius-md)',
                  padding: '10px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  fontSize: 12,
                  color: imageBase64 ? 'var(--color-accent)' : 'var(--color-text-muted)',
                  background: 'var(--color-bg-secondary)',
                }}
              >
                <div style={{ fontSize: 20, marginBottom: 4 }}>📷</div>
                {imageLabel}
              </div>
              <input type="file" id="file-input" accept="image/*" style={{ display: 'none' }} onChange={handleImage} />
            </div>

            {loading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--color-text-muted)' }}>
                <div className="spinner" />
                Analysing with Claude…
              </div>
            )}

            <button className="btn-primary" onClick={logMeal} disabled={loading} style={{ width: '100%' }}>
              + Log meal
            </button>

            {error && <div style={{ fontSize: 12, color: 'var(--color-danger)' }}>{error}</div>}
          </div>

          {/* Main content */}
          <div style={{ flex: 1, padding: 16, overflowY: 'auto', background: 'var(--color-bg-tertiary)' }}>
            {view === 'today' && <TodayView meals={meals} targets={targets} />}
            {view === 'history' && <HistoryView />}
          </div>
        </div>
      </div>

      {showSettings && (
        <SettingsModal targets={targets} onSave={saveTargets} onClose={() => setShowSettings(false)} />
      )}
    </>
  )
}
