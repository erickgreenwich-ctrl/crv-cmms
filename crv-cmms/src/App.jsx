import { useState, useEffect, useRef } from 'react'
import { loadFromDrive, saveToDrive } from './driveSync'
import { PRESET_WORK_ORDERS } from './workOrders'

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

const DEFAULT_STATE = {
  currentKm: 150000, weeklyLog: [], workOrders: PRESET_WORK_ORDERS,
  maintenanceLog: [], lastUpdated: new Date().toISOString()
}

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

// ── Photo capture component ──
function PhotoCapture({ label, photos, onAdd, onRemove }) {
  const fileRef = useRef(null)
  const cameraRef = useRef(null)

  function handleFiles(files) {
    Array.from(files).forEach(file => {
      const reader = new FileReader()
      reader.onload = e => onAdd({ id: Date.now() + Math.random(), url: e.target.result, name: file.name, ts: new Date().toISOString() })
      reader.readAsDataURL(file)
    })
  }

  return (
    <div style={{ marginBottom: '16px' }}>
      <div style={{ fontSize: '10px', fontWeight: '700', color: '#4a5568', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px' }}>{label}</div>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
        {photos.map(p => (
          <div key={p.id} style={{ position: 'relative', width: '80px', height: '80px' }}>
            <img src={p.url} alt={p.name} style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #2d3748' }} />
            <button onClick={() => onRemove(p.id)} style={{ position: 'absolute', top: '-6px', right: '-6px', width: '18px', height: '18px', borderRadius: '50%', background: '#c53030', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700' }}>×</button>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={e => handleFiles(e.target.files)} />
        <input ref={cameraRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={e => handleFiles(e.target.files)} />
        <button onClick={() => cameraRef.current.click()} style={{ background: '#1a1f2e', border: '1px solid #2d3748', borderRadius: '6px', padding: '8px 12px', color: '#90cdf4', fontSize: '11px', cursor: 'pointer', fontWeight: '600' }}>📷 Camera</button>
        <button onClick={() => fileRef.current.click()} style={{ background: '#1a1f2e', border: '1px solid #2d3748', borderRadius: '6px', padding: '8px 12px', color: '#718096', fontSize: '11px', cursor: 'pointer', fontWeight: '600' }}>🖼 Gallery</button>
        {photos.length > 0 && <span style={{ fontSize: '10px', color: '#4a5568', alignSelf: 'center' }}>{photos.length} photo{photos.length>1?'s':''}</span>}
      </div>
    </div>
  )
}

export default function App() {
  const [state, setState] = useState(() => {
    try { const ls = localStorage.getItem('crv_cmms'); if (ls) { const p = JSON.parse(ls); if (p.state) return p.state } } catch {}
    return DEFAULT_STATE
  })
  const [intervals, setIntervals] = useState(() => {
    try { const ls = localStorage.getItem('crv_cmms'); if (ls) { const p = JSON.parse(ls); if (p.intervals) return p.intervals } } catch {}
    return DEFAULT_INTERVALS
  })

  const [tab, setTab] = useState('Dashboard')
  const [kmInput, setKmInput] = useState('')
  const [completingId, setCompletingId] = useState(null)
  const [completedKm, setCompletedKm] = useState('')

  // Work order detail view
  const [woView, setWoView] = useState('list') // list | detail
  const [selectedWO, setSelectedWO] = useState(null)
  const [woTab, setWoTab] = useState('overview') // overview | procedure | photos | close

  // Per-WO working state (photos + comments before saving)
  const [beforePhotos, setBeforePhotos] = useState([])
  const [afterPhotos, setAfterPhotos] = useState([])
  const [generalPhotos, setGeneralPhotos] = useState([])
  const [beforeComment, setBeforeComment] = useState('')
  const [afterComment, setAfterComment] = useState('')
  const [generalComment, setGeneralComment] = useState('')
  const [closingKm, setClosingKm] = useState('')

  // AI
  const [chat, setChat] = useState([{ role: 'assistant', content: "Hi Erick! I'm your CR-V assistant. I know your full service history, current mileage, all scheduled intervals, and your 500K goal. Ask me anything." }])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const chatEndRef = useRef(null)

  const [syncStatus, setSyncStatus] = useState('idle')
  const [driveEnabled, setDriveEnabled] = useState(false)
  const saveTimer = useRef(null)

  useEffect(() => {
    async function init() {
      setSyncStatus('syncing')
      const d = await loadFromDrive()
      if (d) { if (d.state) setState(d.state); if (d.intervals) setIntervals(d.intervals); setDriveEnabled(true); setSyncStatus('saved') }
      else setSyncStatus('idle')
    }
    init()
  }, [])

  useEffect(() => {
    const payload = { vehicle: VEHICLE, state, intervals }
    try { localStorage.setItem('crv_cmms', JSON.stringify(payload)) } catch {}
    if (driveEnabled) {
      clearTimeout(saveTimer.current); setSyncStatus('syncing')
      saveTimer.current = setTimeout(async () => { const ok = await saveToDrive(payload); setSyncStatus(ok ? 'saved' : 'error') }, 2000)
    }
    return () => clearTimeout(saveTimer.current)
  }, [state, intervals, driveEnabled])

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [chat])

  const km = state.currentKm
  const sorted = [...intervals].map(i => ({ ...i, nextDue: i.lastDoneKm + i.intervalKm, remaining: (i.lastDoneKm + i.intervalKm) - km, status: getStatus(i, km) })).sort((a, b) => a.remaining - b.remaining)
  const openWOs = state.workOrders.filter(w => w.status !== 'completed')
  const completedWOs = state.workOrders.filter(w => w.status === 'completed')
  const overdueCount = sorted.filter(i => i.status === 'overdue').length
  const dueSoonCount = sorted.filter(i => i.status === 'due_soon').length
  const pct = ((km / VEHICLE.targetKm) * 100).toFixed(1)

  function openWO(wo) {
    setSelectedWO(wo)
    setWoView('detail')
    setWoTab('overview')
    // restore any saved draft state
    setBeforePhotos(wo.draft?.beforePhotos || [])
    setAfterPhotos(wo.draft?.afterPhotos || [])
    setGeneralPhotos(wo.draft?.generalPhotos || [])
    setBeforeComment(wo.draft?.beforeComment || '')
    setAfterComment(wo.draft?.afterComment || '')
    setGeneralComment(wo.draft?.generalComment || '')
    setClosingKm(String(km))
  }

  function saveDraft() {
    if (!selectedWO) return
    setState(s => ({
      ...s, workOrders: s.workOrders.map(w => w.id === selectedWO.id
        ? { ...w, draft: { beforePhotos, afterPhotos, generalPhotos, beforeComment, afterComment, generalComment } }
        : w)
    }))
  }

  function closeWO() {
    if (!selectedWO) return
    const doneKm = parseInt(closingKm.replace(/,/g, ''), 10) || km
    const record = {
      id: Date.now(), title: selectedWO.title, type: 'work-order',
      doneKm, date: new Date().toISOString(),
      notes: selectedWO.notes,
      parts: selectedWO.parts,
      beforeComment, afterComment, generalComment,
      beforePhotos, afterPhotos, generalPhotos,
      totalPhotos: beforePhotos.length + afterPhotos.length + generalPhotos.length,
    }
    setState(s => ({
      ...s,
      workOrders: s.workOrders.map(w => w.id === selectedWO.id
        ? { ...w, status: 'completed', completedKm: doneKm, completedAt: new Date().toISOString(), draft: null, record }
        : w),
      maintenanceLog: [record, ...s.maintenanceLog],
    }))
    setWoView('list')
    setSelectedWO(null)
  }

  function logKm() {
    const v = parseInt(kmInput.replace(/,/g, ''), 10)
    if (!v || v <= km || v > 999999) return
    setState(s => ({ ...s, currentKm: v, weeklyLog: [{ km: v, prev: s.currentKm, date: new Date().toISOString() }, ...s.weeklyLog].slice(0, 52), lastUpdated: new Date().toISOString() }))
    setKmInput('')
  }

  function doneScheduled(item) {
    const doneKm = parseInt(completedKm.replace(/,/g, ''), 10) || km
    setIntervals(prev => prev.map(i => i.id === item.id ? { ...i, lastDoneKm: doneKm } : i))
    setState(s => ({ ...s, maintenanceLog: [{ id: Date.now(), title: item.name, type: 'scheduled', doneKm, date: new Date().toISOString(), notes: item.notes }, ...s.maintenanceLog] }))
    setCompletingId(null); setCompletedKm('')
  }

  async function sendChat() {
    if (!chatInput.trim() || chatLoading) return
    const msg = chatInput.trim(); setChatInput('')
    const updated = [...chat, { role: 'user', content: msg }]
    setChat(updated); setChatLoading(true)
    const ctx = `You are the AI assistant for Erick's CR-V CMMS. Industrial electrician, White River Ontario, goal 500K km on 2018 Honda CR-V AWD 1.5T. Current: ${fmtKm(km)}.
INTERVALS: ${sorted.map(i => `${i.name}: last@${fmtKm(i.lastDoneKm)}, next@${fmtKm(i.nextDue)} [${i.remaining<=0?'OVERDUE':'in '+fmtKm(i.remaining)}]`).join(' | ')}
OPEN WOs: ${openWOs.map(w=>`[${w.priority}] ${w.title}`).join('; ')||'None'}
KEY: 1.5T oil dilution risk in cold. CVT filter 25420-5LJ-003. PCV 17130-5A2-A01 fragile. Brake fluid overdue since 130K.`
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 1000, system: ctx, messages: updated.map(m => ({ role: m.role, content: m.content })) }) })
      const data = await res.json()
      setChat(prev => [...prev, { role: 'assistant', content: data.content?.map(b=>b.text||'').join('')||'No response.' }])
    } catch { setChat(prev => [...prev, { role: 'assistant', content: 'Connection error.' }]) }
    setChatLoading(false)
  }

  const pcBadge = p => p==='high'?'#c53030':p==='medium'?'#c05621':'#276749'

  const s = {
    app: { minHeight: '100vh', background: '#0f1117' },
    header: { background: '#13151f', borderBottom: '1px solid #1e2330', padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '52px', position: 'sticky', top: 0, zIndex: 100 },
    logoText: { fontSize: '13px', fontWeight: '700', color: '#f7fafc', letterSpacing: '0.06em' },
    logoSub: { fontSize: '10px', color: '#4a5568', marginLeft: '6px', fontWeight: '400' },
    syncDot: { width: '6px', height: '6px', borderRadius: '50%', background: syncStatus==='saved'?'#38a169':syncStatus==='syncing'?'#d69e2e':syncStatus==='error'?'#e53e3e':'#4a5568' },
    kmBadge: { background: '#1a1f2e', border: '1px solid #2d3748', borderRadius: '5px', padding: '3px 10px', fontSize: '11px', color: '#90cdf4', fontWeight: '700' },
    tabs: { background: '#13151f', borderBottom: '1px solid #1e2330', padding: '0 16px', display: 'flex', gap: '2px', overflowX: 'auto' },
    tab: a => ({ padding: '10px 14px', fontSize: '11px', fontWeight: a?'700':'400', color: a?'#90cdf4':'#718096', borderBottom: a?'2px solid #90cdf4':'2px solid transparent', cursor: 'pointer', whiteSpace: 'nowrap', letterSpacing: '0.04em' }),
    body: { padding: '16px', maxWidth: '860px', margin: '0 auto' },
    grid3: { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px', marginBottom: '16px' },
    card: { background: '#13151f', border: '1px solid #1e2330', borderRadius: '8px', padding: '14px' },
    cardTitle: { fontSize: '10px', fontWeight: '700', color: '#4a5568', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' },
    statNum: c => ({ fontSize: '26px', fontWeight: '700', color: c||'#f7fafc', lineHeight: 1 }),
    statSub: { fontSize: '10px', color: '#718096', marginTop: '3px' },
    section: { marginBottom: '20px' },
    secTitle: { fontSize: '10px', fontWeight: '700', color: '#4a5568', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '10px', paddingBottom: '6px', borderBottom: '1px solid #1e2330' },
    badge: c => ({ fontSize: '9px', fontWeight: '700', padding: '2px 7px', borderRadius: '3px', background: c, color: '#fff', letterSpacing: '0.06em', textTransform: 'uppercase', flexShrink: 0 }),
    btn: { background: '#2b6cb0', color: '#fff', border: 'none', borderRadius: '6px', padding: '8px 14px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' },
    btnSm: { background: '#1a1f2e', color: '#90cdf4', border: '1px solid #2d3748', borderRadius: '4px', padding: '4px 9px', fontSize: '10px', cursor: 'pointer', fontWeight: '700', flexShrink: 0 },
    btnGreen: { background: '#276749', color: '#68d391', border: 'none', borderRadius: '6px', padding: '12px 14px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', width: '100%' },
    btnGhost: { background: 'transparent', color: '#718096', border: '1px solid #2d3748', borderRadius: '6px', padding: '8px 14px', fontSize: '12px', cursor: 'pointer' },
    btnSave: { background: '#1a365d', color: '#90cdf4', border: '1px solid #2b6cb0', borderRadius: '6px', padding: '8px 14px', fontSize: '11px', cursor: 'pointer', fontWeight: '600' },
    input: { background: '#1a1f2e', border: '1px solid #2d3748', borderRadius: '6px', padding: '8px 11px', color: '#e2e8f0', fontSize: '13px', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box' },
    textarea: { background: '#1a1f2e', border: '1px solid #2d3748', borderRadius: '6px', padding: '8px 11px', color: '#e2e8f0', fontSize: '12px', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box', resize: 'vertical', lineHeight: '1.6' },
    label: { fontSize: '10px', color: '#718096', marginBottom: '4px', display: 'block', fontWeight: '700', letterSpacing: '0.06em', textTransform: 'uppercase' },
    progressWrap: { height: '4px', background: '#1e2330', borderRadius: '2px', overflow: 'hidden', marginTop: '8px' },
    progressFill: (p,c) => ({ height: '100%', width: `${Math.min(p,100)}%`, background: c||'#90cdf4', borderRadius: '2px' }),
    woInnerTab: a => ({ padding: '7px 12px', fontSize: '11px', fontWeight: a?'700':'400', color: a?'#e2e8f0':'#718096', background: a?'#1a2744':'transparent', border: a?'1px solid #2b6cb0':'1px solid transparent', borderRadius: '5px', cursor: 'pointer', whiteSpace: 'nowrap' }),
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
        {TABS.map(t => <div key={t} style={s.tab(tab===t)} onClick={()=>{ setTab(t); if(t==='Work Orders') setWoView('list') }}>{t}</div>)}
      </div>

      <div style={s.body}>

        {/* ── DASHBOARD ── */}
        {tab === 'Dashboard' && <>
          <div style={s.grid3}>
            <div style={s.card}>
              <div style={s.cardTitle}>Odometer</div>
              <div style={s.statNum('#90cdf4')}>{km.toLocaleString()}</div>
              <div style={s.statSub}>km — {pct}% to 500K</div>
              <div style={s.progressWrap}><div style={s.progressFill(pct,'#90cdf4')} /></div>
            </div>
            <div style={s.card}>
              <div style={s.cardTitle}>Needs attention</div>
              <div style={s.statNum(overdueCount>0?'#fc8181':'#68d391')}>{overdueCount+dueSoonCount}</div>
              <div style={s.statSub}>{overdueCount} overdue · {dueSoonCount} due soon</div>
            </div>
            <div style={s.card}>
              <div style={s.cardTitle}>Open work orders</div>
              <div style={s.statNum('#f6e05e')}>{openWOs.length}</div>
              <div style={s.statSub}>tap to open</div>
            </div>
          </div>
          <div style={s.section}>
            <div style={s.secTitle}>Weekly mileage check-in</div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ flex: 1 }}><label style={s.label}>New odometer reading</label><input style={s.input} placeholder="e.g. 152,500" value={kmInput} onChange={e=>setKmInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&logKm()} /></div>
              <button style={{ ...s.btn, marginTop: '20px', height: '36px' }} onClick={logKm}>Log</button>
            </div>
            {state.weeklyLog[0] && <div style={{ marginTop: '6px', fontSize: '10px', color: '#4a5568' }}>Last: {fmtKm(state.weeklyLog[0].km)} on {fmtDate(state.weeklyLog[0].date)} (+{(state.weeklyLog[0].km-state.weeklyLog[0].prev).toLocaleString()} km)</div>}
          </div>
          <div style={s.section}>
            <div style={s.secTitle}>Maintenance status</div>
            {sorted.map(item => {
              const c = SC[item.status]; const isC = completingId === item.id
              return (
                <div key={item.id} style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: '6px', padding: '10px 12px', marginBottom: '5px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    <div style={{ minWidth: 0 }}>
                      <span style={{ fontWeight: '600', color: '#e2e8f0', fontSize: '12px' }}>{item.name}</span>
                      <span style={{ marginLeft: '8px', fontSize: '10px', color: '#718096' }}>next @ {fmtKm(item.nextDue)} · {item.remaining<=0 ? <span style={{ color: c.text }}>overdue {fmtKm(Math.abs(item.remaining))}</span> : `${fmtKm(item.remaining)} left`}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <span style={s.badge(c.badge)}>{item.status.replace('_',' ')}</span>
                      <button style={s.btnSm} onClick={()=>{ setCompletingId(isC?null:item.id); setCompletedKm(String(km)) }}>{isC?'cancel':'done'}</button>
                    </div>
                  </div>
                  {isC && <div style={{ marginTop: '8px', display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                    <div><label style={s.label}>Completed at (km)</label><input style={{ ...s.input, width: '130px' }} value={completedKm} onChange={e=>setCompletedKm(e.target.value)} /></div>
                    <button style={{ ...s.btn, fontSize: '11px', padding: '6px 12px' }} onClick={()=>doneScheduled(item)}>Confirm</button>
                  </div>}
                </div>
              )
            })}
          </div>
        </>}

        {/* ── WORK ORDERS ── */}
        {tab === 'Work Orders' && <>

          {/* LIST */}
          {woView === 'list' && <>
            <div style={{ marginBottom: '14px' }}><div style={s.secTitle}>Work orders — {openWOs.length} open</div></div>
            {openWOs.length === 0 && <div style={{ color: '#4a5568', textAlign: 'center', padding: '32px 0', fontSize: '12px' }}>All work orders completed.</div>}
            {openWOs.map(wo => {
              const hasDraft = wo.draft && (wo.draft.beforePhotos?.length || wo.draft.afterPhotos?.length || wo.draft.generalPhotos?.length || wo.draft.beforeComment || wo.draft.afterComment || wo.draft.generalComment)
              return (
                <div key={wo.id} style={{ ...s.card, marginBottom: '8px', cursor: 'pointer', border: `1px solid ${wo.priority==='high'?'#c53030':wo.priority==='medium'?'#c05621':'#2d3748'}` }} onClick={()=>openWO(wo)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: '700', fontSize: '13px', color: '#e2e8f0', marginBottom: '4px' }}>{wo.title}</div>
                      <div style={{ fontSize: '11px', color: '#718096', lineHeight: '1.5' }}>{wo.notes?.slice(0,90)}{wo.notes?.length>90?'…':''}</div>
                      <div style={{ fontSize: '10px', color: '#4a5568', marginTop: '6px', display: 'flex', gap: '10px' }}>
                        <span>{wo.procedure?.length||0} steps</span>
                        <span>{wo.parts?.length||0} parts</span>
                        {hasDraft && <span style={{ color: '#d69e2e' }}>● draft saved</span>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexShrink: 0, marginLeft: '12px' }}>
                      <span style={s.badge(pcBadge(wo.priority))}>{wo.priority}</span>
                      <span style={{ fontSize: '18px', color: '#4a5568' }}>›</span>
                    </div>
                  </div>
                </div>
              )
            })}
            {completedWOs.length > 0 && <>
              <div style={{ ...s.secTitle, marginTop: '24px' }}>Completed</div>
              {completedWOs.map(wo => (
                <div key={wo.id} style={{ ...s.card, marginBottom: '6px', opacity: 0.55 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '12px', color: '#68d391' }}>{wo.title}</div>
                      <div style={{ fontSize: '10px', color: '#4a5568', marginTop: '2px' }}>
                        Completed @ {fmtKm(wo.completedKm)} · {fmtDate(wo.completedAt)}
                        {wo.record?.totalPhotos > 0 && ` · ${wo.record.totalPhotos} photos`}
                      </div>
                    </div>
                    <span style={s.badge('#276749')}>done</span>
                  </div>
                </div>
              ))}
            </>}
          </>}

          {/* DETAIL — WO with photos + comments */}
          {woView === 'detail' && selectedWO && <>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
              <button style={s.btnGhost} onClick={()=>{ saveDraft(); setWoView('list'); setSelectedWO(null) }}>← Back</button>
              <span style={s.badge(pcBadge(selectedWO.priority))}>{selectedWO.priority}</span>
              <span style={{ fontSize: '13px', fontWeight: '700', color: '#e2e8f0', flex: 1 }}>{selectedWO.title}</span>
              <button style={s.btnSave} onClick={saveDraft}>Save draft</button>
            </div>

            {/* Inner tabs */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '14px', overflowX: 'auto', paddingBottom: '2px' }}>
              {['overview','procedure','photos','close'].map(t => (
                <div key={t} style={s.woInnerTab(woTab===t)} onClick={()=>setWoTab(t)}>
                  {t==='overview'?'Overview':t==='procedure'?`Procedure (${selectedWO.procedure?.length})`
                    :t==='photos'?`Photos (${beforePhotos.length+afterPhotos.length+generalPhotos.length})`
                    :'Close WO'}
                </div>
              ))}
            </div>

            {/* OVERVIEW */}
            {woTab === 'overview' && <>
              <div style={{ ...s.card, marginBottom: '10px', borderLeft: `3px solid ${pcBadge(selectedWO.priority)}` }}>
                <div style={s.cardTitle}>Notes</div>
                <div style={{ fontSize: '12px', color: '#a0aec0', lineHeight: '1.7' }}>{selectedWO.notes}</div>
              </div>
              <div style={s.card}>
                <div style={s.cardTitle}>Parts & Materials</div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead><tr style={{ borderBottom: '1px solid #2d3748' }}>
                    <th style={{ textAlign: 'left', padding: '4px 8px 8px 0', color: '#4a5568', fontSize: '10px', fontWeight: '700' }}>PART #</th>
                    <th style={{ textAlign: 'left', padding: '4px 8px', color: '#4a5568', fontSize: '10px', fontWeight: '700' }}>DESCRIPTION</th>
                    <th style={{ textAlign: 'center', padding: '4px 8px', color: '#4a5568', fontSize: '10px', fontWeight: '700' }}>QTY</th>
                    <th style={{ textAlign: 'left', padding: '4px 0', color: '#4a5568', fontSize: '10px', fontWeight: '700' }}>UNIT</th>
                  </tr></thead>
                  <tbody>
                    {selectedWO.parts?.map((p,i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #1e2330' }}>
                        <td style={{ padding: '8px 8px 8px 0', color: '#90cdf4', fontFamily: 'monospace', fontSize: '11px' }}>{p.partNumber}</td>
                        <td style={{ padding: '8px', color: '#e2e8f0' }}>{p.description}</td>
                        <td style={{ padding: '8px', color: '#f6e05e', textAlign: 'center', fontWeight: '700' }}>{p.qty}</td>
                        <td style={{ padding: '8px 0', color: '#718096' }}>{p.unit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>}

            {/* PROCEDURE */}
            {woTab === 'procedure' && <div style={s.card}>
              <div style={s.cardTitle}>Step-by-step procedure</div>
              {selectedWO.procedure?.map((step, i) => (
                <div key={i} style={{ display: 'flex', gap: '12px', marginBottom: '14px', alignItems: 'flex-start' }}>
                  <div style={{ minWidth: '26px', height: '26px', borderRadius: '50%', background: '#2b6cb0', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '700', flexShrink: 0, marginTop: '1px' }}>{i+1}</div>
                  <div style={{ fontSize: '12px', color: '#e2e8f0', lineHeight: '1.75', paddingTop: '3px' }}>{step.replace(/^Step \d+:\s*/i,'')}</div>
                </div>
              ))}
            </div>}

            {/* PHOTOS & COMMENTS */}
            {woTab === 'photos' && <>
              <div style={{ ...s.card, marginBottom: '10px' }}>
                <div style={s.cardTitle}>Before job</div>
                <PhotoCapture label="Before photos" photos={beforePhotos} onAdd={p=>setBeforePhotos(prev=>[...prev,p])} onRemove={id=>setBeforePhotos(prev=>prev.filter(p=>p.id!==id))} />
                <label style={s.label}>Before — comments</label>
                <textarea style={{ ...s.textarea, height: '72px' }} placeholder="Condition before starting, observations, concerns..." value={beforeComment} onChange={e=>setBeforeComment(e.target.value)} />
              </div>
              <div style={{ ...s.card, marginBottom: '10px' }}>
                <div style={s.cardTitle}>General — during job</div>
                <PhotoCapture label="General photos" photos={generalPhotos} onAdd={p=>setGeneralPhotos(prev=>[...prev,p])} onRemove={id=>setGeneralPhotos(prev=>prev.filter(p=>p.id!==id))} />
                <label style={s.label}>General comments</label>
                <textarea style={{ ...s.textarea, height: '72px' }} placeholder="Notes during the job, findings, issues encountered..." value={generalComment} onChange={e=>setGeneralComment(e.target.value)} />
              </div>
              <div style={s.card}>
                <div style={s.cardTitle}>After job</div>
                <PhotoCapture label="After photos" photos={afterPhotos} onAdd={p=>setAfterPhotos(prev=>[...prev,p])} onRemove={id=>setAfterPhotos(prev=>prev.filter(p=>p.id!==id))} />
                <label style={s.label}>After — comments</label>
                <textarea style={{ ...s.textarea, height: '72px' }} placeholder="Final condition, torque values used, anything to note for next time..." value={afterComment} onChange={e=>setAfterComment(e.target.value)} />
              </div>
            </>}

            {/* CLOSE WO */}
            {woTab === 'close' && <>
              <div style={{ ...s.card, marginBottom: '10px', background: '#142010', borderColor: '#276749' }}>
                <div style={s.cardTitle}>Summary before closing</div>
                <div style={{ fontSize: '12px', color: '#a0aec0', lineHeight: '1.8' }}>
                  <div>📋 Work order: <span style={{ color: '#e2e8f0', fontWeight: '600' }}>{selectedWO.title}</span></div>
                  <div>📸 Photos: <span style={{ color: '#e2e8f0' }}>{beforePhotos.length} before · {generalPhotos.length} general · {afterPhotos.length} after</span></div>
                  <div>💬 Comments: <span style={{ color: '#e2e8f0' }}>{[beforeComment,generalComment,afterComment].filter(Boolean).length} of 3 filled</span></div>
                  <div>🔧 Parts listed: <span style={{ color: '#e2e8f0' }}>{selectedWO.parts?.length||0} items</span></div>
                </div>
              </div>
              <div style={{ ...s.card, marginBottom: '14px' }}>
                <label style={s.label}>Odometer at completion (km)</label>
                <input style={{ ...s.input, width: '160px' }} value={closingKm} onChange={e=>setClosingKm(e.target.value)} />
                <div style={{ fontSize: '10px', color: '#4a5568', marginTop: '4px' }}>Current reading: {fmtKm(km)}</div>
              </div>
              {(beforePhotos.length + afterPhotos.length + generalPhotos.length === 0) && (
                <div style={{ background: '#2d2315', border: '1px solid #c05621', borderRadius: '6px', padding: '10px 12px', marginBottom: '12px', fontSize: '11px', color: '#f6ad55' }}>
                  ⚠ No photos attached. Consider adding before/after photos before closing.
                </div>
              )}
              <button style={s.btnGreen} onClick={closeWO}>
                ✓ Close Work Order & Save to History
              </button>
            </>}
          </>}
        </>}

        {/* ── MILEAGE LOG ── */}
        {tab === 'Mileage Log' && <>
          <div style={s.section}>
            <div style={s.secTitle}>Log odometer reading</div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ flex: 1 }}><label style={s.label}>Odometer (km)</label><input style={s.input} placeholder="e.g. 152,500" value={kmInput} onChange={e=>setKmInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&logKm()} /></div>
              <button style={{ ...s.btn, marginTop: '20px', height: '36px' }} onClick={logKm}>Log</button>
            </div>
          </div>
          {state.weeklyLog.length===0 && <div style={{ color: '#4a5568', textAlign: 'center', padding: '24px 0' }}>No mileage entries yet.</div>}
          {state.weeklyLog.map((entry,i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderRadius: '6px', marginBottom: '5px', background: '#13151f', border: '1px solid #1e2330' }}>
              <div><span style={{ fontWeight: '600', color: '#90cdf4' }}>{fmtKm(entry.km)}</span><span style={{ marginLeft: '10px', fontSize: '10px', color: '#718096' }}>+{(entry.km-entry.prev).toLocaleString()} km</span></div>
              <span style={{ fontSize: '10px', color: '#4a5568' }}>{fmtDate(entry.date)}</span>
            </div>
          ))}
        </>}

        {/* ── SERVICE HISTORY ── */}
        {tab === 'Service History' && <>
          <div style={s.secTitle}>Completed service log</div>
          {state.maintenanceLog.length===0 && <div style={{ color: '#4a5568', textAlign: 'center', padding: '24px 0' }}>No services logged yet.</div>}
          {state.maintenanceLog.map((entry,i) => (
            <div key={i} style={{ ...s.card, marginBottom: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                <span style={{ fontWeight: '700', fontSize: '13px', color: '#68d391' }}>{entry.title}</span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <span style={s.badge('#276749')}>{entry.type}</span>
                </div>
              </div>
              <div style={{ fontSize: '11px', color: '#718096', marginBottom: '4px' }}>@ {fmtKm(entry.doneKm)} · {fmtDate(entry.date)}</div>
              {entry.beforeComment && <div style={{ fontSize: '11px', color: '#a0aec0', marginBottom: '3px' }}><span style={{ color: '#4a5568' }}>Before: </span>{entry.beforeComment}</div>}
              {entry.generalComment && <div style={{ fontSize: '11px', color: '#a0aec0', marginBottom: '3px' }}><span style={{ color: '#4a5568' }}>During: </span>{entry.generalComment}</div>}
              {entry.afterComment && <div style={{ fontSize: '11px', color: '#a0aec0', marginBottom: '4px' }}><span style={{ color: '#4a5568' }}>After: </span>{entry.afterComment}</div>}
              {entry.totalPhotos > 0 && (
                <div style={{ fontSize: '10px', color: '#4a5568', marginTop: '4px' }}>
                  📸 {entry.beforePhotos?.length||0} before · {entry.generalPhotos?.length||0} general · {entry.afterPhotos?.length||0} after
                </div>
              )}
              {/* photo thumbnails */}
              {entry.totalPhotos > 0 && (
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
                  {[...(entry.beforePhotos||[]), ...(entry.generalPhotos||[]), ...(entry.afterPhotos||[])].map((p,pi) => (
                    <img key={pi} src={p.url} alt={p.name} style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '5px', border: '1px solid #2d3748' }} />
                  ))}
                </div>
              )}
            </div>
          ))}
        </>}

        {/* ── AI ASSISTANT ── */}
        {tab === 'AI Assistant' && (
          <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 130px)' }}>
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '10px' }}>
              {chat.map((msg,i) => (
                <div key={i} style={{ display: 'flex', justifyContent: msg.role==='user'?'flex-end':'flex-start' }}>
                  <div style={{ maxWidth: '82%', padding: '10px 13px', borderRadius: '8px', fontSize: '12px', lineHeight: '1.65', background: msg.role==='user'?'#2b6cb0':'#13151f', border: msg.role==='user'?'none':'1px solid #1e2330', color: '#e2e8f0', whiteSpace: 'pre-wrap' }}>
                    {msg.role==='assistant' && <div style={{ fontSize: '9px', color: '#4a5568', marginBottom: '4px', fontWeight: '700', letterSpacing: '0.08em' }}>AI ASSISTANT</div>}
                    {msg.content}
                  </div>
                </div>
              ))}
              {chatLoading && <div style={{ display: 'flex' }}><div style={{ background: '#13151f', border: '1px solid #1e2330', borderRadius: '8px', padding: '10px 13px', color: '#4a5568', fontSize: '11px' }}>thinking...</div></div>}
              <div ref={chatEndRef} />
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input style={{ ...s.input, flex: 1 }} placeholder="Ask about your CR-V — what's overdue, oil dilution risk, CVT longevity..." value={chatInput} onChange={e=>setChatInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&!e.shiftKey&&sendChat()} />
              <button style={s.btn} onClick={sendChat} disabled={chatLoading}>Send</button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

