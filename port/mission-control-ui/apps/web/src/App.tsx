import { useState } from 'react';
import './theme/tokens.css';
import { BottomNavigation, type Tab } from './components/BottomNavigation';
import { NextBestActionCard } from './components/NextBestActionCard';
import { RecommendationCard } from './components/RecommendationCard';
import { ReviewQueue } from './components/ReviewQueue';
import { Section } from './components/Section';
import { Entities, type Entity } from './screens/Entities';
import { Inbox } from './screens/Inbox';
import { More } from './screens/More';
import { PayCommandCenter } from './screens/PayCommandCenter';
import { Search, type Searchable } from './screens/Search';
import { useStore } from './store';
import type { Person } from './lib/capture';
import type { Rec } from './types';

const nba: Rec = { id: 'gp', entity: 'Georgia Power', title: 'Contact Georgia Power', context: 'regarding service transfer.', impact: 92, confidence: 88, actions: ['Call Now', 'Start Online', 'More'], outcome: 'Prevent utility interruption before move.', why: 'Move date approaching in 6 days. No transfer request detected.' };
const reg: Rec = { id: 'reg', entity: 'Vehicle', title: 'Renew Vehicle Registration', context: 'Expires in 4 days', impact: 84, confidence: 97, actions: ['Complete'] };
const ins: Rec = { id: 'ins', entity: 'Insurance', title: 'Choose Insurance Plan', context: 'Enrollment closes in 12 days', recommendation: 'PPO Option', impact: 91, confidence: 82, actions: ['Review Options'] };
const esc: Rec = { id: 'esc', entity: 'Mortgage servicer', title: 'Mortgage Escrow Shortfall', context: 'Monthly payment may increase by $172.', impact: 96, confidence: 94, actions: ['Review', 'Contact Servicer'] };
const people: Person[] = [{ id: 'sj', name: 'Sarah Johnson' }];
const entities: Entity[] = [
  { id: 'sj', name: 'Sarah Johnson', type: 'Person', open: 1 }, { id: 'veh', name: 'Vehicle', type: 'Asset', open: 1 },
  { id: 'mort', name: 'Mortgage servicer', type: 'Account', open: 1 }, { id: 'ins', name: 'Insurance', type: 'Account', open: 1 },
  { id: 'gp', name: 'Georgia Power', type: 'Utility', open: 1 },
];


