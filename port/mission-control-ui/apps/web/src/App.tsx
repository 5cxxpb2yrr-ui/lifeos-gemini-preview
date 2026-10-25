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
  const [query, setQuery] = useState('');
  const { inbox, archive, completed, capture, completeAt, archiveAt } = useStore();
  const filtered = inbox.map((text, index) => ({ text, index })).filter((item) => item.text.toLowerCase().includes(query.toLowerCase()));
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
        <button onClick={() => setTab('inbox')} className="min-h-11 rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] px-4 font-semibold text-[var(--amber)]">＋ Capture</button>
      </header>
      <main className="mx-auto max-w-[860px]">
        {tab === 'mission' && (<>
          <section className="mb-4 rounded-3xl border border-[var(--line)] bg-[var(--surface-1)] p-4">
            <p className="mb-1 text-xs font-bold uppercase tracking-[.18em] text-[var(--amber)]">Universal capture</p>
            <form onSubmit={submitCapture} className="flex gap-2">
              <input value={draft} onChange={(e) => setDraft(e.target.value)} aria-label="Capture a task, thought, or follow-up" placeholder="What needs your attention?" className="min-h-12 min-w-0 flex-1 rounded-2xl border border-[var(--line)] bg-[var(--bg)] px-4 text-[var(--text)] outline-none focus:border-[var(--amber)]" />
              <button type="submit" className="min-h-12 rounded-2xl bg-[var(--amber)] px-4 font-bold text-black">Add</button>
            </form>
            <p className="mt-2 text-xs text-[var(--text-2)]">Saved on this device · searchable · can be completed or archived</p>
          </section>
          <section className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[{label:'Open loops',value:inbox.length},{label:'Completed',value:completed.length},{label:'Archived',value:archive.length},{label:'Recommendations',value:4}].map((item) => <div key={item.label} className="rounded-2xl border border-[var(--line)] bg-[var(--surface-1)] p-3"><p className="text-xs text-[var(--text-2)]">{item.label}</p><p className="mt-1 text-2xl font-bold text-[var(--amber)]">{item.value}</p></div>)}
          </section>
          <section className="mb-4 rounded-3xl border border-[var(--line)] bg-[var(--surface-1)] p-4">
            <div className="mb-3 flex items-center justify-between gap-3"><h2 className="text-lg font-semibold">Open loops</h2><button onClick={() => setTab('inbox')} className="text-sm font-semibold text-[var(--amber)]">Manage all →</button></div>
            <input value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Filter open loops" placeholder="Filter your open loops…" className="mb-3 min-h-10 w-full rounded-xl border border-[var(--line)] bg-[var(--bg)] px-3 text-[var(--text)]" />
            {filtered.length ? <ul className="space-y-2">{filtered.slice(0,5).map(({text,index}) => <li key={index} className="flex items-center gap-2 rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] p-3"><span className="min-w-0 flex-1 break-words">{text}</span><button aria-label={`Complete ${text}`} onClick={() => completeAt(index)} className="min-h-9 rounded-xl border border-[var(--line)] px-3 text-xs font-semibold text-[var(--amber)]">Done</button><button aria-label={`Archive ${text}`} onClick={() => archiveAt(index)} className="min-h-9 rounded-xl px-2 text-xs text-[var(--text-2)]">Archive</button></li>)}</ul> : <p className="rounded-2xl border border-dashed border-[var(--line)] p-5 text-center text-sm text-[var(--text-2)]">No open loops yet. Capture something above to make this dashboard yours.</p>}
          </section>
          <p className="mb-3 rounded-xl border border-[var(--line)] px-3 py-2 text-xs text-[var(--text-2)]">Demo recommendations below are illustrative examples, not live account data.</p>
          <div className="mb-3"><NextBestActionCard rec={nba} /></div>
          <Section><RecommendationCard rec={reg} label="⚡ EXECUTE NOW" /><RecommendationCard rec={ins} variant="decision" label="DECISIONS REQUIRED" /></Section>
          <Section full><RecommendationCard rec={esc} variant="risk" label="⚠ AT RISK" /></Section>
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
      <BottomNavigation tab={tab} onChange={setTab} />
    </div>
  );
}
