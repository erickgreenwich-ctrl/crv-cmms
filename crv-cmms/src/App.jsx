import { useState, useEffect, useRef } from 'react'
import { loadFromDrive, saveToDrive } from './driveSync'
import { PRESET_WORK_ORDERS } from './workOrders'

const VEHICLE = { year: 2018, make: 'Honda', model: 'CR-V', trim: 'AWD 1.5T', targetKm: 500000 }

const DEFAULT_INTERVALS = [
  { id: 'oil',       name: 'Engine Oil & Filter',           intervalKm: 5000,   lastDoneKm: 156000 },
  { id: 'cvt',       name: 'CVT Fluid Pan-Drop',            intervalKm: 100000, lastDoneKm: 150000 },
  { id: 'cvtfluid',  name: 'CVT Fluid Change',              intervalKm: 30000,  lastDoneKm: 150000 },
  { id: 'diff',      name: 'Rear Differential Fluid',       intervalKm: 50000,  lastDoneKm: 120000 }, // due at 170,000 km
  { id: 'brakes',    name: 'Brakes & Chassis Inspection',   intervalKm: 20000,  lastDoneKm: 150000 },
  { id: 'coolant',   name: 'Engine Coolant',                intervalKm: 50000,  lastDoneKm: 120000 },
  { id: 'brakefld',  name: 'Brake Fluid',                   intervalKm: 50000,  lastDoneKm: 130000 },
  { id: 'belt',      name: 'Serpentine Belt',               intervalKm: 50000,  lastDoneKm: 150000 },
  { id: 'sparkplug', name: 'Spark Plugs & Valve Adjust',    intervalKm: 100000, lastDoneKm: 100000 },
  { id: 'pcv',       name: 'PCV Valve',                     intervalKm: 50000,  lastDoneKm: 150000 },
  { id: 'airfilter', name: 'Engine Air Filter',             intervalKm: 10000,  lastDoneKm: 150000 },
  { id: 'cabinair',  name: 'Cabin Air Filter',              intervalKm: 20000,  lastDoneKm: 150000 },
  { id: 'tires',     name: 'Tire Rotation',                 intervalKm: 10000,  lastDoneKm: 150000 },
  { id: 'alignment', name: 'Wheel Alignment',               intervalKm: 40000,  lastDoneKm: 150000 },
  { id: 'fuel',      name: 'Fuel System Cleaner',           intervalKm: 10000,  lastDoneKm: 155000 },
  { id: 'radiator',  name: 'Radiator Hoses',                intervalKm: 100000, lastDoneKm: 150000 },
  { id: 'caliper',   name: 'Caliper Slides & Hardware',     intervalKm: 40000,  lastDoneKm: 130000 },
]

const INITIAL_HISTORY = [
  { id: 'h-001', serviceId: 'brakes',    title: 'Brakes & Chassis Inspection', type: 'scheduled', doneKm: 150000, date: '2024-01-01T00:00:00.000Z', comment: 'Inspection at 150,000 km.', photos: [], totalPhotos: 0 },
  { id: 'h-002', serviceId: 'cvt',       title: 'CVT Fluid Pan-Drop',          type: 'scheduled', doneKm: 150000, date: '2024-01-01T00:00:00.000Z', comment: 'Honda HCF-2, 4.5 qt. Filter 25420-5LJ-003. Gasket 21814-RJ2-003. TOP Filter 25450-P4V-013.', photos: [], totalPhotos: 0 },
  { id: 'h-003', serviceId: 'oil',       title: 'Engine Oil & Filter',          type: 'scheduled', doneKm: 156000, date: '2024-03-01T00:00:00.000Z', comment: 'Liquimoly 0W-20 full synthetic, 4.4L. Filter 15400-PLM-A02.', photos: [], totalPhotos: 0 },
  { id: 'h-004', serviceId: 'pcv',       title: 'PCV Valve',                    type: 'scheduled', doneKm: 140000, date: '2023-06-01T00:00:00.000Z', comment: 'OEM 17130-5A2-A01. Heat soaked before removal — came out OK.', photos: [], totalPhotos: 0 },
  { id: 'h-005', serviceId: 'belt',      title: 'Serpentine Belt',              type: 'scheduled', doneKm: 130000, date: '2023-01-01T00:00:00.000Z', comment: 'Belt replaced at 130,000 km.', photos: [], totalPhotos: 0 },
  { id: 'h-006', serviceId: 'sparkplug', title: 'Spark Plugs & Valve Adjust',   type: 'scheduled', doneKm: 100000, date: '2021-01-01T00:00:00.000Z', comment: 'Done with Honda dealer. NGK iridium plugs installed.', photos: [], totalPhotos: 0 },
  { id: 'h-007', serviceId: 'coolant',   title: 'Engine Coolant',               type: 'scheduled', doneKm: 120000, date: '2022-06-01T00:00:00.000Z', comment: 'Done with Honda dealer. Honda Type 2 blue coolant.', photos: [], totalPhotos: 0 },
  { id: 'h-008', serviceId: 'brakefld',  title: 'Brake Fluid',                  type: 'scheduled', doneKm: 130000, date: '2023-01-01T00:00:00.000Z', comment: 'DOT 3 full flush at 130,000 km. Overdue again now at 150,000 km.', photos: [], totalPhotos: 0 },
  { id: 'h-009', serviceId: 'brakefld',  title: 'Brake Fluid',                  type: 'scheduled', doneKm: 30000,  date: '2019-01-01T00:00:00.000Z', comment: 'First brake fluid service.', photos: [], totalPhotos: 0 },
  { id: 'h-010', serviceId: 'diff',      title: 'Rear Differential Fluid',      type: 'scheduled', doneKm: 120000, date: '2022-06-01T00:00:00.000Z', comment: 'Honda DPS-F fluid. Fill to overflow. Drain plug magnets clean.', photos: [], totalPhotos: 0 },
  { id: 'h-011', serviceId: 'diff',      title: 'Rear Differential Fluid',      type: 'scheduled', doneKm: 70000,  date: '2020-01-01T00:00:00.000Z', comment: 'Honda DPS-F fluid.', photos: [], totalPhotos: 0 },
  { id: 'h-012', serviceId: 'cvt',       title: 'CVT Fluid Pan-Drop',           type: 'scheduled', doneKm: 120000, date: '2022-06-01T00:00:00.000Z', comment: 'Honda HCF-2. Filter 25420-RJ2-004. TOP Filter 25450-P4V-013.', photos: [], totalPhotos: 0 },
  { id: 'h-013', serviceId: 'cvt',       title: 'CVT Fluid Pan-Drop',           type: 'scheduled', doneKm: 70000,  date: '2020-01-01T00:00:00.000Z', comment: 'Honda HCF-2 fluid.', photos: [], totalPhotos: 0 },
  { id: 'h-014', serviceId: 'brakes',    title: 'Brakes & Chassis Inspection',  type: 'scheduled', doneKm: 125000, date: '2022-09-01T00:00:00.000Z', comment: 'Inspection at 125,000 km.', photos: [], totalPhotos: 0 },
  { id: 'h-015', serviceId: 'brakes',    title: 'Brakes & Chassis Inspection',  type: 'scheduled', doneKm: 105000, date: '2021-06-01T00:00:00.000Z', comment: 'Inspection at 105,000 km.', photos: [], totalPhotos: 0 },
]