type DecisionCriterion = { id: string; name: string; weight: number; direction: 'higher' | 'lower' };
type DecisionOption = { id: string; name: string; scores: Record<string, number> };
type DecisionFrame = { id: string; title: string; objective: string; criteria: DecisionCriterion[]; options: DecisionOption[]; updatedAt: string; status?: 'evaluating' | 'decided' | 'reviewed'; chosenOptionId?: string; decisionRationale?: string; decidedAt?: string; reviewDate?: string; actualOutcome?: string; outcomeRating?: 'better' | 'as-expected' | 'worse' };
const decisionKey = 'lifeos.decision-matrix.v1';
const seedFrame = (): DecisionFrame => {
  const criteria: DecisionCriterion[] = [
    { id: 'impact', name: 'Expected impact', weight: 35, direction: 'higher' },
    { id: 'risk', name: 'Risk / downside', weight: 25, direction: 'lower' },
    { id: 'alignment', name: 'Strategic alignment', weight: 25, direction: 'higher' },
    { id: 'effort', name: 'Effort / cost', weight: 15, direction: 'lower' },
  ];
  return { id: crypto.randomUUID(), title: 'New decision', objective: '', criteria, options: [
    { id: crypto.randomUUID(), name: 'Option A', scores: { impact: 3, risk: 3, alignment: 3, effort: 3 } },
    { id: crypto.randomUUID(), name: 'Option B', scores: { impact: 3, risk: 3, alignment: 3, effort: 3 } },
  ], updatedAt: new Date().toISOString() };
};
function loadDecisionFrames(): DecisionFrame[] {
  try { const raw = localStorage.getItem(decisionKey); if (raw) { const parsed = JSON.parse(raw); if (Array.isArray(parsed)) return parsed; } } catch { /* recover with a fresh local frame */ }
  return [];
}
function scoreDecision(frame: DecisionFrame, option: DecisionOption) {
  const totalWeight = frame.criteria.reduce((sum, c) => sum + Math.max(0, c.weight), 0) || 1;
  const weighted = frame.criteria.reduce((sum, c) => {
    const raw = Math.min(5, Math.max(1, Number(option.scores[c.id] ?? 3)));
    const normalized = c.direction === 'lower' ? 6 - raw : raw;
    return sum + normalized * Math.max(0, c.weight);
  }, 0) / totalWeight;
  return Math.round(weighted * 100) / 100;
}
function DecisionMatrix() {
  const [frames, setFrames] = useState<DecisionFrame[]>(loadDecisionFrames);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const active = frames.find(f => f.id === activeId) ?? null;
  const persist = (next: DecisionFrame[]) => { setFrames(next); try { localStorage.setItem(decisionKey, JSON.stringify(next)); } catch { /* visible state still works for this session */ } };
  const patchActive = (patch: Partial<DecisionFrame>) => { if (!active) return; persist(frames.map(f => f.id === active.id ? { ...f, ...patch, updatedAt: new Date().toISOString() } : f)); };
  const createFrame = () => { const frame = seedFrame(); frame.title = 'Untitled decision'; const next = [...frames, frame]; persist(next); setActiveId(frame.id); setShowEditor(true); };
  const updateOption = (optionId: string, patch: Partial<DecisionOption>) => { if (!active) return; patchActive({ options: active.options.map(o => o.id === optionId ? { ...o, ...patch } : o) }); };
  const updateScore = (optionId: string, criterionId: string, value: number) => { if (!active) return; patchActive({ options: active.options.map(o => o.id === optionId ? { ...o, scores: { ...o.scores, [criterionId]: value } } : o) }); };
  const updateCriterion = (criterionId: string, patch: Partial<DecisionCriterion>) => { if (!active) return; patchActive({ criteria: active.criteria.map(x => x.id === criterionId ? { ...x, ...patch } : x) }); };
  const addOption = () => { if (!active) return; const id = crypto.randomUUID(); patchActive({ options: [...active.options, { id, name: 'New option', scores: Object.fromEntries(active.criteria.map(c => [c.id, 3])) }] }); };
  const addCriterion = () => { if (!active) return; const id = crypto.randomUUID(); patchActive({ criteria: [...active.criteria, { id, name: 'New criterion', weight: 10, direction: 'higher' }] }); };
  const ranked = active ? [...active.options].sort((a,b) => scoreDecision(active,b)-scoreDecision(active,a)) : [];
  return <section className="space-y-4">
    <header className="flex items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[.2em] text-[var(--cyan)]">Decision intelligence</p><h1 className="text-2xl font-extrabold sm:text-3xl">Strategic Decision Matrix</h1></div><span className="rounded-xl border border-[var(--line)] px-3 py-2 text-xs text-[var(--text-2)]">{frames.length} frame{frames.length===1?'':'s'}</span></header>
    <div className="rounded-3xl border border-[var(--line)] bg-[var(--surface-1)] p-4 sm:p-5"><div className="flex items-start justify-between gap-3"><div><h2 className="text-xl font-bold">Active Decision Matrix</h2><p className="mt-2 text-sm text-[var(--text-2)]">Compare options using weighted impact, risk, effort, and strategic alignment. Scores are decision support—not an automatic decision.</p></div><button onClick={createFrame} className="min-h-11 shrink-0 rounded-2xl bg-blue-600 px-4 py-2 font-bold text-white">＋ New Decision Frame</button></div></div>
    {!frames.length && <div className="rounded-3xl border border-[var(--line)] bg-[var(--surface-1)] p-8 text-center text-[var(--text-2)]">No active decisions under evaluation. Create a frame to compare your options.</div>}
    {frames.map(frame => <button key={frame.id} onClick={()=>{setActiveId(frame.id);setShowEditor(false)}} className={'w-full rounded-2xl border p-4 text-left '+(activeId===frame.id?'border-[var(--cyan)] bg-[var(--surface-2)]':'border-[var(--line)] bg-[var(--surface-1)]')}><span className="flex items-center justify-between gap-3"><strong>{frame.title || 'Untitled decision'}</strong><span className="text-sm text-[var(--cyan)]">{frame.options.length} options →</span></span><span className="mt-1 block text-sm text-[var(--text-2)]">{frame.objective || 'Objective not set'}</span></button>)}
    {active && <div className="space-y-4 rounded-3xl border border-[var(--line)] bg-[var(--surface-1)] p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3"><h2 className="text-xl font-bold">Decision workspace</h2><button onClick={()=>setShowEditor(v=>!v)} className="min-h-10 rounded-xl border border-[var(--line)] px-3 text-sm">{showEditor?'Hide setup':'Edit criteria & options'}</button></div>
      <label className="block text-sm font-semibold text-[var(--text-2)]">Decision title<input value={active.title} onChange={e=>patchActive({title:e.target.value})} className="mt-1 min-h-11 w-full rounded-xl border border-[var(--line)] bg-[var(--bg)] px-3 text-[var(--text)]"/></label>
      <label className="block text-sm font-semibold text-[var(--text-2)]">Objective / desired outcome<textarea value={active.objective} onChange={e=>patchActive({objective:e.target.value})} placeholder="What outcome matters most?" className="mt-1 min-h-20 w-full rounded-xl border border-[var(--line)] bg-[var(--bg)] p-3 text-[var(--text)]"/></label>
      {showEditor && <div className="space-y-3 rounded-2xl border border-[var(--line)] p-3"><div className="flex items-center justify-between"><h3 className="font-bold">Criteria & weights</h3><button onClick={addCriterion} className="text-sm font-bold text-[var(--cyan)]">＋ Criterion</button></div><p className="text-xs text-[var(--text-2)]">Weights are relative; scores are 1–5. Lower is better for criteria marked “lower”.</p>{active.criteria.map(cr=><div key={cr.id} className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_84px_120px]"><input value={cr.name} onChange={e=>updateCriterion(cr.id,{name:e.target.value})} className="min-h-10 rounded-lg border border-[var(--line)] bg-[var(--bg)] px-2"/><label className="text-xs text-[var(--text-2)]">Weight %<input type="number" min="0" max="100" value={cr.weight} onChange={e=>updateCriterion(cr.id,{weight:Math.max(0,Number(e.target.value)||0)})} className="min-h-10 w-full rounded-lg border border-[var(--line)] bg-[var(--bg)] px-2"/></label><select value={cr.direction} onChange={e=>updateCriterion(cr.id,{direction:e.target.value as 'higher'|'lower'})} className="min-h-10 rounded-lg border border-[var(--line)] bg-[var(--bg)] px-2"><option value="higher">Higher is better</option><option value="lower">Lower is better</option></select></div>)}
      <div className="flex items-center justify-between pt-2"><h3 className="font-bold">Options</h3><button onClick={addOption} className="text-sm font-bold text-[var(--cyan)]">＋ Add option</button></div>{active.options.map(o=><input key={o.id} value={o.name} onChange={e=>updateOption(o.id,{name:e.target.value})} className="min-h-11 w-full rounded-xl border border-[var(--line)] bg-[var(--bg)] px-3"/>)}</div>}
      <div><h3 className="mb-3 font-bold">Weighted scorecard</h3><div className="space-y-4">{active.options.map(o=><div key={o.id} className="rounded-2xl border border-[var(--line)] p-3"><div className="mb-3 flex items-center justify-between gap-3"><strong>{o.name||'Unnamed option'}</strong><span className="text-xl font-extrabold text-[var(--cyan)]">{scoreDecision(active,o).toFixed(2)} <small className="text-xs text-[var(--text-2)]">/ 5</small></span></div>{active.criteria.map(cr=><label key={cr.id} className="mb-3 block text-sm"><span className="flex justify-between gap-2"><span>{cr.name} <small className="text-[var(--text-2)]">· {cr.weight}% · {cr.direction==='lower'?'lower wins':'higher wins'}</small></span><b>{o.scores[cr.id]??3}/5</b></span><input aria-label={o.name+' '+cr.name+' score'} type="range" min="1" max="5" step="1" value={o.scores[cr.id]??3} onChange={e=>updateScore(o.id,cr.id,Number(e.target.value))} className="w-full accent-cyan-400"/></label>)}</div>)}</div></div>
      <div className="space-y-3 rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] p-4">
        <div><p className="text-xs font-bold uppercase tracking-widest text-[var(--cyan)]">Decision record</p><h3 className="mt-1 text-lg font-bold">Commit, then learn</h3><p className="text-sm text-[var(--text-2)]">Record what you chose and why. Revisit the result on the review date.</p></div>
        <label className="block text-sm font-semibold text-[var(--text-2)]">Chosen option
          <select value={active.chosenOptionId ?? ''} onChange={e=>patchActive({chosenOptionId:e.target.value || undefined,status:e.target.value?'decided':'evaluating',decidedAt:e.target.value?(active.decidedAt || new Date().toISOString()):undefined})} className="mt-1 min-h-11 w-full rounded-xl border border-[var(--line)] bg-[var(--bg)] px-3 text-[var(--text)]">
            <option value="">Still evaluating</option>{active.options.map(o=><option key={o.id} value={o.id}>{o.name || 'Unnamed option'}</option>)}
          </select>
        </label>
        <label className="block text-sm font-semibold text-[var(--text-2)]">Decision rationale / assumptions
          <textarea value={active.decisionRationale ?? ''} onChange={e=>patchActive({decisionRationale:e.target.value})} placeholder="Why this option? What assumptions or trade-offs are you accepting?" className="mt-1 min-h-20 w-full rounded-xl border border-[var(--line)] bg-[var(--bg)] p-3 text-[var(--text)]"/>
        </label>
        <label className="block text-sm font-semibold text-[var(--text-2)]">Outcome review date
          <input type="date" value={active.reviewDate ?? ''} onChange={e=>patchActive({reviewDate:e.target.value})} className="mt-1 min-h-11 w-full rounded-xl border border-[var(--line)] bg-[var(--bg)] px-3 text-[var(--text)]"/>
        </label>
        <label className="block text-sm font-semibold text-[var(--text-2)]">Actual outcome / evidence
          <textarea value={active.actualOutcome ?? ''} onChange={e=>patchActive({actualOutcome:e.target.value,status: e.target.value.trim()?'reviewed':(active.chosenOptionId?'decided':'evaluating')})} placeholder="What actually happened? Capture measurable results and evidence." className="mt-1 min-h-20 w-full rounded-xl border border-[var(--line)] bg-[var(--bg)] p-3 text-[var(--text)]"/>
        </label>
        <label className="block text-sm font-semibold text-[var(--text-2)]">Result versus expectation
          <select value={active.outcomeRating ?? ''} onChange={e=>patchActive({outcomeRating:(e.target.value || undefined) as DecisionFrame['outcomeRating'],status:e.target.value?'reviewed':(active.chosenOptionId?'decided':'evaluating')})} className="mt-1 min-h-11 w-full rounded-xl border border-[var(--line)] bg-[var(--bg)] px-3 text-[var(--text)]">
            <option value="">Not reviewed</option><option value="better">Better than expected</option><option value="as-expected">As expected</option><option value="worse">Worse than expected</option>
          </select>
        </label>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--line)] pt-3 text-sm"><span className="text-[var(--text-2)]">Status: <b className="text-[var(--text)]">{active.status==='reviewed'?'Outcome reviewed':active.chosenOptionId?'Decision recorded':'Evaluating'}</b></span><button onClick={()=>{if(confirm('Clear the outcome review fields?'))patchActive({actualOutcome:'',outcomeRating:undefined,status:active.chosenOptionId?'decided':'evaluating'})}} className="min-h-9 rounded-lg border border-[var(--line)] px-3">Clear outcome review</button></div>
      </div>
      <div className="rounded-2xl border border-[var(--cyan)]/40 bg-[var(--surface-2)] p-4"><p className="text-xs font-bold uppercase tracking-widest text-[var(--cyan)]">Current ranking</p>{ranked.map((o,i)=><div key={o.id} className="mt-2 flex items-center justify-between gap-3"><span>{i+1}. {o.name}</span><b>{scoreDecision(active,o).toFixed(2)} / 5</b></div>)}<p className="mt-3 text-xs text-[var(--text-2)]">Scores normalize weights automatically. Confirm assumptions and downside risks before committing.</p></div>
      <div className="flex flex-wrap justify-between gap-2"><button onClick={()=>{const fresh=seedFrame();persist([...frames,fresh]);setActiveId(fresh.id);setShowEditor(true)}} className="min-h-10 rounded-xl border border-[var(--line)] px-3 text-sm">＋ Duplicate-style new frame</button><button onClick={()=>{if(confirm('Delete this decision frame?')){const next=frames.filter(f=>f.id!==active.id);persist(next);setActiveId(null)}}} className="min-h-10 rounded-xl border border-rose-500/50 px-3 text-sm text-rose-300">Delete frame</button></div>
    </div>}
  </section>;
}

