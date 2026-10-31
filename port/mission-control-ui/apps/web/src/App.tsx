import { useState } from 'react';
import './theme/tokens.css';
import { BottomNavigation, type Tab } from './components/BottomNavigation';
import { ReviewQueue } from './components/ReviewQueue';
import { Section } from './components/Section';
import { Entities, type Entity } from './screens/Entities';
import { Inbox } from './screens/Inbox';
import { More } from './screens/More';
import { PayCommandCenter } from './screens/PayCommandCenter';
import { Search, type Searchable } from './screens/Search';
import { useStore } from './store';
import type { Person } from './lib/capture';

const people: Person[] = [{ id: 'sj', name: 'Sarah Johnson' }];
const entities: Entity[] = [
  { id: 'sj', name: 'Sarah Johnson', type: 'Person', open: 1 }, { id: 'veh', name: 'Vehicle', type: 'Asset', open: 1 },
  { id: 'mort', name: 'Mortgage servicer', type: 'Account', open: 1 }, { id: 'ins', name: 'Insurance', type: 'Account', open: 1 },
  { id: 'gp', name: 'Georgia Power', type: 'Utility', open: 1 },
];

export default function App() {
  const [tab, setTab] = useState<Tab>('mission');
  const [financeInitialTab, setFinanceInitialTab] = useState<'home' | 'pto' | 'schedule'>('schedule');
  const [draft, setDraft] = useState('');
  const [captureOpen, setCaptureOpen] = useState(false);
  const [focusedLoopId, setFocusedLoopId] = useState<string | null>(null);
  const { inbox, archive, completed, capture } = useStore();
  const searchable: Searchable[] = [
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
          <p className="mb-3 rounded-xl border border-[var(--line)] bg-[var(--surface-1)] px-3 py-2 text-xs text-[var(--text-2)]"><span className="font-bold text-[var(--amber)]">LIVE OPEN LOOPS</span> · The action below is selected from your stored inbox. Sample entities remain illustrative.</p>
          {inbox.length > 0 ? <div className="mb-3 rounded-2xl border border-[var(--blue)]/50 bg-gradient-to-b from-[#12244a] to-[var(--surface-1)] p-3 shadow-[0_0_20px_#3B82F622]">
            <p className="mb-1 text-[10px] font-bold tracking-wide text-[var(--blue)]">✦ NEXT OPEN LOOP</p>
            <p className="text-[11px] text-[var(--text-3)]">From your stored LifeOS inbox</p>
            <h2 className="text-base font-semibold leading-snug">{inbox[0].text}</h2>
            <button onClick={() => { setFocusedLoopId(inbox[0].id); setTab('inbox'); }} className="mt-3 min-h-10 rounded-xl bg-[var(--blue)] px-4 text-sm font-semibold text-white">Open this loop</button>
          </div> : <div className="mb-3 rounded-2xl border border-[var(--line)] bg-[var(--surface-1)] p-4">
            <p className="text-[10px] font-bold tracking-wide text-[var(--blue)]">✦ NEXT BEST ACTION</p>
            <h2 className="mt-1 text-base font-semibold">Capture what needs your attention</h2>
            <p className="mt-1 text-sm text-[var(--text-2)]">Mission Control will show your open loops here. No invented tasks or recommendations.</p>
            <button onClick={() => setCaptureOpen(true)} className="mt-3 min-h-10 rounded-xl bg-[var(--amber)] px-4 text-sm font-bold text-black">＋ Capture a loop</button>
          </div>}
          <p className="mb-3 rounded-xl border border-[var(--line)] px-3 py-2 text-xs text-[var(--text-2)]">Live view · Open-loop records and counts below come from your stored LifeOS data. Resolver-backed recommendations will be added when the required facts and rules are available.</p>
          <section className="mb-3 grid grid-cols-3 gap-2" aria-label="Mission status">
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-1)] p-3"><p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-2)]">Open loops</p><p className="mt-1 text-2xl font-bold">{inbox.length}</p></div>
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-1)] p-3"><p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-2)]">Completed</p><p className="mt-1 text-2xl font-bold">{completed.length}</p></div>
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-1)] p-3"><p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-2)]">Archived</p><p className="mt-1 text-2xl font-bold">{archive.length}</p></div>
          </section>
          <ReviewQueue items={inbox.slice(0, 5).map((item) => ({ id: item.id, title: item.text, note: 'Open loop' }))} onOpen={(id) => { setFocusedLoopId(id); setTab('inbox'); }} />
        </>)}
        {tab === 'finance' && <PayCommandCenter initialTab={financeInitialTab} />}
        {tab === 'inbox' && <Inbox people={people} focusLoopId={focusedLoopId} />}
        {tab === 'entities' && <Entities entities={entities} />}
        {tab === 'search' && <Search items={searchable} onOpen={openSearchResult} />}
        {tab === 'more' && <More />}
      </main>
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