const DEFAULT_STATE = {
  currentKm: 150000, weeklyLog: [], workOrders: PRESET_WORK_ORDERS,
  maintenanceLog: INITIAL_HISTORY, lastUpdated: new Date().toISOString()
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

function PhotoCapture({ photos, onAdd, onRemove }) {
  const fileRef = useRef(null)
  const camRef = useRef(null)
  function handleFiles(files) {
    Array.from(files).forEach(file => {
      const reader = new FileReader()
      reader.onload = e => onAdd({ id: Date.now() + Math.random(), url: e.target.result, name: file.name, ts: new Date().toISOString() })
      reader.readAsDataURL(file)
    })
  }
  return (
    <div>
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
        {photos.map(p => (
          <div key={p.id} style={{ position: 'relative', width: '72px', height: '72px' }}>
            <img src={p.url} alt="" style={{ width: '72px', height: '72px', objectFit: 'cover', borderRadius: '5px', border: '1px solid #2d3748' }} />
            <button onClick={() => onRemove(p.id)} style={{ position: 'absolute', top: '-5px', right: '-5px', width: '16px', height: '16px', borderRadius: '50%', background: '#c53030', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700' }}>×</button>
          </div>
        ))}
      </div>
      <input ref={camRef} type="file" accept="image/*" capture="environment" multiple style={{ display: 'none' }} onChange={e => handleFiles(e.target.files)} />
      <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={e => handleFiles(e.target.files)} />
      <div style={{ display: 'flex', gap: '8px' }}>
        <button onClick={() => camRef.current.click()} style={{ background: '#1a2744', border: '1px solid #2b6cb0', borderRadius: '6px', padding: '7px 12px', color: '#90cdf4', fontSize: '11px', cursor: 'pointer', fontWeight: '600' }}>📷 Camera</button>
        <button onClick={() => fileRef.current.click()} style={{ background: '#1a1f2e', border: '1px solid #2d3748', borderRadius: '6px', padding: '7px 12px', color: '#718096', fontSize: '11px', cursor: 'pointer', fontWeight: '600' }}>🖼 Gallery</button>
        {photos.length > 0 && <span style={{ fontSize: '10px', color: '#4a5568', alignSelf: 'center' }}>{photos.length} photo{photos.length > 1 ? 's' : ''}</span>}
      </div>
    </div>
  )
}

// ── Service History Modal ──
function HistoryModal({ title, serviceId, log, onClose }) {
  const records = log.filter(l => l.serviceId === serviceId || l.title === title)
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={onClose}>
      <div style={{ background: '#13151f', border: '1px solid #2d3748', borderRadius: '12px 12px 0 0', width: '100%', maxWidth: '860px', maxHeight: '80vh', overflow: 'auto', padding: '20px' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <div style={{ fontSize: '14px', fontWeight: '700', color: '#e2e8f0' }}>{title}</div>
            <div style={{ fontSize: '10px', color: '#4a5568', marginTop: '2px' }}>Service history — {records.length} record{records.length !== 1 ? 's' : ''}</div>
          </div>
          <button onClick={onClose} style={{ background: '#2d3748', border: 'none', borderRadius: '50%', width: '28px', height: '28px', color: '#e2e8f0', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
        </div>

        {records.length === 0 && (
          <div style={{ color: '#4a5568', textAlign: 'center', padding: '32px 0', fontSize: '12px' }}>No history yet for this service.</div>
        )}

        {records.map((r, i) => (
          <div key={i} style={{ background: '#0f1117', border: '1px solid #1e2330', borderRadius: '8px', padding: '12px', marginBottom: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
              <div style={{ fontWeight: '700', fontSize: '13px', color: '#68d391' }}>{fmtKm(r.doneKm)}</div>
              <div style={{ fontSize: '11px', color: '#4a5568' }}>{fmtDate(r.date)}</div>
            </div>
            {r.beforeComment && <div style={{ fontSize: '11px', color: '#a0aec0', marginBottom: '3px' }}><span style={{ color: '#4a5568' }}>Before: </span>{r.beforeComment}</div>}
            {r.generalComment && <div style={{ fontSize: '11px', color: '#a0aec0', marginBottom: '3px' }}><span style={{ color: '#4a5568' }}>During: </span>{r.generalComment}</div>}
            {r.afterComment && <div style={{ fontSize: '11px', color: '#a0aec0', marginBottom: '3px' }}><span style={{ color: '#4a5568' }}>After: </span>{r.afterComment}</div>}
            {r.comment && <div style={{ fontSize: '11px', color: '#a0aec0', marginBottom: '3px' }}>{r.comment}</div>}
            {r.notes && !r.beforeComment && !r.afterComment && <div style={{ fontSize: '11px', color: '#718096', marginBottom: '3px' }}>{r.notes?.slice(0, 100)}{r.notes?.length > 100 ? '…' : ''}</div>}
            {(r.totalPhotos > 0 || r.photos?.length > 0) && (
              <div style={{ marginTop: '8px' }}>
                <div style={{ fontSize: '10px', color: '#4a5568', marginBottom: '5px' }}>
                  📸 {r.beforePhotos?.length || 0} before · {r.generalPhotos?.length || 0} during · {r.afterPhotos?.length || 0} after {r.photos?.length > 0 ? `· ${r.photos.length} photos` : ''}
                </div>
                <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                  {[...(r.beforePhotos || []), ...(r.generalPhotos || []), ...(r.afterPhotos || []), ...(r.photos || [])].map((p, pi) => (
                    <img key={pi} src={p.url} alt="" style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '5px', border: '1px solid #2d3748' }} />
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
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

  // History modal
  const [historyModal, setHistoryModal] = useState(null) // { id, title }

  // Scheduled item done panel
  const [completingId, setCompletingId] = useState(null)
  const [completeKm, setCompleteKm] = useState('')
  const [completeComment, setCompleteComment] = useState('')
  const [completePhotos, setCompletePhotos] = useState([])

  // Work order states
  const [woView, setWoView] = useState('list')
  const [selectedWO, setSelectedWO] = useState(null)
  const [woTab, setWoTab] = useState('overview')
  const [closingWO, setClosingWO] = useState(null)
  const [closePhotos, setClosePhotos] = useState([])
  const [closeComment, setCloseComment] = useState('')
  const [closeKm, setCloseKm] = useState('')
  const [beforePhotos, setBeforePhotos] = useState([])
  const [afterPhotos, setAfterPhotos] = useState([])
  const [generalPhotos, setGeneralPhotos] = useState([])
  const [beforeComment, setBeforeComment] = useState('')
  const [afterComment, setAfterComment] = useState('')
  const [generalComment, setGeneralComment] = useState('')
  const [detailCloseKm, setDetailCloseKm] = useState('')

  // AI
  const [chat, setChat] = useState([{ role: 'assistant', content: "Hi Erick! I'm your CR-V assistant. Ask me anything about your vehicle — what's overdue, what to watch for, procedures, part numbers, anything." }])
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
  const pcBadge = p => p === 'high' ? '#c53030' : p === 'medium' ? '#c05621' : '#276749'

  function logKm() {
    const v = parseInt(kmInput.replace(/,/g, ''), 10)
    if (!v || v <= km || v > 999999) return
    setState(s => ({ ...s, currentKm: v, weeklyLog: [{ km: v, prev: s.currentKm, date: new Date().toISOString() }, ...s.weeklyLog].slice(0, 52), lastUpdated: new Date().toISOString() }))
    setKmInput('')
  }

  // ── Scheduled item: start done panel ──
  function startDone(item) {
    setCompletingId(item.id)
    setCompleteKm(String(km))
    setCompleteComment('')
    setCompletePhotos([])
  }

  function confirmDone(item) {
    const doneKm = parseInt(completeKm.replace(/,/g, ''), 10) || km
    setIntervals(prev => prev.map(i => i.id === item.id ? { ...i, lastDoneKm: doneKm } : i))
    const record = {
      id: Date.now(),
      serviceId: item.id,
      title: item.name,
      type: 'scheduled',
      doneKm,
      date: new Date().toISOString(),
      comment: completeComment,
      photos: completePhotos,
      totalPhotos: completePhotos.length,
    }
    setState(s => ({ ...s, maintenanceLog: [record, ...s.maintenanceLog] }))
    setCompletingId(null); setCompleteKm(''); setCompleteComment(''); setCompletePhotos([])
  }

  // ── WO quick close ──
  function startQuickClose(wo, e) {
    e.stopPropagation()
    setClosingWO(wo.id); setClosePhotos([]); setCloseComment(''); setCloseKm(String(km))
  }
  function cancelQuickClose(e) { e.stopPropagation(); setClosingWO(null); setClosePhotos([]); setCloseComment('') }
  function confirmQuickClose(wo, e) {
    e.stopPropagation()
    const doneKm = parseInt(closeKm.replace(/,/g, ''), 10) || km
    const record = {
      id: Date.now(), serviceId: wo.id, title: wo.title, type: 'work-order',
      doneKm, date: new Date().toISOString(), notes: wo.notes, parts: wo.parts,
      afterComment: closeComment, afterPhotos: closePhotos, totalPhotos: closePhotos.length,
    }
    setState(s => ({
      ...s,
      workOrders: s.workOrders.map(w => w.id === wo.id ? { ...w, status: 'completed', completedKm: doneKm, completedAt: new Date().toISOString(), record } : w),
      maintenanceLog: [record, ...s.maintenanceLog],
    }))
    setClosingWO(null); setClosePhotos([]); setCloseComment('')
  }

  // ── WO detail open ──
  function openWODetail(wo) {
    setSelectedWO(wo); setWoView('detail'); setWoTab('overview')
    setBeforePhotos(wo.draft?.beforePhotos || [])
    setAfterPhotos(wo.draft?.afterPhotos || [])
    setGeneralPhotos(wo.draft?.generalPhotos || [])
    setBeforeComment(wo.draft?.beforeComment || '')
    setAfterComment(wo.draft?.afterComment || '')
    setGeneralComment(wo.draft?.generalComment || '')
    setDetailCloseKm(String(km))
  }

  function saveDraft() {
    if (!selectedWO) return
    setState(s => ({ ...s, workOrders: s.workOrders.map(w => w.id === selectedWO.id ? { ...w, draft: { beforePhotos, afterPhotos, generalPhotos, beforeComment, afterComment, generalComment } } : w) }))
  }

  function closeWODetail() {
    saveDraft()
    const doneKm = parseInt(detailCloseKm.replace(/,/g, ''), 10) || km
    const record = {
      id: Date.now(), serviceId: selectedWO.id, title: selectedWO.title, type: 'work-order',
      doneKm, date: new Date().toISOString(), notes: selectedWO.notes, parts: selectedWO.parts,
      beforeComment, generalComment, afterComment,
      beforePhotos, generalPhotos, afterPhotos,
      totalPhotos: beforePhotos.length + generalPhotos.length + afterPhotos.length,
    }
    setState(s => ({
      ...s,
      workOrders: s.workOrders.map(w => w.id === selectedWO.id ? { ...w, status: 'completed', completedKm: doneKm, completedAt: new Date().toISOString(), draft: null, record } : w),
      maintenanceLog: [record, ...s.maintenanceLog],
    }))
    setWoView('list'); setSelectedWO(null)
  }

  async function sendChat() {
    if (!chatInput.trim() || chatLoading) return
    const msg = chatInput.trim(); setChatInput('')
    const updated = [...chat, { role: 'user', content: msg }]
    setChat(updated); setChatLoading(true)
    const ctx = `You are the AI assistant for Erick's CR-V CMMS. Industrial electrician, White River Ontario, goal 500K km on 2018 Honda CR-V AWD 1.5T. Current: ${fmtKm(km)} (${pct}% to goal).
INTERVALS: ${sorted.map(i => `${i.name}: last@${fmtKm(i.lastDoneKm)}, next@${fmtKm(i.nextDue)} [${i.remaining <= 0 ? 'OVERDUE' : 'in ' + fmtKm(i.remaining)}]`).join(' | ')}
OPEN WOs: ${openWOs.map(w => `[${w.priority}] ${w.title}`).join('; ') || 'None'}
KEY: 1.5T oil dilution risk in cold. CVT filter 25420-5LJ-003. PCV 17130-5A2-A01 fragile. Brake fluid overdue since 130K. Using Liquimoly 0W-20.`
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 1000, system: ctx, messages: updated.map(m => ({ role: m.role, content: m.content })) }) })
      const data = await res.json()
      setChat(prev => [...prev, { role: 'assistant', content: data.content?.map(b => b.text || '').join('') || 'No response.' }])
    } catch { setChat(prev => [...prev, { role: 'assistant', content: 'Connection error.' }]) }
    setChatLoading(false)
  }

  const s = {
    app: { minHeight: '100vh', background: '#0f1117' },
    header: { background: '#13151f', borderBottom: '1px solid #1e2330', padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '52px', position: 'sticky', top: 0, zIndex: 100 },
    logoText: { fontSize: '13px', fontWeight: '700', color: '#f7fafc', letterSpacing: '0.06em' },
    logoSub: { fontSize: '10px', color: '#4a5568', marginLeft: '6px', fontWeight: '400' },
    syncDot: { width: '6px', height: '6px', borderRadius: '50%', background: syncStatus === 'saved' ? '#38a169' : syncStatus === 'syncing' ? '#d69e2e' : syncStatus === 'error' ? '#e53e3e' : '#4a5568' },
    kmBadge: { background: '#1a1f2e', border: '1px solid #2d3748', borderRadius: '5px', padding: '3px 10px', fontSize: '11px', color: '#90cdf4', fontWeight: '700' },
    tabs: { background: '#13151f', borderBottom: '1px solid #1e2330', padding: '0 16px', display: 'flex', gap: '2px', overflowX: 'auto' },
    tab: a => ({ padding: '10px 14px', fontSize: '11px', fontWeight: a ? '700' : '400', color: a ? '#90cdf4' : '#718096', borderBottom: a ? '2px solid #90cdf4' : '2px solid transparent', cursor: 'pointer', whiteSpace: 'nowrap' }),
    body: { padding: '16px', maxWidth: '860px', margin: '0 auto' },
    grid3: { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px', marginBottom: '16px' },
    card: { background: '#13151f', border: '1px solid #1e2330', borderRadius: '8px', padding: '14px' },
    cardTitle: { fontSize: '10px', fontWeight: '700', color: '#4a5568', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' },
    statNum: c => ({ fontSize: '26px', fontWeight: '700', color: c || '#f7fafc', lineHeight: 1 }),
    statSub: { fontSize: '10px', color: '#718096', marginTop: '3px' },
    secTitle: { fontSize: '10px', fontWeight: '700', color: '#4a5568', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '10px', paddingBottom: '6px', borderBottom: '1px solid #1e2330' },
    badge: c => ({ fontSize: '9px', fontWeight: '700', padding: '2px 7px', borderRadius: '3px', background: c, color: '#fff', letterSpacing: '0.06em', textTransform: 'uppercase', flexShrink: 0 }),
    btn: { background: '#2b6cb0', color: '#fff', border: 'none', borderRadius: '6px', padding: '8px 14px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' },
    btnSm: (color) => ({ background: '#1a1f2e', color: color || '#90cdf4', border: `1px solid ${color ? color + '44' : '#2d3748'}`, borderRadius: '4px', padding: '4px 9px', fontSize: '10px', cursor: 'pointer', fontWeight: '700', flexShrink: 0, whiteSpace: 'nowrap' }),
    btnGreen: { background: '#276749', color: '#68d391', border: 'none', borderRadius: '6px', padding: '10px 14px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' },
    btnGhost: { background: 'transparent', color: '#718096', border: '1px solid #2d3748', borderRadius: '6px', padding: '8px 14px', fontSize: '12px', cursor: 'pointer' },
    btnSave: { background: '#1a365d', color: '#90cdf4', border: '1px solid #2b6cb0', borderRadius: '6px', padding: '8px 14px', fontSize: '11px', cursor: 'pointer', fontWeight: '600' },
    input: { background: '#1a1f2e', border: '1px solid #2d3748', borderRadius: '6px', padding: '8px 11px', color: '#e2e8f0', fontSize: '13px', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box' },
    textarea: { background: '#1a1f2e', border: '1px solid #2d3748', borderRadius: '6px', padding: '8px 11px', color: '#e2e8f0', fontSize: '12px', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box', resize: 'vertical', lineHeight: '1.6' },
    label: { fontSize: '10px', color: '#718096', marginBottom: '4px', display: 'block', fontWeight: '700', letterSpacing: '0.06em', textTransform: 'uppercase' },
    progressWrap: { height: '4px', background: '#1e2330', borderRadius: '2px', overflow: 'hidden', marginTop: '8px' },
    progressFill: (p, c) => ({ height: '100%', width: `${Math.min(p, 100)}%`, background: c || '#90cdf4', borderRadius: '2px' }),
    woInnerTab: a => ({ padding: '7px 12px', fontSize: '11px', fontWeight: a ? '700' : '400', color: a ? '#e2e8f0' : '#718096', background: a ? '#1a2744' : 'transparent', border: a ? '1px solid #2b6cb0' : '1px solid transparent', borderRadius: '5px', cursor: 'pointer', whiteSpace: 'nowrap' }),
  }

  return (
    <div style={s.app}>
      {/* History modal */}
      {historyModal && (
        <HistoryModal
          title={historyModal.title}
          serviceId={historyModal.id}
          log={state.maintenanceLog}
          onClose={() => setHistoryModal(null)}
        />
      )}

      <div style={s.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={s.syncDot} />
          <span style={s.logoText}>CR-V CMMS <span style={s.logoSub}>2018 AWD 1.5T</span></span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {overdueCount > 0 && <span style={s.badge('#c53030')}>{overdueCount} overdue</span>}
          {dueSoonCount > 0 && <span style={s.badge('#c05621')}>{dueSoonCount} soon</span>}
          <span style={s.kmBadge}>{km.toLocaleString()} km</span>
        </div>
      </div>

      <div style={s.tabs}>
        {TABS.map(t => <div key={t} style={s.tab(tab === t)} onClick={() => { setTab(t); if (t === 'Work Orders') { setWoView('list'); setSelectedWO(null) } }}>{t}</div>)}
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
              <div style={s.statSub}>tap to open</div>
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <div style={s.secTitle}>Weekly mileage check-in</div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ flex: 1 }}><label style={s.label}>New odometer reading</label><input style={s.input} placeholder="e.g. 152,500" value={kmInput} onChange={e => setKmInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && logKm()} /></div>
              <button style={{ ...s.btn, marginTop: '20px', height: '36px' }} onClick={logKm}>Log</button>
            </div>
            {state.weeklyLog[0] && <div style={{ marginTop: '6px', fontSize: '10px', color: '#4a5568' }}>Last: {fmtKm(state.weeklyLog[0].km)} on {fmtDate(state.weeklyLog[0].date)} (+{(state.weeklyLog[0].km - state.weeklyLog[0].prev).toLocaleString()} km)</div>}
          </div>

          <div>
            <div style={s.secTitle}>Maintenance status</div>
            {sorted.map(item => {
              const c = SC[item.status]
              const isCompleting = completingId === item.id
              const historyCount = state.maintenanceLog.filter(l => l.serviceId === item.id || l.title === item.name).length
              return (
                <div key={item.id} style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: '6px', padding: '10px 12px', marginBottom: '5px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    <div style={{ minWidth: 0 }}>
                      <span style={{ fontWeight: '600', color: '#e2e8f0', fontSize: '12px' }}>{item.name}</span>
                      <span style={{ marginLeft: '8px', fontSize: '10px', color: '#718096' }}>
                        next @ {fmtKm(item.nextDue)} · {item.remaining <= 0
                          ? <span style={{ color: c.text }}>overdue {fmtKm(Math.abs(item.remaining))}</span>
                          : `${fmtKm(item.remaining)} left`}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <span style={s.badge(c.badge)}>{item.status.replace('_', ' ')}</span>
                      <button style={s.btnSm('#68d391')} onClick={() => isCompleting ? setCompletingId(null) : startDone(item)}>
                        {isCompleting ? 'cancel' : '✓ done'}
                      </button>
                      <button style={s.btnSm()} onClick={() => setHistoryModal({ id: item.id, title: item.name })}>
                        {historyCount > 0 ? `📋 ${historyCount}` : '📋'}
                      </button>
                    </div>
                  </div>

                  {isCompleting && (
                    <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                        <div style={{ flex: 1 }}>
                          <label style={s.label}>Completed at (km)</label>
                          <input style={s.input} value={completeKm} onChange={e => setCompleteKm(e.target.value)} />
                        </div>
                      </div>
                      <div style={{ marginBottom: '10px' }}>
                        <label style={s.label}>Comments / notes</label>
                        <textarea style={{ ...s.textarea, height: '60px' }} placeholder="Parts used, findings, torque values, observations..." value={completeComment} onChange={e => setCompleteComment(e.target.value)} />
                      </div>
                      <div style={{ marginBottom: '12px' }}>
                        <label style={s.label}>Photos</label>
                        <PhotoCapture photos={completePhotos} onAdd={p => setCompletePhotos(prev => [...prev, p])} onRemove={id => setCompletePhotos(prev => prev.filter(p => p.id !== id))} />
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button style={{ ...s.btnGreen, flex: 2 }} onClick={() => confirmDone(item)}>✓ Save & Close</button>
                        <button style={{ ...s.btnGhost, flex: 1 }} onClick={() => setCompletingId(null)}>Cancel</button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </>}

        {/* ── WORK ORDERS ── */}
        {tab === 'Work Orders' && <>
          {woView === 'list' && <>
            <div style={{ marginBottom: '14px' }}><div style={s.secTitle}>Open work orders — {openWOs.length}</div></div>
            {openWOs.length === 0 && <div style={{ color: '#4a5568', textAlign: 'center', padding: '32px 0', fontSize: '12px' }}>All work orders completed. 🎉</div>}

            {openWOs.map(wo => {
              const isClosing = closingWO === wo.id
              return (
                <div key={wo.id} style={{ ...s.card, marginBottom: '8px', border: `1px solid ${pcBadge(wo.priority)}44` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', cursor: 'pointer' }} onClick={() => !isClosing && openWODetail(wo)}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: '700', fontSize: '13px', color: '#e2e8f0', marginBottom: '3px' }}>{wo.title}</div>
                      <div style={{ fontSize: '11px', color: '#718096', lineHeight: '1.4' }}>{wo.notes?.slice(0, 80)}{wo.notes?.length > 80 ? '…' : ''}</div>
                      <div style={{ fontSize: '10px', color: '#4a5568', marginTop: '5px' }}>{wo.procedure?.length || 0} steps · {wo.parts?.length || 0} parts</div>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexShrink: 0, marginLeft: '10px' }}>
                      <span style={s.badge(pcBadge(wo.priority))}>{wo.priority}</span>
                      {!isClosing && <span style={{ fontSize: '16px', color: '#4a5568' }}>›</span>}
                    </div>
                  </div>

                  {!isClosing && (
                    <div style={{ display: 'flex', gap: '8px', marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #1e2330' }}>
                      <button style={{ ...s.btnGreen, flex: 1, fontSize: '11px', padding: '8px' }} onClick={e => startQuickClose(wo, e)}>✓ Mark Done</button>
                      <button style={{ ...s.btnSm(), flex: 1, padding: '8px', textAlign: 'center' }} onClick={e => { e.stopPropagation(); openWODetail(wo) }}>View Procedure</button>
                      <button style={{ ...s.btnSm(), padding: '8px 10px' }} onClick={e => { e.stopPropagation(); setHistoryModal({ id: wo.id, title: wo.title }) }}>📋</button>
                    </div>
                  )}

                  {isClosing && (
                    <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #2d3748' }} onClick={e => e.stopPropagation()}>
                      <div style={{ marginBottom: '10px' }}>
                        <label style={s.label}>Odometer at completion (km)</label>
                        <input style={{ ...s.input, width: '140px' }} value={closeKm} onChange={e => setCloseKm(e.target.value)} />
                      </div>
                      <div style={{ marginBottom: '10px' }}>
                        <label style={s.label}>Comments / notes</label>
                        <textarea style={{ ...s.textarea, height: '64px' }} placeholder="What was done, findings, parts used, torque values..." value={closeComment} onChange={e => setCloseComment(e.target.value)} />
                      </div>
                      <div style={{ marginBottom: '12px' }}>
                        <label style={s.label}>Photos</label>
                        <PhotoCapture photos={closePhotos} onAdd={p => setClosePhotos(prev => [...prev, p])} onRemove={id => setClosePhotos(prev => prev.filter(p => p.id !== id))} />
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button style={{ ...s.btnGreen, flex: 2 }} onClick={e => confirmQuickClose(wo, e)}>✓ Close Work Order</button>
                        <button style={{ ...s.btnGhost, flex: 1 }} onClick={cancelQuickClose}>Cancel</button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}

            {completedWOs.length > 0 && <>
              <div style={{ ...s.secTitle, marginTop: '24px' }}>Completed — {completedWOs.length}</div>
              {completedWOs.map(wo => (
                <div key={wo.id} style={{ ...s.card, marginBottom: '6px', opacity: 0.6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '12px', color: '#68d391' }}>{wo.title}</div>
                      <div style={{ fontSize: '10px', color: '#4a5568', marginTop: '2px' }}>@ {fmtKm(wo.completedKm)} · {fmtDate(wo.completedAt)}{wo.record?.totalPhotos > 0 ? ` · ${wo.record.totalPhotos} photos` : ''}</div>
                      {wo.record?.afterComment && <div style={{ fontSize: '10px', color: '#718096', marginTop: '2px' }}>{wo.record.afterComment.slice(0, 60)}{wo.record.afterComment.length > 60 ? '…' : ''}</div>}
                    </div>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <span style={s.badge('#276749')}>done</span>
                      <button style={s.btnSm()} onClick={() => setHistoryModal({ id: wo.id, title: wo.title })}>📋</button>
                    </div>
                  </div>
                </div>
              ))}
            </>}
          </>}

          {woView === 'detail' && selectedWO && <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
              <button style={s.btnGhost} onClick={() => { saveDraft(); setWoView('list'); setSelectedWO(null) }}>← Back</button>
              <span style={s.badge(pcBadge(selectedWO.priority))}>{selectedWO.priority}</span>
              <span style={{ fontSize: '13px', fontWeight: '700', color: '#e2e8f0', flex: 1 }}>{selectedWO.title}</span>
              <button style={s.btnSave} onClick={saveDraft}>Save draft</button>
            </div>

            <div style={{ display: 'flex', gap: '6px', marginBottom: '14px', overflowX: 'auto', paddingBottom: '2px' }}>
              {['overview', 'procedure', 'photos', 'close'].map(t => (
                <div key={t} style={s.woInnerTab(woTab === t)} onClick={() => setWoTab(t)}>
                  {t === 'overview' ? 'Overview' : t === 'procedure' ? `Procedure (${selectedWO.procedure?.length})` : t === 'photos' ? `Photos (${beforePhotos.length + generalPhotos.length + afterPhotos.length})` : 'Close WO'}
                </div>
              ))}
            </div>

            {woTab === 'overview' && <>
              <div style={{ ...s.card, marginBottom: '10px', borderLeft: `3px solid ${pcBadge(selectedWO.priority)}` }}>
                <div style={s.cardTitle}>Notes</div>
                <div style={{ fontSize: '12px', color: '#a0aec0', lineHeight: '1.7' }}>{selectedWO.notes}</div>
              </div>
              <div style={s.card}>
                <div style={s.cardTitle}>Parts & Materials</div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead><tr style={{ borderBottom: '1px solid #2d3748' }}>
                    {['PART #', 'DESCRIPTION', 'QTY', 'UNIT'].map((h, i) => <th key={i} style={{ textAlign: i === 2 ? 'center' : 'left', padding: '4px 8px 8px', color: '#4a5568', fontSize: '10px', fontWeight: '700' }}>{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {selectedWO.parts?.map((p, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #1e2330' }}>
                        <td style={{ padding: '8px', color: '#90cdf4', fontFamily: 'monospace', fontSize: '11px' }}>{p.partNumber}</td>
                        <td style={{ padding: '8px', color: '#e2e8f0' }}>{p.description}</td>
                        <td style={{ padding: '8px', color: '#f6e05e', textAlign: 'center', fontWeight: '700' }}>{p.qty}</td>
                        <td style={{ padding: '8px', color: '#718096' }}>{p.unit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>}

            {woTab === 'procedure' && <div style={s.card}>
              <div style={s.cardTitle}>Step-by-step — {selectedWO.procedure?.length} steps</div>
              {selectedWO.procedure?.map((step, i) => (
                <div key={i} style={{ display: 'flex', gap: '12px', marginBottom: '14px', alignItems: 'flex-start' }}>
                  <div style={{ minWidth: '26px', height: '26px', borderRadius: '50%', background: '#2b6cb0', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '700', flexShrink: 0 }}>{i + 1}</div>
                  <div style={{ fontSize: '12px', color: '#e2e8f0', lineHeight: '1.75', paddingTop: '3px' }}>{step.replace(/^Step \d+:\s*/i, '')}</div>
                </div>
              ))}
            </div>}

            {woTab === 'photos' && <>
              {[{ label: 'Before job', photos: beforePhotos, setPhotos: setBeforePhotos, comment: beforeComment, setComment: setBeforeComment, placeholder: 'Condition before starting...' },
                { label: 'During job', photos: generalPhotos, setPhotos: setGeneralPhotos, comment: generalComment, setComment: setGeneralComment, placeholder: 'Findings, issues, notes during the job...' },
                { label: 'After job', photos: afterPhotos, setPhotos: setAfterPhotos, comment: afterComment, setComment: setAfterComment, placeholder: 'Final condition, torque values, notes for next time...' }
              ].map(({ label, photos, setPhotos, comment, setComment, placeholder }) => (
                <div key={label} style={{ ...s.card, marginBottom: '10px' }}>
                  <div style={s.cardTitle}>{label}</div>
                  <PhotoCapture photos={photos} onAdd={p => setPhotos(prev => [...prev, p])} onRemove={id => setPhotos(prev => prev.filter(p => p.id !== id))} />
                  <div style={{ marginTop: '10px' }}>
                    <label style={s.label}>Comments</label>
                    <textarea style={{ ...s.textarea, height: '60px' }} placeholder={placeholder} value={comment} onChange={e => setComment(e.target.value)} />
                  </div>
                </div>
              ))}
            </>}

            {woTab === 'close' && <>
              <div style={{ ...s.card, marginBottom: '10px', background: '#142010', borderColor: '#276749' }}>
                <div style={s.cardTitle}>Summary</div>
                <div style={{ fontSize: '12px', color: '#a0aec0', lineHeight: '2' }}>
                  <div>📋 <span style={{ color: '#e2e8f0', fontWeight: '600' }}>{selectedWO.title}</span></div>
                  <div>📸 {beforePhotos.length} before · {generalPhotos.length} during · {afterPhotos.length} after</div>
                  <div>💬 {[beforeComment, generalComment, afterComment].filter(Boolean).length} of 3 comment fields filled</div>
                </div>
              </div>
              <div style={{ ...s.card, marginBottom: '14px' }}>
                <label style={s.label}>Odometer at completion (km)</label>
                <input style={{ ...s.input, width: '160px' }} value={detailCloseKm} onChange={e => setDetailCloseKm(e.target.value)} />
              </div>
              {(beforePhotos.length + afterPhotos.length + generalPhotos.length === 0) && (
                <div style={{ background: '#2d2315', border: '1px solid #c05621', borderRadius: '6px', padding: '10px 12px', marginBottom: '12px', fontSize: '11px', color: '#f6ad55' }}>⚠ No photos attached yet.</div>
              )}
              <button style={{ ...s.btnGreen, width: '100%', padding: '14px' }} onClick={closeWODetail}>✓ Close Work Order & Save to History</button>
            </>}
          </>}
        </>}

        {/* ── MILEAGE LOG ── */}
        {tab === 'Mileage Log' && <>
          <div style={{ marginBottom: '20px' }}>
            <div style={s.secTitle}>Log odometer reading</div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ flex: 1 }}><label style={s.label}>Odometer (km)</label><input style={s.input} placeholder="e.g. 152,500" value={kmInput} onChange={e => setKmInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && logKm()} /></div>
              <button style={{ ...s.btn, marginTop: '20px', height: '36px' }} onClick={logKm}>Log</button>
            </div>
          </div>
          {state.weeklyLog.length === 0 && <div style={{ color: '#4a5568', textAlign: 'center', padding: '24px 0' }}>No mileage entries yet.</div>}
          {state.weeklyLog.map((entry, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderRadius: '6px', marginBottom: '5px', background: '#13151f', border: '1px solid #1e2330' }}>
              <div><span style={{ fontWeight: '600', color: '#90cdf4' }}>{fmtKm(entry.km)}</span><span style={{ marginLeft: '10px', fontSize: '10px', color: '#718096' }}>+{(entry.km - entry.prev).toLocaleString()} km</span></div>
              <span style={{ fontSize: '10px', color: '#4a5568' }}>{fmtDate(entry.date)}</span>
            </div>
          ))}
        </>}

        {/* ── SERVICE HISTORY ── */}
        {tab === 'Service History' && <>
          <div style={s.secTitle}>All completed services — {state.maintenanceLog.length}</div>
          {state.maintenanceLog.length === 0 && <div style={{ color: '#4a5568', textAlign: 'center', padding: '24px 0' }}>No services logged yet.</div>}
          {state.maintenanceLog.map((entry, i) => (
            <div key={i} style={{ ...s.card, marginBottom: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                <span style={{ fontWeight: '700', fontSize: '13px', color: '#68d391' }}>{entry.title}</span>
                <span style={s.badge('#276749')}>{entry.type}</span>
              </div>
              <div style={{ fontSize: '11px', color: '#718096', marginBottom: '4px' }}>@ {fmtKm(entry.doneKm)} · {fmtDate(entry.date)}</div>
              {entry.comment && <div style={{ fontSize: '11px', color: '#a0aec0', marginBottom: '3px' }}>{entry.comment}</div>}
              {entry.beforeComment && <div style={{ fontSize: '11px', color: '#a0aec0', marginBottom: '2px' }}><span style={{ color: '#4a5568' }}>Before: </span>{entry.beforeComment}</div>}
              {entry.generalComment && <div style={{ fontSize: '11px', color: '#a0aec0', marginBottom: '2px' }}><span style={{ color: '#4a5568' }}>During: </span>{entry.generalComment}</div>}
              {entry.afterComment && <div style={{ fontSize: '11px', color: '#a0aec0', marginBottom: '4px' }}><span style={{ color: '#4a5568' }}>After: </span>{entry.afterComment}</div>}
              {(entry.totalPhotos > 0 || entry.photos?.length > 0) && (
                <div style={{ marginTop: '6px' }}>
                  <div style={{ fontSize: '10px', color: '#4a5568', marginBottom: '5px' }}>📸 {entry.photos?.length || ((entry.beforePhotos?.length || 0) + (entry.generalPhotos?.length || 0) + (entry.afterPhotos?.length || 0))} photo(s)</div>
                  <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                    {[...(entry.photos || []), ...(entry.beforePhotos || []), ...(entry.generalPhotos || []), ...(entry.afterPhotos || [])].map((p, pi) => (
                      <img key={pi} src={p.url} alt="" style={{ width: '56px', height: '56px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #2d3748' }} />
                    ))}
                  </div>
                </div>
              )}
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
              <input style={{ ...s.input, flex: 1 }} placeholder="Ask about your CR-V..." value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendChat()} />
              <button style={s.btn} onClick={sendChat} disabled={chatLoading}>Send</button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