export default function App() {
  const [tab, setTab] = useState<Tab>('mission');
  const [financeInitialTab, setFinanceInitialTab] = useState<'home' | 'pto' | 'schedule'>('schedule');
  const [draft, setDraft] = useState('');
  const [captureOpen, setCaptureOpen] = useState(false);
  const [detailRec, setDetailRec] = useState<Rec | null>(null);
  const { inbox, archive, completed, capture } = useStore();
  const searchable: Searchable[] = [
    ...[nba, reg, ins, esc].map((r) => ({ id: `rec-${r.id}`, title: r.title, subtitle: `Example recommendation · ${r.entity}`, destination: 'mission' as const })),
    ...people.map((p) => ({ id: `person-${p.id}`, title: p.name, subtitle: 'Person', destination: 'entities' as const })),
    ...entities.map((entity) => ({ id: `entity-${entity.id}`, title: entity.name, subtitle: `${entity.type} · example data`, destination: 'entities' as const })),
    ...inbox.map((item) => ({ id: `open-${item.id}`, title: item.text, subtitle: 'Open loop', destination: 'inbox' as const })),
    ...completed.map((item) => ({ id: `completed-${item.id}`, title: item.text, subtitle: 'Completed loop', destination: 'inbox' as const })),
    ...archive.map((item) => ({ id: `archived-${item.id}`, title: item.text, subtitle: 'Archived loop', destination: 'inbox' as const })),
  ];
  const openSearchResult = (id: string) => {
    const result = searchable.find((item) => item.id === id);
    if (result) setTab(result.destination);
  };
  const submitCapture = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim()) return;
    capture(draft);
    setDraft('');
  };
  return (
    <div className="mx-auto max-w-[860px] px-3.5 pb-32 pt-3 lg:ml-24 lg:max-w-none lg:pr-[360px]">
      <header className="mb-4 flex items-center justify-between gap-3">
        <div><h1 className="text-3xl font-bold">Life<span className="text-[var(--amber)]">OS</span></h1><p className="text-[var(--text-2)]">Mission Control · Your life, in view</p></div>
        <div className="flex gap-2"><button onClick={() => { setFinanceInitialTab('pto'); setTab('finance'); }} className="min-h-11 rounded-2xl border border-[var(--amber)] bg-[var(--surface-2)] px-3 font-semibold text-[var(--amber)]">PTO</button><button onClick={() => setCaptureOpen(true)} className="min-h-11 rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] px-4 font-semibold text-[var(--amber)]">＋ Capture</button></div>
      </header>
      <main className="mx-auto max-w-[860px]">
        {tab === 'mission' && (<>
          <div className="mb-3"><NextBestActionCard rec={nba} compact onExpand={() => setDetailRec(nba)} /></div>
          <p className="mb-3 rounded-xl border border-[var(--line)] px-3 py-2 text-xs text-[var(--text-2)]">Demo recommendations below are illustrative examples, not live account data.</p>
          <Section><RecommendationCard rec={reg} compact onExpand={() => setDetailRec(reg)} label="⚡ EXECUTE NOW" /><RecommendationCard rec={ins} compact onExpand={() => setDetailRec(ins)} variant="decision" label="DECISIONS REQUIRED" /></Section>
          <Section full><RecommendationCard rec={esc} compact onExpand={() => setDetailRec(esc)} variant="risk" label="⚠ AT RISK" /></Section>
          <ReviewQueue items={[{ id: '1', title: 'Review Tax Return Draft', note: 'Example recommendation · due next week' }, { id: '2', title: 'Review Estate Planning Documents', note: 'Example recommendation · last reviewed 18 months ago' }]} />
        </>)}
        {tab === 'finance' && <PayCommandCenter initialTab={financeInitialTab} />}
        {tab === 'decisions' && <DecisionMatrix />}
        {tab === 'inbox' && <Inbox people={people} />}
        {tab === 'entities' && <Entities entities={entities} />}
        {tab === 'search' && <Search items={searchable} onOpen={openSearchResult} />}
        {tab === 'more' && <More />}
      </main>
      {detailRec && <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/75 p-3 backdrop-blur-sm sm:items-center" onClick={(e) => { if (e.target === e.currentTarget) setDetailRec(null); }}>
        <section role="dialog" aria-modal="true" aria-labelledby="detail-title" className="max-h-[85dvh] w-full max-w-xl overflow-y-auto rounded-3xl border border-[var(--line)] bg-[var(--surface-1)] p-4 shadow-[0_0_32px_rgba(255,106,0,0.16)]">
          <div className="mb-3 flex items-center justify-between gap-3"><div><p className="text-xs font-semibold tracking-wide text-[var(--amber)]">MISSION CONTROL DETAILS</p><h2 id="detail-title" className="text-lg font-bold">{detailRec.title}</h2></div><button onClick={() => setDetailRec(null)} aria-label="Close details" className="min-h-10 rounded-xl border border-[var(--line)] px-3">✕</button></div>
          {detailRec.id === 'gp'
            ? <NextBestActionCard rec={detailRec} />
            : <RecommendationCard rec={detailRec} variant={detailRec.id === 'ins' ? 'decision' : detailRec.id === 'esc' ? 'risk' : 'default'} />}
          <p className="mt-3 text-xs text-[var(--text-3)]">Illustrative demo recommendation — not live account data.</p>
        </section>
      </div>}
      {captureOpen && <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-3 backdrop-blur-sm sm:items-center" onClick={(e) => { if (e.target === e.currentTarget) setCaptureOpen(false); }}>
        <section role="dialog" aria-modal="true" aria-labelledby="capture-title" className="max-h-[85dvh] w-full max-w-xl overflow-y-auto rounded-3xl border border-[var(--line)] bg-[var(--surface-1)] p-4 shadow-[0_0_32px_rgba(255,106,0,0.14)]">
          <div className="mb-3 flex items-center justify-between gap-3"><h2 id="capture-title" className="text-xl font-bold text-[var(--amber)]">Capture & Search</h2><button onClick={() => setCaptureOpen(false)} aria-label="Close capture and search" className="min-h-10 rounded-xl border border-[var(--line)] px-3">✕</button></div>
          <form onSubmit={(e) => { submitCapture(e); }} className="mb-4 flex gap-2">
            <input autoFocus value={draft} onChange={(e) => setDraft(e.target.value)} aria-label="Capture a task, thought, or follow-up" placeholder="What needs your attention?" className="min-h-12 min-w-0 flex-1 rounded-2xl border border-[var(--line)] bg-[var(--bg)] px-4 text-[var(--text)] outline-none focus:border-[var(--amber)]" />
            <button type="submit" className="min-h-12 rounded-2xl bg-[var(--amber)] px-4 font-bold text-black">Add</button>
          </form>
          <Search items={searchable} onOpen={(id) => { setCaptureOpen(false); openSearchResult(id); }} />
        </section>
      </div>}
      <BottomNavigation tab={tab} inboxCount={inbox.length} onChange={(nextTab) => { if (nextTab === 'search') setCaptureOpen(true); else { if (nextTab === 'finance') setFinanceInitialTab('schedule'); setTab(nextTab); } }} />
    </div>
  );
}
