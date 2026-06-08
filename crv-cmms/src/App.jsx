import { useState, useEffect, useRef } from 'react'
import { loadFromDrive, saveToDrive } from './driveSync'

const VEHICLE = { year: 2018, make: 'Honda', model: 'CR-V', trim: 'AWD 1.5T', targetKm: 500000 }

const DEFAULT_INTERVALS = [
  { id: 'oil',       name: 'Engine Oil & Filter',           intervalKm: 8000,   lastDoneKm: 156000, notes: '0W-20 full synthetic, 4.4L' },
  { id: 'cvt',       name: 'CVT Fluid Pan-Drop',            intervalKm: 50000,  lastDoneKm: 150000, notes: 'Honda HCF-2, 4.5 qt. Filter: 25420-5LJ-003. Gasket: 21814-RJ2-003. TOP Filter: 25450-P4V-013' },
  { id: 'diff',      name: 'Rear Differential Fluid',       intervalKm: 50000,  lastDoneKm: 100000, notes: 'Honda DPS-F fluid' },
  { id: 'brakes',    name: 'Brakes & Chassis Inspection',   intervalKm: 20000,  lastDoneKm: 150000, notes: 'Pads, rotors, calipers, ball joints, tie rods' },
  { id: 'coolant',   name: 'Engine Coolant',                intervalKm: 50000,  lastDoneKm: 120000, notes: 'Honda Type 2 coolant. Done with Honda dealer.' },
  { id: 'brakefld',  name: 'Brake Fluid',                   intervalKm: 100000, lastDoneKm: 130000, notes: 'DOT 3. Overdue — schedule soon.' },
  { id: 'belt',      name: 'Drive Belt Adjustment/Replace', intervalKm: 50000,  lastDoneKm: 130000, notes: 'Replace at 130K — check at 150K' },
  { id: 'sparkplug', name: 'Spark Plugs & Valve Adjust',    intervalKm: 100000, lastDoneKm: 100000, notes: 'NGK iridium. Done with Honda dealer.' },
  { id: 'pcv',       name: 'PCV Valve',                     intervalKm: 140000, lastDoneKm: 140000, notes: 'OEM: 17130-5A2-A01. Replaced at 140K. FRAGILE — careful on removal.' },
  { id: 'airfilter', name: 'Engine Air Filter',             intervalKm: 30000,  lastDoneKm: 120000, notes: 'OEM Honda or equivalent' },
  { id: 'cabinair',  name: 'Cabin Air Filter',              intervalKm: 15000,  lastDoneKm: 145000, notes: 'Check for pollen/dust buildup' },
  { id: 'tires',     name: 'Tire Rotation',                 intervalKm: 10000,  lastDoneKm: 150000, notes: '5-tire rotation if spare is full size' },
]

const DEFAULT_STATE = { currentKm: 150000, weeklyLog: [], workOrders: [], maintenanceLog: [], lastUpdated: new Date().toISOString() }

function getStatus(item, km) {
  const rem = (item.lastDoneKm + item.intervalKm) - km
  if (rem <= 0) return 'overdue'
  if (rem <= 2000) return 'due_soon'
  return 'ok'
}

function fmtKm(km) { return Number(km).toLocaleString('en-CA') + ' km' }
function fmtDate(iso) { return new Date(iso).toLocaleDateString('en-CA') }

const SC = {
  overdue:  { bg: '#2d1515', border: '#c53030', badge: '#e53e3e', text: '#fc8181' },
  due_soon: { bg: '#2d2315', border: '#c05621', badge: '#dd6b20', text: '#f6ad55' },
  ok:       { bg: '#142d1a', border: '#276749', badge: '#38a169', text: '#68d391' },
}

const TABS = ['Dashboard', 'Work Orders', 'Mileage Log', 'Service History', 'AI Assistant']

