import { useState } from 'react';
import { CaptureChips } from '../components/CaptureChips';
import { parseCap, type Person } from '../lib/capture';
import { useStore } from '../store';

const field = 'min-h-11 w-full rounded-xl border border-[var(--line)] bg-[var(--bg)] px-3 text-[var(--text)]';

export function Inbox({ people }: { people: Person[] }) {
  const { inbox, archive, completed, capture, updateAt, archiveAt, restoreAt, completeAt, reopenCompletedAt } = useStore();
  const [v, setV] = useState('');
  const [editing, setEditing] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const row = (t: string, label: string, onClick: () => void, dim = false) => {
    const p = parseCap(t);
    return (
      <li key={label + t} className={`mb-2 flex items-center justify-between gap-3 rounded-[22px] border border-[var(--line)] bg-[var(--surface-1)] p-3 ${dim ? 'opacity-70' : ''}`}>
        <div className="min-w-0 flex-1"><p className="break-words">{p.text || t}</p><CaptureChips parsed={p} people={people} /></div>
        <button onClick={onClick} className="min-h-10 shrink-0 rounded-[20px] bg-[var(--surface-3)] px-4 text-sm font-semibold">{label}</button>
      </li>
    );
  };
  return (
    <section>
      <h2 className="mb-3 text-xl font-semibold">Inbox</h2>
      <form onSubmit={(e) => { e.preventDefault(); capture(v); setV(''); }} className="mb-4">
        <input className={field} value={v} onChange={(e) => setV(e.target.value)} placeholder="Call @Marcus p2 *phone ^mentorship" aria-label="Capture" />
        <CaptureChips parsed={parseCap(v)} people={people} />
        <p className="mt-1.5 text-xs text-[var(--text-2)]">p1–p5 priority · *context · @person · &gt;project · ^goal · #tracker(value)</p>
      </form>
      {inbox.length ? <ul>{inbox.map((t, i) => (
        <li key={i} className="mb-2 rounded-[22px] border border-[var(--line)] bg-[var(--surface-1)] p-3">
          {editing === i ? <form onSubmit={(e) => { e.preventDefault(); updateAt(i, editValue); setEditing(null); }} className="flex gap-2">
            <input autoFocus className={field} aria-label="Edit open loop" value={editValue} onChange={(e) => setEditValue(e.target.value)} />
            <button className="min-h-10 rounded-xl bg-[var(--amber)] px-3 text-sm font-bold text-black" type="submit">Save</button>
            <button className="min-h-10 rounded-xl px-2 text-sm" type="button" onClick={() => setEditing(null)}>Cancel</button>
          </form> : <><div className="mb-3"><p className="break-words">{parseCap(t).text || t}</p><CaptureChips parsed={parseCap(t)} people={people} /></div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => completeAt(i)} className="min-h-10 rounded-xl border border-[var(--line)] px-3 text-sm font-semibold text-[var(--amber)]">Done</button>
              <button onClick={() => { setEditing(i); setEditValue(t); }} className="min-h-10 rounded-xl bg-[var(--surface-3)] px-3 text-sm font-semibold">Edit</button>
              <button onClick={() => archiveAt(i)} className="min-h-10 rounded-xl px-3 text-sm text-[var(--text-2)]">Archive</button>
            </div></>}
        </li>
      ))}</ul> : <p className="py-8 text-center text-[var(--text-2)]">Inbox is clear. Capture a thought, bill, or task above.</p>}
      {completed.length > 0 && (<><h3 className="mb-2 mt-5 text-xs font-semibold uppercase tracking-wider text-[var(--text-2)]">Completed · {completed.length}</h3><ul>{completed.map((t, i) => row(t, 'Reopen', () => reopenCompletedAt(i), true))}</ul></>)}
      {archive.length > 0 && (<><h3 className="mb-2 mt-5 text-xs font-semibold uppercase tracking-wider text-[var(--text-2)]">Archived · {archive.length}</h3><ul>{archive.map((t, i) => row(t, 'Restore', () => restoreAt(i), true))}</ul></>)}
    </section>
  );
}
