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
import type { Person } from './lib/capture';
import type { Rec } from './types';

// Fixtures from the spec. Replace with resolver output (see lib/scoring.ts).
const nba: Rec = { id: 'gp', entity: 'Georgia Power', title: 'Contact Georgia Power', context: 'regarding service transfer.', impact: 92, confidence: 88, actions: ['Call Now', 'Start Online', 'More'], outcome: 'Prevent utility interruption before move.', why: 'Move date approaching in 6 days. No transfer request detected.' };
const reg: Rec = { id: 'reg', entity: 'Vehicle', title: 'Renew Vehicle Registration', context: 'Expires in 4 days', impact: 84, confidence: 97, actions: ['Complete'] };
const ins: Rec = { id: 'ins', entity: 'Insurance', title: 'Choose Insurance Plan', context: 'Enrollment closes in 12 days', recommendation: 'PPO Option', impact: 91, confidence: 82, actions: ['Review Options'] };
const esc: Rec = { id: 'esc', entity: 'Mortgage servicer', title: 'Mortgage Escrow Shortfall', context: 'Monthly payment may increase by $172.', impact: 96, confidence: 94, actions: ['Review', 'Contact Servicer'] };
const recs = [nba, reg, ins, esc];

const people: Person[] = [{ id: 'sj', name: 'Sarah Johnson' }];
const entities: Entity[] = [
  { id: 'sj', name: 'Sarah Johnson', type: 'Person', open: 1 }, { id: 'veh', name: 'Vehicle', type: 'Asset', open: 1 },
  { id: 'mort', name: 'Mortgage servicer', type: 'Account', open: 1 }, { id: 'ins', name: 'Insurance', type: 'Account', open: 1 },
  { id: 'gp', name: 'Georgia Power', type: 'Utility', open: 1 },
];
const searchable: Searchable[] = [...recs.map((r) => ({ id: r.id, title: r.title, subtitle: r.entity })), ...people.map((p) => ({ id: p.id, title: p.name, subtitle: 'Person' }))];

export default function App() {
  const [tab, setTab] = useState<Tab>('mission');
  return (
    <div className="mx-auto max-w-[860px] px-3.5 pb-32 pt-3 lg:ml-24 lg:max-w-none lg:pr-[360px]">
      <header className="mb-3"><h1 className="text-3xl font-bold">Life<span className="text-[var(--blue)]">OS</span></h1><p className="text-[var(--text-2)]">Mission Control</p></header>
      <main className="mx-auto max-w-[860px]">
        {tab === 'mission' && (<>
          <div className="mb-3"><NextBestActionCard rec={nba} /></div>
          <Section>
            <RecommendationCard rec={reg} label="⚡ EXECUTE NOW" />
            <RecommendationCard rec={ins} variant="decision" label="DECISIONS REQUIRED" />
          </Section>
          <Section full><RecommendationCard rec={esc} variant="risk" label="⚠ AT RISK" /></Section>
          <ReviewQueue items={[{ id: '1', title: 'Review Tax Return Draft', note: 'Due next week' }, { id: '2', title: 'Review Estate Planning Documents', note: 'Last reviewed 18 months ago' }]} />
        </>)}
        {tab === 'inbox' && <Inbox people={people} />}
        {tab === 'entities' && <Entities entities={entities} />}
        {tab === 'search' && <Search items={searchable} />}
        {tab === 'more' && <More />}
      </main>
      <BottomNavigation tab={tab} onChange={setTab} />
    </div>
  );
}
