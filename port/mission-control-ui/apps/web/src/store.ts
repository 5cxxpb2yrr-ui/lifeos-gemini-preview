import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_WEIGHTS, type Weights } from './lib/scoring';
import type { Person } from './lib/capture';

export interface OpenLoop {
  id: string;
  text: string;
  createdAt: string;
  completedAt?: string;
  archivedAt?: string;
  personId?: string;
}

interface State {
  people: Person[];
  addPerson: (name: string) => void;
  inbox: OpenLoop[];
  archive: OpenLoop[];
  completed: OpenLoop[];
  weights: Weights;
  capture: (text: string, personId?: string) => void;
  updateById: (id: string, text: string) => void;
  archiveById: (id: string) => void;
  restoreById: (id: string) => void;
  completeById: (id: string) => void;
  reopenCompletedById: (id: string) => void;
  setWeight: (key: keyof Weights, pct: number) => void;
  resetWeights: () => void;
}

const now = () => new Date().toISOString();
const makeId = () => typeof crypto !== 'undefined' && 'randomUUID' in crypto
  ? crypto.randomUUID()
  : `loop-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

function normalizeLoops(value: unknown, status: 'inbox' | 'archive' | 'completed'): OpenLoop[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item, index) => {
    if (typeof item === 'string') {
      const text = item.trim();
      return text ? [{
        id: `migrated-${status}-${index}-${encodeURIComponent(text).slice(0, 40)}`,
        text,
        createdAt: new Date(0).toISOString(),
        ...(status === 'completed' ? { completedAt: new Date(0).toISOString() } : {}),
        ...(status === 'archive' ? { archivedAt: new Date(0).toISOString() } : {}),
      }] : [];
    }
    if (item && typeof item === 'object' && 'text' in item && typeof item.text === 'string') {
      const loop = item as Partial<OpenLoop>;
      return [{
        id: typeof loop.id === 'string' && loop.id ? loop.id : `migrated-${status}-${index}`,
        text: loop.text as string,
        createdAt: typeof loop.createdAt === 'string' ? loop.createdAt : new Date(0).toISOString(),
        ...(typeof loop.completedAt === 'string' ? { completedAt: loop.completedAt } : status === 'completed' ? { completedAt: new Date(0).toISOString() } : {}),
        ...(typeof loop.archivedAt === 'string' ? { archivedAt: loop.archivedAt } : status === 'archive' ? { archivedAt: new Date(0).toISOString() } : {}),
        ...(typeof loop.personId === 'string' ? { personId: loop.personId } : {}),
      }];
    }
    return [];
  });
}

/** Converts the v0 string-array persistence format without dropping any saved lists. */
export function migratePersistedState(persisted: unknown): Partial<State> {
  const old = persisted && typeof persisted === 'object' ? persisted as Record<string, unknown> : {};
  const weights = old.weights && typeof old.weights === 'object' ? old.weights as Weights : DEFAULT_WEIGHTS;
  return {
    people: Array.isArray(old.people) ? old.people.filter((p): p is Person => !!p && typeof p === 'object' && typeof (p as Person).id === 'string' && typeof (p as Person).name === 'string') : [],
    inbox: normalizeLoops(old.inbox, 'inbox'),
    archive: normalizeLoops(old.archive, 'archive'),
    completed: normalizeLoops(old.completed, 'completed'),
    weights,
  };
}

export const useStore = create<State>()(persist((set) => ({
  people: [{ id: 'sj', name: 'Sarah Johnson' }], inbox: [], archive: [], completed: [], weights: DEFAULT_WEIGHTS,
  addPerson: (rawName) => {
    const name = rawName.trim().replace(/\s+/g, ' ');
    if (!name) return;
    set((state) => state.people.some(p => p.name.toLowerCase() === name.toLowerCase()) ? state : { people: [...state.people, { id: makeId(), name }] });
  },
  capture: (raw, personId) => {
    const text = raw.trim();
    if (!text) return;
    const tags = [...text.matchAll(/(?:^|\s)@([\w.-]+)/g)].map(match => match[1].replace(/[._-]+/g, ' ').trim()).filter(Boolean);
    set((state) => {
      const newPeople = tags.filter(tag => !state.people.some(p => p.name.toLowerCase() === tag.toLowerCase() || p.name.toLowerCase().replace(/\s/g, '') === tag.toLowerCase().replace(/\s/g, ''))).map(name => ({ id: makeId(), name }));
      return { people: [...state.people, ...newPeople], inbox: [{ id: makeId(), text, createdAt: now(), ...(personId ? { personId } : {}) }, ...state.inbox] };
    });
  },
  updateById: (id, raw) => {
    const text = raw.trim();
    if (!text) return;
    set((state) => ({ inbox: state.inbox.map((loop) => loop.id === id ? { ...loop, text } : loop) }));
  },
  archiveById: (id) => set((state) => {
    const loop = state.inbox.find((item) => item.id === id);
    return loop ? { inbox: state.inbox.filter((item) => item.id !== id), archive: [{ ...loop, archivedAt: now() }, ...state.archive] } : state;
  }),
  restoreById: (id) => set((state) => {
    const loop = state.archive.find((item) => item.id === id);
    return loop ? { archive: state.archive.filter((item) => item.id !== id), inbox: [{ ...loop, archivedAt: undefined }, ...state.inbox] } : state;
  }),
  completeById: (id) => set((state) => {
    const loop = state.inbox.find((item) => item.id === id);
    return loop ? { inbox: state.inbox.filter((item) => item.id !== id), completed: [{ ...loop, completedAt: now(), archivedAt: undefined }, ...state.completed] } : state;
  }),
  reopenCompletedById: (id) => set((state) => {
    const loop = state.completed.find((item) => item.id === id);
    return loop ? { completed: state.completed.filter((item) => item.id !== id), inbox: [{ ...loop, completedAt: undefined, archivedAt: undefined }, ...state.inbox] } : state;
  }),
  setWeight: (key, pct) => set((state) => ({ weights: { ...state.weights, [key]: Math.max(0, pct) / 100 } })),
  resetWeights: () => set({ weights: DEFAULT_WEIGHTS }),
}), {
  name: 'lifeos-mission-control',
  version: 1,
  migrate: (persistedState) => migratePersistedState(persistedState),
}));