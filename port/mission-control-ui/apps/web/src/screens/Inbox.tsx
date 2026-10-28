import { useState } from 'react';
import { CaptureChips } from '../components/CaptureChips';
import { parseCap, type Person } from '../lib/capture';
import { useStore, type OpenLoop } from '../store';

const field = 'min-h-11 w-full rounded-xl border border-[var(--line)] bg-[var(--bg)] px-3 text-[var(--text)]';

export function Inbox({ people }: { people: Person[] }) {
  const { inbox, archive, completed, capture, addPerson, updateById, archiveById, restoreById, completeById, reopenCompletedById } = useStore();
  const [v, setV] = useState('');
  const [personName, setPersonName] = useState('');
  const [personFormOpen, setPersonFormOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const row = (loop: OpenLoop, label: string, onClick: () => void, dim = false) => {
    const parsed = parseCap(loop.text);
    return (
      <li key={loop.id} className={`mb-2 flex items-center justify-between gap-3 rounded-[22px] border border-[var(--line)] bg-[var(--surface-1)] p-3 ${dim ? 'opacity-70' : ''}`}>
        <div className="min-w-0 flex-1"><p className="break-words">{parsed.text || loop.text}</p><CaptureChips parsed={parsed} people={people} />
          {loop.completedAt && <p className="mt-1 text-xs text-[var(--text-3)]">Completed {new Date(loop.completedAt).getTime() === 0 ? 'before this update' : new Date(loop.completedAt).toLocaleString()}</p>}
        </div>
        <button onClick={onClick} className="min-h-10 shrink-0 rounded-[20px] bg-[var(--surface-3)] px-4 text-sm font-semibold">{label}</button>
      </li>
    );
  };
  return (
    <section>
      <h2 className="mb-3 text-xl font-semibold">Inbox</h2>
      <form onSubmit={(e) => { e.preventDefault(); capture(v); setV(''); }} className="mb-3">
        <input className={field} value={v} onChange={(e) => setV(e.target.value)} placeholder="Call @Marcus p2 *phone ^mentorship" aria-label="Capture" />
        <CaptureChips parsed={parseCap(v)} people={people} />
        <p className="mt-1.5 text-xs text-[var(--text-2)]">p1–p5 priority · *context · @person · &gt;project · ^goal · #tracker(value)</p>
      </form>
      <div className="mb-4">
        <button type="button" onClick={() => setPersonFormOpen(open => !open)} className="min-h-10 rounded-xl border border-[var(--line)] px-3 text-sm font-semibold">＋ Add person</button>
        {personFormOpen && <form className="mt-2 flex gap-2" onSubmit={(e) => { e.preventDefault(); if (!personName.trim()) return; addPerson(personName); setPersonName(''); setPersonFormOpen(false); }}>
          <input className={field} aria-label="New person name" value={personName} onChange={(e) => setPersonName(e.target.value)} placeholder="Full name" />
          <button className="min-h-11 shrink-0 rounded-xl bg-[var(--amber)] px-3 text-sm font-bold text-black" type="submit">Add</button>
        </form>}
      </div>
      {inbox.length ? <ul>{inbox.map((loop) => (
        <li key={loop.id} className="mb-2 rounded-[22px] border border-[var(--line)] bg-[var(--surface-1)] p-3">
          {editing === loop.id ? <form onSubmit={(e) => { e.preventDefault(); updateById(loop.id, editValue); setEditing(null); }} className="flex gap-2">
            <input autoFocus className={field} aria-label="Edit open loop" value={editValue} onChange={(e) => setEditValue(e.target.value)} />
            <button className="min-h-10 rounded-xl bg-[var(--amber)] px-3 text-sm font-bold text-black" type="submit">Save</button>
            <button className="min-h-10 rounded-xl px-2 text-sm" type="button" onClick={() => setEditing(null)}>Cancel</button>
          </form> : <><div className="mb-3"><p className="break-words">{parseCap(loop.text).text || loop.text}</p><CaptureChips parsed={parseCap(loop.text)} people={people} /></div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => completeById(loop.id)} className="min-h-10 rounded-xl border border-[var(--line)] px-3 text-sm font-semibold text-[var(--amber)]">Done</button>
              <button onClick={() => { setEditing(loop.id); setEditValue(loop.text); }} className="min-h-10 rounded-xl bg-[var(--surface-3)] px-3 text-sm font-semibold">Edit</button>
              <button onClick={() => archiveById(loop.id)} className="min-h-10 rounded-xl px-3 text-sm text-[var(--text-2)]">Archive</button>
            </div></>}
        </li>
      ))}</ul> : <p className="py-8 text-center text-[var(--text-2)]">Inbox is clear. Capture a thought, bill, or task above.</p>}
      {completed.length > 0 && (<><h3 className="mb-2 mt-5 text-xs font-semibold uppercase tracking-wider text-[var(--text-2)]">Completed · {completed.length}</h3><ul>{completed.map((loop) => row(loop, 'Reopen', () => reopenCompletedById(loop.id), true))}</ul></>)}
      {archive.length > 0 && (<><h3 className="mb-2 mt-5 text-xs font-semibold uppercase tracking-wider text-[var(--text-2)]">Archived · {archive.length}</h3><ul>{archive.map((loop) => row(loop, 'Restore', () => restoreById(loop.id), true))}</ul></>)}
    </section>
  );
}
