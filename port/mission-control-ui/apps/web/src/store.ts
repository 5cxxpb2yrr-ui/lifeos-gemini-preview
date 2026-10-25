import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_WEIGHTS, type Weights } from './lib/scoring';

interface State {
  inbox: string[]; archive: string[]; completed: string[]; weights: Weights;
  capture: (t: string) => void; updateAt: (i: number, t: string) => void; archiveAt: (i: number) => void; restoreAt: (i: number) => void;
  completeAt: (i: number) => void; reopenCompletedAt: (i: number) => void;
  setWeight: (k: keyof Weights, pct: number) => void; resetWeights: () => void;
}

export const useStore = create<State>()(persist((set) => ({
  inbox: [], archive: [], completed: [], weights: DEFAULT_WEIGHTS,
  capture: (t) => { const v = t.trim(); if (v) set((s) => ({ inbox: [v, ...s.inbox] })); },
  updateAt: (i, t) => set((s) => { const v = t.trim(); return s.inbox[i] === undefined || !v ? s : { inbox: s.inbox.map((x, n) => n === i ? v : x) }; }),
  // Archive keeps records recoverable; completion is tracked separately.
  archiveAt: (i) => set((s) => { const x = s.inbox[i]; return x === undefined ? s : { inbox: s.inbox.filter((_, n) => n !== i), archive: [x, ...s.archive] }; }),
  restoreAt: (i) => set((s) => { const x = s.archive[i]; return x === undefined ? s : { archive: s.archive.filter((_, n) => n !== i), inbox: [x, ...s.inbox] }; }),
  completeAt: (i) => set((s) => { const x = s.inbox[i]; return x === undefined ? s : { inbox: s.inbox.filter((_, n) => n !== i), completed: [x, ...s.completed] }; }),
  reopenCompletedAt: (i) => set((s) => { const x = s.completed[i]; return x === undefined ? s : { completed: s.completed.filter((_, n) => n !== i), inbox: [x, ...s.inbox] }; }),
  setWeight: (k, pct) => set((s) => ({ weights: { ...s.weights, [k]: Math.max(0, pct) / 100 } })),
  resetWeights: () => set({ weights: DEFAULT_WEIGHTS }),
}), { name: 'lifeos-mission-control' }));