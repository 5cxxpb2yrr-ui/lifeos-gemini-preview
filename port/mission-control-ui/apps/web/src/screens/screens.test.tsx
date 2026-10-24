import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Entities } from './Entities';
import { Inbox } from './Inbox';
import { More } from './More';
import { Search } from './Search';
import App from '../App';

describe('screens render', () => {
  it('renders every tab without throwing', () => {
    expect(renderToString(<Inbox people={[{ id: '1', name: 'Marcus Chen' }]} />)).toContain('Inbox is clear');
    expect(renderToString(<Entities entities={[{ id: 'a', name: 'Vehicle', type: 'Asset', open: 1 }]} />)).toContain('Vehicle');
    expect(renderToString(<Search items={[{ id: 'a', title: 'Pay bill' }]} />)).toContain('Pay bill');
    expect(renderToString(<More />)).toContain('Scoring weights');
    expect(renderToString(<App />)).toContain('NEXT BEST ACTION');
  });
});
