import { useState } from 'react';
import type { Weights } from '../lib/scoring';
import { useStore } from '../store';

const ROWS: [keyof Weights, string][] = [['urgency', 'Urgency'], ['exposure', 'Exposure'], ['consequence', 'Consequence'], ['completeness', 'Data completeness'], ['freshness', 'Freshness']];
const card = 'mb-3 rounded-[28px] border border-[var(--line)] bg-[var(--surface-1)] p-3';

export function More() {
  const { weights, setWeight, resetWeights, inbox, archive } = useStore();
  const [note, setNote] = useState('');
  const copy = async () => {
    try { await navigator.clipboard.writeText(JSON.stringify({ inbox, archive, weights }, null, 1)); setNote('Export copied'); }
    catch { setNote('Clipboard blocked in this browser'); }
  };
  return (
    <section>
      <h2 className="mb-3 text-xl font-semibold">More</h2>
      <div className={card}>
        <h3 className="font-semibold">Scoring weights</h3>
        <p className="text-xs text-[var(--text-2)]">Impact and confidence are computed from these. Each group is normalized to 100%.</p>
        {ROWS.map(([k, label]) => (
          <label key={k} className="flex min-h-11 items-center justify-between border-t border-[var(--line)] text-sm">
            {label}
            <input type="number" min={0} max={100} inputMode="numeric" value={Math.round(weights[k] * 100)} onChange={(e) => setWeight(k, Number(e.target.value))}
              className="w-20 rounded-lg border border-[var(--line)] bg-[var(--bg)] px-2 py-1.5 text-right" />
          </label>
        ))}
        <button onClick={resetWeights} className="mt-2 min-h-11 w-full rounded-[20px] bg-[var(--surface-3)] text-sm font-semibold">Reset weights</button>
      </div>
      <div className={card}>
        <h3 className="font-semibold">Your data</h3>
        <p className="text-xs text-[var(--text-2)]">{inbox.length} inbox · {archive.length} archived</p>
        <button onClick={copy} className="mt-2 min-h-11 w-full rounded-[20px] bg-[var(--surface-3)] text-sm font-semibold">Copy export</button>
        {note && <p className="mt-1.5 text-xs text-[var(--text-2)]">{note}</p>}
      </div>
    </section>
  );
}
