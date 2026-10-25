import { beforeEach, describe, expect, it } from 'vitest';
import { migratePersistedState, useStore } from './store';
import { DEFAULT_WEIGHTS } from './lib/scoring';

beforeEach(() => useStore.setState({ inbox: [], archive: [], completed: [], weights: DEFAULT_WEIGHTS }));

describe('store', () => {
  it('captures, archives and restores by stable ID', () => {
    useStore.getState().capture('  Call @Marcus p2 ');
    useStore.getState().capture('Call @Marcus p2');
    const [newest, duplicate] = useStore.getState().inbox;
    expect(newest.id).not.toBe(duplicate.id);
    expect(newest.text).toBe('Call @Marcus p2');
    expect(newest.createdAt).toBeTruthy();

    useStore.getState().archiveById(newest.id);
    expect(useStore.getState().inbox.map((loop) => loop.id)).toEqual([duplicate.id]);
    expect(useStore.getState().archive[0]).toMatchObject({ id: newest.id, archivedAt: expect.any(String) });
    useStore.getState().restoreById(newest.id);
    expect(useStore.getState().inbox.map((loop) => loop.id)).toContain(newest.id);
    expect(useStore.getState().archive).toHaveLength(0);
  });

  it('completes and reopens by ID while preserving completion timestamps', () => {
    useStore.getState().capture('Pay bill');
    const loop = useStore.getState().inbox[0];
    useStore.getState().completeById(loop.id);
    expect(useStore.getState().completed[0]).toMatchObject({ id: loop.id, completedAt: expect.any(String) });
    useStore.getState().reopenCompletedById(loop.id);
    expect(useStore.getState().completed).toHaveLength(0);
    expect(useStore.getState().inbox[0]).toMatchObject({ id: loop.id, text: 'Pay bill' });
    expect(useStore.getState().inbox[0].completedAt).toBeUndefined();
  });

  it('migrates legacy string arrays without losing duplicate records', () => {
    const migrated = migratePersistedState({
      inbox: ['Same text', 'Same text'],
      archive: ['Old item'],
      completed: ['Done item'],
      weights: DEFAULT_WEIGHTS,
    });
    expect(migrated.inbox).toHaveLength(2);
    expect(migrated.inbox?.[0].id).not.toBe(migrated.inbox?.[1].id);
    expect(migrated.inbox?.map((loop) => loop.text)).toEqual(['Same text', 'Same text']);
    expect(migrated.archive?.[0]).toMatchObject({ text: 'Old item', archivedAt: expect.any(String) });
    expect(migrated.completed?.[0]).toMatchObject({ text: 'Done item', completedAt: expect.any(String) });
  });

  it('edits and resets weights', () => {
    useStore.getState().setWeight('urgency', 80);
    expect(useStore.getState().weights.urgency).toBe(0.8);
    useStore.getState().resetWeights();
    expect(useStore.getState().weights).toEqual(DEFAULT_WEIGHTS);
  });
});
