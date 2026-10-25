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

export default function App() {
  const [tab, setTab] = useState<Tab>('mission');
  const [draft, setDraft] = useState('');
  const [captureOpen, setCaptureOpen] = useState(false);
  const [detailRec, setDetailRec] = useState<Rec | null>(null);
  const { inbox, archive, completed, capture } = useStore();
  const searchable: Searchable[] = [
    ...[nba, reg, ins, esc].map((r) => ({ id: `rec-${r.id}`, title: r.title, subtitle: `Example recommendation · ${r.entity}` })),
    ...people.map((p) => ({ id: `person-${p.id}`, title: p.name, subtitle: 'Person' })),
    ...entities.map((entity) => ({ id: `entity-${entity.id}`, title: entity.name, subtitle: `${entity.type} · example data` })),
    ...inbox.map((item, index) => ({ id: `open-${index}`, title: item, subtitle: 'Open loop' })),
    ...completed.map((item, index) => ({ id: `completed-${index}`, title: item, subtitle: 'Completed loop' })),
    ...archive.map((item, index) => ({ id: `archived-${index}`, title: item, subtitle: 'Archived loop' })),
  ];
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
        <button onClick={() => setCaptureOpen(true)} className="min-h-11 rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] px-4 font-semibold text-[var(--amber)]">＋ Capture</button>
      </header>
      <main className="mx-auto max-w-[860px]">
        {tab === 'mission' && (<>
          <div className="mb-3"><NextBestActionCard rec={nba} compact onExpand={() => setDetailRec(nba)} /></div>
          <p className="mb-3 rounded-xl border border-[var(--line)] px-3 py-2 text-xs text-[var(--text-2)]">Demo recommendations below are illustrative examples, not live account data.</p>
          <Section><RecommendationCard rec={reg} compact onExpand={() => setDetailRec(reg)} label="⚡ EXECUTE NOW" /><RecommendationCard rec={ins} compact onExpand={() => setDetailRec(ins)} variant="decision" label="DECISIONS REQUIRED" /></Section>
          <Section full><RecommendationCard rec={esc} compact onExpand={() => setDetailRec(esc)} variant="risk" label="⚠ AT RISK" /></Section>
          <ReviewQueue items={[{ id: '1', title: 'Review Tax Return Draft', note: 'Example recommendation · due next week' }, { id: '2', title: 'Review Estate Planning Documents', note: 'Example recommendation · last reviewed 18 months ago' }]} />
        </>)}
        {tab === 'inbox' && <Inbox people={people} />}
        {tab === 'entities' && <Entities entities={entities} />}
        {tab === 'search' && <Search items={searchable} onOpen={(id) => {
          if (id.startsWith('open-') || id.startsWith('completed-') || id.startsWith('archived-')) setTab('inbox');
          else if (id.startsWith('person-') || id.startsWith('entity-')) setTab('entities');
          else setTab('mission');
        }} />}
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
          <Search items={searchable} onOpen={(id) => { setCaptureOpen(false); if (id.startsWith('open-') || id.startsWith('completed-') || id.startsWith('archived-')) setTab('inbox'); else if (id.startsWith('person-') || id.startsWith('entity-')) setTab('entities'); else setTab('mission'); }} />
        </section>
      </div>}
      <BottomNavigation tab={tab} inboxCount={inbox.length} onChange={(nextTab) => { if (nextTab === 'search') setCaptureOpen(true); else setTab(nextTab); }} />
    </div>
  );
}
