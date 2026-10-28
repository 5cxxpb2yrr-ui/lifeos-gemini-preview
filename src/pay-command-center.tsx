import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import '../port/mission-control-ui/apps/web/src/theme/tokens.css';
import { PayCommandCenter } from '../port/mission-control-ui/apps/web/src/screens/PayCommandCenter';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <div className="mx-auto min-h-screen max-w-[860px] px-3.5 pb-24 pt-3">
      <header className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--amber)]">LifeOS · Finance</p>
          <h1 className="text-3xl font-bold">Pay Command Center</h1>
          <p className="text-sm text-[var(--text-2)]">Paycheck · PTO · Schedule · Plan</p>
        </div>
        <a href="./" className="rounded-xl border border-[var(--line)] px-3 py-2 text-sm">Mission Control</a>
      </header>
      <PayCommandCenter initialTab="home" />
    </div>
  </StrictMode>,
);
