# LifeOS Mission Control UI port

Drop `apps/web/src/*` into the web app (React + TS + Vite + Tailwind + Zustand). Paths are a guess: I could not read the repo, so adjust imports if your layout differs. Needs `zustand`.

- `lib/scoring.ts` is pure and tested. `lib/capture.ts` parses Universal Capture syntax and resolves `@person` tags. Both have vitest tests (`pnpm vitest`).
- `store.ts` is a persisted Zustand store (inbox, archive, scoring weights). Items are archived, never deleted.
- `theme/` holds the spec tokens and the 120/180/240ms motion values.
- All five tabs exist: Mission (App.tsx), Inbox, Entities, Search, More (in `screens/`).
- Mission, Entities and Search use the spec's example data. Swap in resolver output.
- Not ported yet: Bill Account Sheet, payments, person sheet, decision options, agenda/health views. The HTML prototype has these.
- Tailwind breakpoint used: lg (1024px) for the left navigation rail.