export default function App() {
  const [state, setState] = useState(DEFAULT_STATE)
  const [intervals, setIntervals] = useState(DEFAULT_INTERVALS)
  const [tab, setTab] = useState('Dashboard')
  const [kmInput, setKmInput] = useState('')
  const [woForm, setWoForm] = useState({ open: false, title: '', notes: '', priority: 'medium' })
  const [completingId, setCompletingId] = useState(null)
  const [completedKm, setCompletedKm] = useState('')
  const [chat, setChat] = useState([{ role: 'assistant', content: "Hi Erick! I'm your CR-V assistant. I know your full service history, current mileage, all scheduled intervals, and your 500K goal. Ask me anything." }])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [syncStatus, setSyncStatus] = useState('idle') // idle | syncing | saved | error
  const [driveEnabled, setDriveEnabled] = useState(false)
  const chatEndRef = useRef(null)
  const saveTimer = useRef(null)

  // Load from Drive or localStorage on mount
  useEffect(() => {
    async function init() {
      setSyncStatus('syncing')
      const driveData = await loadFromDrive()
      if (driveData) {
        if (driveData.state) setState(driveData.state)
        if (driveData.intervals) setIntervals(driveData.intervals)
        setDriveEnabled(true)
        setSyncStatus('saved')
      } else {
        // fallback to localStorage
        try {
          const ls = localStorage.getItem('crv_cmms')
          if (ls) {
            const parsed = JSON.parse(ls)
            if (parsed.state) setState(parsed.state)
            if (parsed.intervals) setIntervals(parsed.intervals)
          }
        } catch {}
        setSyncStatus('idle')
      }
    }
    init()
  }, [])

  // Auto-save with debounce
  useEffect(() => {
    const payload = { vehicle: VEHICLE, state, intervals }
    // always save to localStorage
    try { localStorage.setItem('crv_cmms', JSON.stringify(payload)) } catch {}
    // debounce Drive save
    if (driveEnabled) {
      clearTimeout(saveTimer.current)
      setSyncStatus('syncing')
      saveTimer.current = setTimeout(async () => {
        const ok = await saveToDrive(payload)
        setSyncStatus(ok ? 'saved' : 'error')
      }, 2000)
    }
    return () => clearTimeout(saveTimer.current)
  }, [state, intervals, driveEnabled])

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [chat])

  const km = state.currentKm
  const sorted = [...intervals].map(i => ({ ...i, nextDue: i.lastDoneKm + i.intervalKm, remaining: (i.lastDoneKm + i.intervalKm) - km, status: getStatus(i, km) })).sort((a, b) => a.remaining - b.remaining)
  const openWOs = state.workOrders.filter(w => w.status !== 'completed')
  const overdueCount = sorted.filter(i => i.status === 'overdue').length
  const dueSoonCount = sorted.filter(i => i.status === 'due_soon').length
  const pct = ((km / VEHICLE.targetKm) * 100).toFixed(1)

  function logKm() {
    const v = parseInt(kmInput.replace(/,/g, ''), 10)
    if (!v || v <= km || v > 999999) return
    setState(s => ({ ...s, currentKm: v, weeklyLog: [{ km: v, prev: s.currentKm, date: new Date().toISOString() }, ...s.weeklyLog].slice(0, 52), lastUpdated: new Date().toISOString() }))
    setKmInput('')
  }

  function createWO() {
    if (!woForm.title.trim()) return
    setState(s => ({ ...s, workOrders: [{ id: Date.now(), title: woForm.title, notes: woForm.notes, priority: woForm.priority, createdKm: km, status: 'open', createdAt: new Date().toISOString() }, ...s.workOrders] }))
    setWoForm({ open: false, title: '', notes: '', priority: 'medium' })
  }

  function doneScheduled(item) {
    const doneKm = parseInt(completedKm.replace(/,/g, ''), 10) || km
    setIntervals(prev => prev.map(i => i.id === item.id ? { ...i, lastDoneKm: doneKm } : i))
    setState(s => ({ ...s, maintenanceLog: [{ id: Date.now(), title: item.name, type: 'scheduled', doneKm, date: new Date().toISOString(), notes: item.notes }, ...s.maintenanceLog] }))
    setCompletingId(null); setCompletedKm('')
  }

  function doneManual(wo) {
    setState(s => ({
      ...s,
      workOrders: s.workOrders.map(w => w.id === wo.id ? { ...w, status: 'completed', completedKm: km, completedAt: new Date().toISOString() } : w),
      maintenanceLog: [{ id: Date.now(), title: wo.title, type: 'inspection', doneKm: km, date: new Date().toISOString(), notes: wo.notes }, ...s.maintenanceLog],
    }))
  }

  async function sendChat() {
    if (!chatInput.trim() || chatLoading) return
    const msg = chatInput.trim(); setChatInput('')
    const updated = [...chat, { role: 'user', content: msg }]
    setChat(updated); setChatLoading(true)
    const ctx = `You are the AI assistant for Erick's personal CR-V CMMS. He is a 20-year industrial electrician in White River, Ontario. Long-term goal: 500,000 km on his 2018 Honda CR-V AWD 1.5T.

CURRENT KM: ${fmtKm(km)} (${pct}% to goal)

INTERVALS:
${sorted.map(i => `- ${i.name}: last @ ${fmtKm(i.lastDoneKm)}, every ${fmtKm(i.intervalKm)}, next @ ${fmtKm(i.nextDue)} [${i.remaining <= 0 ? 'OVERDUE ' + fmtKm(Math.abs(i.remaining)) : 'in ' + fmtKm(i.remaining)}] — ${i.notes}`).join('\n')}

OPEN WORK ORDERS: ${openWOs.length === 0 ? 'None' : openWOs.map(w => `[${w.priority}] ${w.title}: ${w.notes}`).join('; ')}

RECENT LOG: ${state.maintenanceLog.slice(0, 5).map(l => `${l.title} @ ${fmtKm(l.doneKm)}`).join('; ') || 'None yet'}

KEY FACTS: 1.5T oil dilution risk in severe cold (White River winters). CVT filter 25420-5LJ-003. PCV OEM 17130-5A2-A01 — fragile removal. Brake fluid overdue since 130K. Be direct and technical — Erick is highly competent.`
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 1000, system: ctx, messages: updated.map(m => ({ role: m.role, content: m.content })) }),
      })
      const data = await res.json()
      const reply = data.content?.map(b => b.text || '').join('') || 'No response.'
      setChat(prev => [...prev, { role: 'assistant', content: reply }])
    } catch { setChat(prev => [...prev, { role: 'assistant', content: 'Connection error — check your network.' }]) }
    setChatLoading(false)
  }

  // ── styles ──
  const s = {
    app: { minHeight: '100vh', background: '#0f1117' },
    header: { background: '#13151f', borderBottom: '1px solid #1e2330', padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '52px', position: 'sticky', top: 0, zIndex: 100 },
    logoText: { fontSize: '13px', fontWeight: '700', color: '#f7fafc', letterSpacing: '0.06em' },
    logoSub: { fontSize: '10px', color: '#4a5568', marginLeft: '6px', fontWeight: '400' },
    syncDot: { width: '6px', height: '6px', borderRadius: '50%', background: syncStatus === 'saved' ? '#38a169' : syncStatus === 'syncing' ? '#d69e2e' : syncStatus === 'error' ? '#e53e3e' : '#4a5568' },
    kmBadge: { background: '#1a1f2e', border: '1px solid #2d3748', borderRadius: '5px', padding: '3px 10px', fontSize: '11px', color: '#90cdf4', fontWeight: '700' },
    tabs: { background: '#13151f', borderBottom: '1px solid #1e2330', padding: '0 16px', display: 'flex', gap: '2px', overflowX: 'auto' },
    tab: a => ({ padding: '10px 14px', fontSize: '11px', fontWeight: a ? '700' : '400', color: a ? '#90cdf4' : '#718096', borderBottom: a ? '2px solid #90cdf4' : '2px solid transparent', cursor: 'pointer', whiteSpace: 'nowrap', letterSpacing: '0.04em' }),
    body: { padding: '16px', maxWidth: '860px', margin: '0 auto' },
    grid3: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '16px' },
    grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' },
    card: { background: '#13151f', border: '1px solid #1e2330', borderRadius: '8px', padding: '14px' },
    cardTitle: { fontSize: '10px', fontWeight: '700', color: '#4a5568', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '6px' },
    statNum: c => ({ fontSize: '26px', fontWeight: '700', color: c || '#f7fafc', lineHeight: 1 }),
    statSub: { fontSize: '10px', color: '#718096', marginTop: '3px' },
    section: { marginBottom: '20px' },
    secTitle: { fontSize: '10px', fontWeight: '700', color: '#4a5568', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '10px', paddingBottom: '6px', borderBottom: '1px solid #1e2330' },
    row: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: '6px', marginBottom: '5px', border: '1px solid' },
    badge: c => ({ fontSize: '9px', fontWeight: '700', padding: '2px 7px', borderRadius: '3px', background: c, color: '#fff', letterSpacing: '0.06em', textTransform: 'uppercase', flexShrink: 0 }),
    btn: { background: '#2b6cb0', color: '#fff', border: 'none', borderRadius: '6px', padding: '8px 14px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' },
    btnSm: { background: '#1a1f2e', color: '#90cdf4', border: '1px solid #2d3748', borderRadius: '4px', padding: '4px 9px', fontSize: '10px', cursor: 'pointer', fontWeight: '700', flexShrink: 0 },
    input: { background: '#1a1f2e', border: '1px solid #2d3748', borderRadius: '6px', padding: '8px 11px', color: '#e2e8f0', fontSize: '13px', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box' },
    label: { fontSize: '10px', color: '#718096', marginBottom: '4px', display: 'block', fontWeight: '700', letterSpacing: '0.06em', textTransform: 'uppercase' },
    progressWrap: { height: '4px', background: '#1e2330', borderRadius: '2px', overflow: 'hidden', marginTop: '8px' },
    progressFill: (p, c) => ({ height: '100%', width: `${Math.min(p, 100)}%`, background: c || '#90cdf4', borderRadius: '2px' }),
  }

  return (
    <div style={s.app}>
      <div style={s.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={s.syncDot} title={syncStatus} />
          <span style={s.logoText}>CR-V CMMS <span style={s.logoSub}>2018 AWD 1.5T</span></span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {overdueCount > 0 && <span style={s.badge('#c53030')}>{overdueCount} overdue</span>}
          {dueSoonCount > 0 && <span style={s.badge('#c05621')}>{dueSoonCount} soon</span>}
          <span style={s.kmBadge}>{km.toLocaleString()} km</span>
        </div>
      </div>

      <div style={s.tabs}>
        {TABS.map(t => <div key={t} style={s.tab(tab === t)} onClick={() => setTab(t)}>{t}</div>)}
      </div>

      <div style={s.body}>

        {/* ── DASHBOARD ── */}
        {tab === 'Dashboard' && <>
          <div style={s.grid3}>
            <div style={s.card}>
              <div style={s.cardTitle}>Odometer</div>
              <div style={s.statNum('#90cdf4')}>{km.toLocaleString()}</div>
              <div style={s.statSub}>km — {pct}% to 500K</div>
              <div style={s.progressWrap}><div style={s.progressFill(pct, '#90cdf4')} /></div>
            </div>
            <div style={s.card}>
              <div style={s.cardTitle}>Needs attention</div>
              <div style={s.statNum(overdueCount > 0 ? '#fc8181' : '#68d391')}>{overdueCount + dueSoonCount}</div>
              <div style={s.statSub}>{overdueCount} overdue · {dueSoonCount} due soon</div>
            </div>
            <div style={s.card}>
              <div style={s.cardTitle}>Open work orders</div>
              <div style={s.statNum('#f6e05e')}>{openWOs.length}</div>
              <div style={s.statSub}>inspection-based</div>
            </div>
          </div>

          <div style={s.section}>
            <div style={s.secTitle}>Weekly mileage check-in</div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ flex: 1 }}>
                <label style={s.label}>New odometer reading</label>
                <input style={s.input} placeholder="e.g. 152,500" value={kmInput} onChange={e => setKmInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && logKm()} />
              </div>
              <button style={{ ...s.btn, marginTop: '20px', height: '36px' }} onClick={logKm}>Log</button>
            </div>
            {state.weeklyLog[0] && <div style={{ marginTop: '6px', fontSize: '10px', color: '#4a5568' }}>Last: {fmtKm(state.weeklyLog[0].km)} on {fmtDate(state.weeklyLog[0].date)} (+{(state.weeklyLog[0].km - state.weeklyLog[0].prev).toLocaleString()} km)</div>}
          </div>

          <div style={s.section}>
            <div style={s.secTitle}>Maintenance status</div>
            {sorted.map(item => {
              const c = SC[item.status]
              const isC = completingId === item.id
              return (
                <div key={item.id} style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: '6px', padding: '10px 12px', marginBottom: '5px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    <div style={{ minWidth: 0 }}>
                      <span style={{ fontWeight: '600', color: '#e2e8f0', fontSize: '12px' }}>{item.name}</span>
                      <span style={{ marginLeft: '8px', fontSize: '10px', color: '#718096' }}>
                        next @ {fmtKm(item.nextDue)} · {item.remaining <= 0 ? <span style={{ color: c.text }}>overdue {fmtKm(Math.abs(item.remaining))}</span> : `${fmtKm(item.remaining)} left`}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <span style={s.badge(c.badge)}>{item.status.replace('_', ' ')}</span>
                      <button style={s.btnSm} onClick={() => { setCompletingId(isC ? null : item.id); setCompletedKm(String(km)) }}>{isC ? 'cancel' : 'done'}</button>
                    </div>
                  </div>
                  {isC && <div style={{ marginTop: '8px', display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                    <div>
                      <label style={s.label}>Completed at (km)</label>
                      <input style={{ ...s.input, width: '130px' }} value={completedKm} onChange={e => setCompletedKm(e.target.value)} />
                    </div>
                    <button style={{ ...s.btn, fontSize: '11px', padding: '6px 12px' }} onClick={() => doneScheduled(item)}>Confirm</button>
                  </div>}
                </div>
              )
            })}
          </div>
        </>}

        {/* ── WORK ORDERS ── */}
        {tab === 'Work Orders' && <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={s.secTitle}>Open work orders</div>
            <button style={s.btn} onClick={() => setWoForm(f => ({ ...f, open: !f.open }))}>{woForm.open ? 'Cancel' : '+ New'}</button>
          </div>

          {woForm.open && <div style={{ ...s.card, marginBottom: '14px', border: '1px solid #2d3748' }}>
            <div style={{ ...s.grid2, marginBottom: '10px' }}>
              <div>
                <label style={s.label}>Title</label>
                <input style={s.input} placeholder="e.g. Inspect CV axle boot" value={woForm.title} onChange={e => setWoForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div>
                <label style={s.label}>Priority</label>
                <select style={s.input} value={woForm.priority} onChange={e => setWoForm(f => ({ ...f, priority: e.target.value }))}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
            <div style={{ marginBottom: '10px' }}>
              <label style={s.label}>Notes / findings</label>
              <textarea style={{ ...s.input, height: '64px', resize: 'vertical' }} value={woForm.notes} onChange={e => setWoForm(f => ({ ...f, notes: e.target.value }))} placeholder="What was observed..." />
            </div>
            <button style={s.btn} onClick={createWO}>Create work order</button>
          </div>}

          {openWOs.length === 0 && !woForm.open && <div style={{ color: '#4a5568', textAlign: 'center', padding: '24px 0' }}>No open work orders.</div>}
          {openWOs.map(wo => {
            const pc = wo.priority === 'high' ? '#c53030' : wo.priority === 'medium' ? '#c05621' : '#276749'
            return (
              <div key={wo.id} style={{ ...s.card, marginBottom: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '12px', color: '#e2e8f0' }}>{wo.title}</div>
                    {wo.notes && <div style={{ fontSize: '11px', color: '#718096', marginTop: '2px' }}>{wo.notes}</div>}
                    <div style={{ fontSize: '10px', color: '#4a5568', marginTop: '4px' }}>Created @ {fmtKm(wo.createdKm)} · {fmtDate(wo.createdAt)}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <span style={s.badge(pc)}>{wo.priority}</span>
                    <button style={s.btnSm} onClick={() => doneManual(wo)}>done</button>
                  </div>
                </div>
              </div>
            )
          })}

          <div style={{ ...s.secTitle, marginTop: '24px' }}>All scheduled intervals</div>
          {sorted.map(item => {
            const c = SC[item.status]
            const isC = completingId === item.id
            return (
              <div key={item.id} style={{ ...s.card, marginBottom: '5px', borderColor: c.border }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: '600', fontSize: '12px', color: '#e2e8f0' }}>{item.name}</div>
                    <div style={{ fontSize: '10px', color: '#718096', marginTop: '2px' }}>{item.notes}</div>
                    <div style={{ fontSize: '10px', color: '#4a5568', marginTop: '3px' }}>Last @ {fmtKm(item.lastDoneKm)} · Every {fmtKm(item.intervalKm)} · Next @ {fmtKm(item.nextDue)}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexShrink: 0 }}>
                    <span style={s.badge(c.badge)}>{item.status.replace('_', ' ')}</span>
                    <button style={s.btnSm} onClick={() => { setCompletingId(isC ? null : item.id); setCompletedKm(String(km)) }}>{isC ? 'cancel' : 'done'}</button>
                  </div>
                </div>
                {isC && <div style={{ marginTop: '8px', display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                  <div><label style={s.label}>Done at (km)</label><input style={{ ...s.input, width: '130px' }} value={completedKm} onChange={e => setCompletedKm(e.target.value)} /></div>
                  <button style={{ ...s.btn, fontSize: '11px', padding: '6px 12px' }} onClick={() => doneScheduled(item)}>Confirm</button>
                </div>}
              </div>
            )
          })}
        </>}

        {/* ── MILEAGE LOG ── */}
        {tab === 'Mileage Log' && <>
          <div style={s.section}>
            <div style={s.secTitle}>Log odometer reading</div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ flex: 1 }}>
                <label style={s.label}>Odometer (km)</label>
                <input style={s.input} placeholder="e.g. 152,500" value={kmInput} onChange={e => setKmInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && logKm()} />
              </div>
              <button style={{ ...s.btn, marginTop: '20px', height: '36px' }} onClick={logKm}>Log</button>
            </div>
          </div>
          {state.weeklyLog.length === 0 && <div style={{ color: '#4a5568', textAlign: 'center', padding: '24px 0' }}>No mileage entries yet.</div>}
          {state.weeklyLog.map((entry, i) => (
            <div key={i} style={{ ...s.row, background: '#13151f', borderColor: '#1e2330' }}>
              <div>
                <span style={{ fontWeight: '600', color: '#90cdf4' }}>{fmtKm(entry.km)}</span>
                <span style={{ marginLeft: '10px', fontSize: '10px', color: '#718096' }}>+{(entry.km - entry.prev).toLocaleString()} km</span>
              </div>
              <span style={{ fontSize: '10px', color: '#4a5568' }}>{fmtDate(entry.date)}</span>
            </div>
          ))}
        </>}

        {/* ── SERVICE HISTORY ── */}
        {tab === 'Service History' && <>
          <div style={s.secTitle}>Completed service log</div>
          {state.maintenanceLog.length === 0 && <div style={{ color: '#4a5568', textAlign: 'center', padding: '24px 0' }}>No services logged yet. Mark work orders done to populate this log.</div>}
          {state.maintenanceLog.map((entry, i) => (
            <div key={i} style={{ ...s.card, marginBottom: '5px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span style={{ fontWeight: '600', fontSize: '12px', color: '#68d391' }}>{entry.title}</span>
                  <div style={{ fontSize: '10px', color: '#718096', marginTop: '2px' }}>@ {fmtKm(entry.doneKm)}{entry.notes ? ' · ' + entry.notes : ''}</div>
                </div>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <span style={s.badge('#276749')}>{entry.type}</span>
                  <span style={{ fontSize: '10px', color: '#4a5568' }}>{fmtDate(entry.date)}</span>
                </div>
              </div>
            </div>
          ))}
        </>}

        {/* ── AI ASSISTANT ── */}
        {tab === 'AI Assistant' && (
          <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 130px)' }}>
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '10px' }}>
              {chat.map((msg, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  <div style={{ maxWidth: '82%', padding: '10px 13px', borderRadius: '8px', fontSize: '12px', lineHeight: '1.65', background: msg.role === 'user' ? '#2b6cb0' : '#13151f', border: msg.role === 'user' ? 'none' : '1px solid #1e2330', color: '#e2e8f0', whiteSpace: 'pre-wrap' }}>
                    {msg.role === 'assistant' && <div style={{ fontSize: '9px', color: '#4a5568', marginBottom: '4px', fontWeight: '700', letterSpacing: '0.08em' }}>AI ASSISTANT</div>}
                    {msg.content}
                  </div>
                </div>
              ))}
              {chatLoading && <div style={{ display: 'flex' }}><div style={{ background: '#13151f', border: '1px solid #1e2330', borderRadius: '8px', padding: '10px 13px', color: '#4a5568', fontSize: '11px' }}>thinking...</div></div>}
              <div ref={chatEndRef} />
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input style={{ ...s.input, flex: 1 }} placeholder="Ask about your CR-V — what's overdue, oil dilution risk, CVT longevity..." value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendChat()} />
              <button style={s.btn} onClick={sendChat} disabled={chatLoading}>Send</button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
