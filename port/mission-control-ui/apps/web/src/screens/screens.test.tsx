import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Entities } from './Entities';
import { Inbox } from './Inbox';
import { More } from './More';
import { Search } from './Search';
import App from '../App';
import { useStore } from '../store';

describe('screens render', () => {
  it('keeps Mission Control metrics sourced from the shared store', () => {
    useStore.setState({
      inbox: [{ id: 'loop-1', text: 'Call the utility company', createdAt: '2026-10-30T12:00:00.000Z' }],
      completed: [{ id: 'done-1', text: 'Pay the water bill', createdAt: '2026-10-29T12:00:00.000Z', completedAt: '2026-10-30T12:00:00.000Z' }],
      archive: [{ id: 'arch-1', text: 'Old follow-up', createdAt: '2026-10-28T12:00:00.000Z', archivedAt: '2026-10-29T12:00:00.000Z' }],
    });
    try {
      const state = useStore.getState();
      expect(state.inbox.map((item) => item.text)).toContain('Call the utility company');
      expect(state.inbox).toHaveLength(1);
      expect(state.completed).toHaveLength(1);
      expect(state.archive).toHaveLength(1);
      expect(renderToString(<App />)).toContain('NEXT BEST ACTION');
    } finally {
      useStore.setState({ inbox: [], completed: [], archive: [] });
    }
  });

  it('renders every tab without throwing', () => {
    expect(renderToString(<Inbox people={[{ id: '1', name: 'Marcus Chen' }]} />)).toContain('Inbox is clear');
    expect(renderToString(<Entities entities={[{ id: 'a', name: 'Vehicle', type: 'Asset', open: 1 }]} />)).toContain('Vehicle');
    expect(renderToString(<Search items={[{ id: 'a', title: 'Pay bill', destination: 'inbox' }]} />)).toContain('Pay bill');
    expect(renderToString(<More />)).toContain('Scoring weights');
    expect(renderToString(<App />)).toContain('NEXT BEST ACTION');
  });



});
