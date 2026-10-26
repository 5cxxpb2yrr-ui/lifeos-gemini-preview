import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';

type Tab = 'home' | 'paycheck' | 'plan' | 'year';
type Check = {
  kind?: 'biweekly' | 'off-cycle';
  label?: string;
  id: string; periodStart: string; periodEnd: string; payDate: string;
  gross: number; taxes: number; deductions: number; net: number;
  rate: number; week1Hours: number; week2Hours: number; doublePay: number; overtime: number;
  source: string; importedAt: string;
  reportedYtd?: { gross: number; taxes: number; deductions: number; net: number };
};
type Bill = { id: string; title: string; amount: number; dueDate: string; paid: boolean };
type FinanceData = { checks: Check[]; bills: Bill[] };
const KEY = 'lifeos.financial-command-center.v1';
const blank: FinanceData = { checks: [], bills: [] };
const money = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number.isFinite(n) ? n : 0);
const date = (s: string) => s ? new Date(s + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Not set';
const id = () => globalThis.crypto?.randomUUID?.() ?? 'row-' + Date.now() + '-' + Math.random().toString(16).slice(2);
function load(): FinanceData {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return blank;
    const value = JSON.parse(raw);
    if (Array.isArray(value.checks) && Array.isArray(value.bills)) return value as FinanceData;
  } catch { /* keep a clean empty state if browser storage is invalid */ }
  return blank;
}
function nextPayday(now = new Date()) {
  const anchor = new Date(2026, 9, 27, 12);
  const day = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12);
  if (day <= anchor) return anchor;
  const cycles = Math.ceil((day.getTime() - anchor.getTime()) / (14 * 86400000));
  return new Date(anchor.getTime() + cycles * 14 * 86400000);
}
function iso(d: Date) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
const card = 'rounded-2xl border border-[var(--line)] bg-[var(--surface-1)] p-4';
const button = 'min-h-11 rounded-xl border border-[var(--line)] px-3 text-sm font-semibold';
const field = 'min-h-11 w-full rounded-xl border border-[var(--line)] bg-[var(--bg)] px-3 text-sm text-[var(--text)]';
const label = 'mb-1 block text-xs text-[var(--text-2)]';

export function PayCommandCenter() {
  const [tab, setTab] = useState<Tab>('home');
  const [data, setData] = useState<FinanceData>(load);
  const [formOpen, setFormOpen] = useState(false);
  const [billOpen, setBillOpen] = useState(false);
  const [notice, setNotice] = useState('');
  const [draft, setDraft] = useState({ periodStart: '', periodEnd: '', payDate: '', gross: '', taxes: '', deductions: '', net: '', rate: '41.64', week1Hours: '', week2Hours: '', doublePay: '', overtime: '' });
  const [billDraft, setBillDraft] = useState({ title: '', amount: '', dueDate: '' });
  useEffect(() => { localStorage.setItem(KEY, JSON.stringify(data)); }, [data]);
  const checks = useMemo(() => [...data.checks].sort((a,b) => b.payDate.localeCompare(a.payDate)), [data.checks]);
  const latest = checks[0];
  const totals = useMemo(() => checks.reduce((a,c) => ({ gross:a.gross+c.gross, taxes:a.taxes+c.taxes, deductions:a.deductions+c.deductions, net:a.net+c.net, doublePay:a.doublePay+c.doublePay, overtime:a.overtime+c.overtime }), {gross:0,taxes:0,deductions:0,net:0,doublePay:0,overtime:0}), [checks]);
  const next = nextPayday();
  const upcoming = [...data.bills].filter(b => !b.paid).sort((a,b) => a.dueDate.localeCompare(b.dueDate));
  const upcomingTotal = upcoming.reduce((s,b) => s+b.amount,0);
  const addCheck = (e: FormEvent) => {
    e.preventDefault();
    const n = (s:string) => Number(s) || 0;
    if (!draft.payDate || !draft.periodStart || !draft.periodEnd || !draft.gross || !draft.net) { setNotice('Add pay date, period dates, gross and net to save this check.'); return; }
    const check: Check = { kind:'biweekly', id:id(), periodStart:draft.periodStart, periodEnd:draft.periodEnd, payDate:draft.payDate, gross:n(draft.gross), taxes:n(draft.taxes), deductions:n(draft.deductions), net:n(draft.net), rate:n(draft.rate), week1Hours:n(draft.week1Hours), week2Hours:n(draft.week2Hours), doublePay:n(draft.doublePay), overtime:n(draft.overtime), source:'Manual entry', importedAt:new Date().toISOString() };
    if (Math.abs(check.gross-check.taxes-check.deductions-check.net) > 0.02) setNotice('Saved, but totals do not reconcile: gross − taxes − deductions should equal net.');
    else setNotice('Paycheck saved and totals reconcile.');
    setData(d => ({...d, checks:[...d.checks.filter(c => c.payDate !== check.payDate || c.periodStart !== check.periodStart), check]}));
    setFormOpen(false);
  };
  const addBill = (e: FormEvent) => {
    e.preventDefault();
    if (!billDraft.title.trim() || !billDraft.dueDate || Number(billDraft.amount) <= 0) return;
    setData(d => ({...d, bills:[...d.bills, {id:id(), title:billDraft.title.trim(), amount:Number(billDraft.amount), dueDate:billDraft.dueDate, paid:false}]}));
    setBillDraft({title:'',amount:'',dueDate:''}); setBillOpen(false); setNotice('Bill added to your local forecast.');
  };
  const exportBackup = () => {
    const blob = new Blob([JSON.stringify({ format:'lifeos-finance-v1', exportedAt:new Date().toISOString(), ...data }, null, 2)], {type:'application/json'});
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href=url; a.download='lifeos-finance-backup.json'; a.click(); URL.revokeObjectURL(url);
    setNotice('Finance backup exported.');
  };
  const importBackup = async (file?: File) => {
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      if (!Array.isArray(parsed.checks) || !Array.isArray(parsed.bills)) throw new Error('This file is not a LifeOS finance backup.');
      const validChecks = parsed.checks.filter((c: any) => c && typeof c.id==='string' && typeof c.payDate==='string' && Number.isFinite(Number(c.gross)) && Number.isFinite(Number(c.net)));
      const validBills = parsed.bills.filter((b: any) => b && typeof b.title==='string' && Number.isFinite(Number(b.amount)) && typeof b.dueDate==='string');
      if (validChecks.length !== parsed.checks.length || validBills.length !== parsed.bills.length) throw new Error('Some rows failed validation. Nothing was imported.');
      setData({checks:parsed.checks, bills:parsed.bills});
      setNotice('Imported ' + validChecks.length + ' paychecks and ' + validBills.length + ' bills into this browser.');
    } catch (err) { setNotice(err instanceof Error ? err.message : 'Could not import file.'); }
  };
  const TabButton = ({value, children}:{value:Tab;children:ReactNode}) => <button onClick={()=>setTab(value)} className={'min-h-10 flex-1 rounded-xl px-2 text-xs font-bold ' + (tab===value?'bg-[var(--amber)] text-black':'text-[var(--text-2)]')}>{children}</button>;
  return <section className="space-y-4">
    <header className="flex items-start justify-between gap-3">
      <div><p className="text-xs font-bold uppercase tracking-[.18em] text-[var(--amber)]">LifeOS · Finance</p><h2 className="text-2xl font-bold">Pay Command Center</h2><p className="mt-1 text-xs text-[var(--text-2)]">Paycheck intelligence · cash flow · annual trends</p></div>
      <button className={button + ' text-[var(--amber)]'} onClick={exportBackup}>Export</button>
    </header>
    <nav className="flex gap-1 rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] p-1" aria-label="Financial command center tabs">
      <TabButton value="home">Home</TabButton><TabButton value="paycheck">Paycheck</TabButton><TabButton value="plan">Plan</TabButton><TabButton value="year">Year</TabButton>
    </nav>
    {notice && <div role="status" className="rounded-xl border border-[var(--line)] px-3 py-2 text-xs text-[var(--text-2)]">{notice}<button className="ml-2 text-[var(--amber)]" onClick={()=>setNotice('')}>Dismiss</button></div>}
    {tab==='home' && <>
      <div className={card + ' border-[var(--amber)]/40'}><p className="text-xs text-[var(--text-2)]">NEXT SCHEDULED PAYDAY</p><div className="mt-1 flex items-end justify-between gap-2"><strong className="text-2xl">{date(iso(next))}</strong><span className="text-xs text-[var(--text-2)]">Biweekly · Tuesday</span></div><p className="mt-2 text-xs text-[var(--text-2)]">Schedule anchor: Oct 27, 2026 from the supplied Kia payroll calendar. Verify against any updated employer calendar.</p></div>
      <div className="grid grid-cols-2 gap-3"><div className={card}><p className="text-xs text-[var(--text-2)]">LATEST NET PAY</p><p className="mt-2 text-2xl font-bold">{latest?money(latest.net):'—'}</p><p className="mt-1 text-xs text-[var(--text-2)]">{latest?date(latest.payDate):'Import or add a paycheck'}</p></div><div className={card}><p className="text-xs text-[var(--text-2)]">UNPAID BILLS</p><p className="mt-2 text-2xl font-bold">{money(upcomingTotal)}</p><p className="mt-1 text-xs text-[var(--text-2)]">{upcoming.length} due-date records</p></div></div>
      <div className={card}><div className="flex items-center justify-between"><h3 className="font-bold">Immediate attention</h3><span className="text-xs text-[var(--text-2)]">{checks.length} checks</span></div>
        {checks.length===0?<p className="mt-3 text-sm text-[var(--text-2)]">No paychecks loaded yet. Add a check or import a LifeOS finance JSON backup. Paystub PDFs are not uploaded to the server by this screen.</p>:<div className="mt-3 space-y-3">{checks.slice(0,3).map(c=><div key={c.id} className="flex items-center justify-between gap-3 border-t border-[var(--line)] pt-3"><div><p className="font-semibold">{money(c.net)} net</p><p className="text-xs text-[var(--text-2)]">{c.kind==='off-cycle'?(c.label||'Off-cycle payment'):date(c.periodStart)+' – '+date(c.periodEnd)}</p></div><div className="text-right"><p className="text-sm">{date(c.payDate)}</p><p className={'text-xs '+(Math.abs(c.gross-c.taxes-c.deductions-c.net)>.02?'text-[var(--critical)]':'text-[var(--gold)]')}>{Math.abs(c.gross-c.taxes-c.deductions-c.net)>.02?'Reconcile totals':'Totals reconcile'}</p></div></div>)}</div>}
      </div>
      <div className={card}><h3 className="font-bold">Data safety</h3><p className="mt-1 text-xs text-[var(--text-2)]">Paychecks and bills are stored in this browser's local storage. They are not synced to the LifeOS graph. Export a backup before clearing browser data or changing devices.</p><label className="mt-3 block"><span className={label}>Import LifeOS finance backup (.json)</span><input className={field} type="file" accept=".json,application/json" onChange={e=>void importBackup(e.target.files?.[0])}/></label></div>
    </>}
    {tab==='paycheck' && <>
      <div className="flex gap-2"><button className={button+' flex-1 text-[var(--amber)]'} onClick={()=>setFormOpen(v=>!v)}>{formOpen?'Cancel':'＋ Add paycheck'}</button><label className={button+' flex-1 flex items-center justify-center'}>Import JSON<input className="sr-only" type="file" accept=".json,application/json" onChange={e=>void importBackup(e.target.files?.[0])}/></label></div>
      {formOpen && <form onSubmit={addCheck} className={card+' space-y-3'}><h3 className="font-bold">New paycheck record</h3><p className="text-xs text-[var(--text-2)]">Enter the two weekly regular-time lines separately. Amounts are in dollars; don't enter identifying information from the stub.</p><div className="grid grid-cols-2 gap-3">{([['periodStart','Period starts','date'],['periodEnd','Period ends','date'],['payDate','Pay date','date'],['gross','Gross pay','number'],['taxes','Taxes','number'],['deductions','Deductions','number'],['net','Net pay','number'],['rate','Base hourly rate','number'],['week1Hours','Week 1 regular hours','number'],['week2Hours','Week 2 regular hours','number'],['doublePay','Double-pay amount','number'],['overtime','Overtime amount','number']] as [keyof typeof draft,string,string][]).map(([k,l,t])=><label key={k}><span className={label}>{l}</span><input required={['periodStart','periodEnd','payDate','gross','net'].includes(k)} className={field} type={t} step={t==='number'?'0.01':undefined} value={draft[k]} onChange={e=>setDraft(d=>({...d,[k]:e.target.value}))}/></label>)}</div><button className="min-h-11 w-full rounded-xl bg-[var(--amber)] font-bold text-black" type="submit">Save paycheck</button></form>}
      {checks.length===0?<div className={card}><p className="font-semibold">No paychecks recorded</p><p className="mt-1 text-sm text-[var(--text-2)]">Add a paycheck or import a JSON backup. A PDF importer is planned separately so extracted numbers can be reviewed before saving.</p></div>:checks.map(c=><article key={c.id} className={card}><div className="flex items-start justify-between gap-2"><div><h3 className="font-bold">{money(c.net)} net</h3><p className="text-xs text-[var(--text-2)]">{c.kind==='off-cycle'?(c.label||'Off-cycle payment'):date(c.periodStart)+' – '+date(c.periodEnd)} · paid {date(c.payDate)}</p></div><button className="text-xs text-[var(--critical)]" onClick={()=>{if(confirm('Delete this paycheck record?'))setData(d=>({...d,checks:d.checks.filter(x=>x.id!==c.id)}))}}>Delete</button></div><div className="mt-3 grid grid-cols-2 gap-2 text-sm"><p>Gross <b>{money(c.gross)}</b></p><p>Taxes <b>{money(c.taxes)}</b></p><p>Deductions <b>{money(c.deductions)}</b></p><p>Double pay <b>{money(c.doublePay)}</b></p><p>Overtime <b>{money(c.overtime)}</b></p><p>Week 1 / 2 <b>{c.week1Hours}h / {c.week2Hours}h</b></p></div><p className={'mt-2 text-xs '+(Math.abs(c.gross-c.taxes-c.deductions-c.net)>.02?'text-[var(--critical)]':'text-[var(--gold)]')}>{Math.abs(c.gross-c.taxes-c.deductions-c.net)>.02?'Needs reconciliation':'Gross − taxes − deductions = net'}</p></article>)}
    </>}
    {tab==='plan' && <>
      <div className="flex items-center justify-between"><div><h3 className="font-bold">Bills & obligations</h3><p className="text-xs text-[var(--text-2)]">Actual due dates, not day-of-month guesses.</p></div><button className={button+' text-[var(--amber)]'} onClick={()=>setBillOpen(v=>!v)}>{billOpen?'Cancel':'＋ Add bill'}</button></div>
      {billOpen && <form className={card+' space-y-3'} onSubmit={addBill}><label><span className={label}>Bill name</span><input className={field} value={billDraft.title} onChange={e=>setBillDraft(d=>({...d,title:e.target.value}))} required/></label><div className="grid grid-cols-2 gap-3"><label><span className={label}>Amount</span><input className={field} type="number" min="0.01" step="0.01" value={billDraft.amount} onChange={e=>setBillDraft(d=>({...d,amount:e.target.value}))} required/></label><label><span className={label}>Due date</span><input className={field} type="date" value={billDraft.dueDate} onChange={e=>setBillDraft(d=>({...d,dueDate:e.target.value}))} required/></label></div><button className="min-h-11 w-full rounded-xl bg-[var(--amber)] font-bold text-black">Save bill</button></form>}
      <div className={card}><div className="flex justify-between"><span className="text-sm text-[var(--text-2)]">Unpaid total</span><b>{money(upcomingTotal)}</b></div><div className="mt-3 space-y-2">{upcoming.length===0?<p className="text-sm text-[var(--text-2)]">No unpaid bills recorded.</p>:upcoming.map(b=><div key={b.id} className="flex items-center gap-2 border-t border-[var(--line)] pt-2"><label className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{b.title}</span><span className="text-xs text-[var(--text-2)]">Due {date(b.dueDate)}</span></label><b className="text-sm">{money(b.amount)}</b><button className="text-xs text-[var(--gold)]" onClick={()=>setData(d=>({...d,bills:d.bills.map(x=>x.id===b.id?{...x,paid:!x.paid}:x)}))}>{b.paid?'Unpay':'Mark paid'}</button><button aria-label={'Delete '+b.title} className="text-xs text-[var(--critical)]" onClick={()=>setData(d=>({...d,bills:d.bills.filter(x=>x.id!==b.id)}))}>×</button></div>)}</div></div>
      <div className={card}><h3 className="font-bold">Paycheck coverage</h3><p className="mt-1 text-xs text-[var(--text-2)]">Bills are listed by real due date. This initial preview does not assume an opening bank balance or promise a closing cash balance; connect those inputs only after records are validated.</p></div>
    </>}
    {tab==='year' && <>
      <div className="grid grid-cols-2 gap-3">{([['YTD gross',totals.gross],['YTD net',totals.net],['Taxes recorded',totals.taxes],['Deductions recorded',totals.deductions],['Double pay',totals.doublePay],['Overtime',totals.overtime]] as [string,number][]).map(([l,v])=><div className={card} key={l}><p className="text-xs text-[var(--text-2)]">{l.toUpperCase()}</p><p className="mt-2 text-xl font-bold">{money(v)}</p></div>)}</div>
      <div className={card}><h3 className="font-bold">History coverage</h3><p className="mt-1 text-sm text-[var(--text-2)]">{checks.length} paycheck records · sums shown are only the records imported here, not employer YTD totals.</p>{checks.length>0&&<div className="mt-3 space-y-2">{checks.map(c=><div key={c.id} className="flex justify-between gap-2 border-t border-[var(--line)] pt-2 text-sm"><span>{date(c.payDate)}</span><span>{money(c.gross)} gross</span><b>{money(c.net)}</b></div>)}</div>}</div>
      {latest?.reportedYtd && <div className={card}><h3 className="font-bold">Latest employer-reported YTD</h3><p className="mt-1 text-xs text-[var(--text-2)]">Reported on the latest imported paystub dated {date(latest.payDate)}. This is kept separate from calculated sums.</p><div className="mt-3 grid grid-cols-2 gap-3 text-sm"><p>Gross <b>{money(latest.reportedYtd.gross)}</b></p><p>Net <b>{money(latest.reportedYtd.net)}</b></p><p>Taxes <b>{money(latest.reportedYtd.taxes)}</b></p><p>Deductions <b>{money(latest.reportedYtd.deductions)}</b></p></div><p className="mt-3 text-xs text-[var(--text-2)]">Imported-check sum vs reported YTD — gross {money(totals.gross-latest.reportedYtd.gross)}, net {money(totals.net-latest.reportedYtd.net)}. Any difference needs investigation before forecasting.</p></div>}
      <div className={card}><h3 className="font-bold">Year-end projection</h3><p className="mt-1 text-xs text-[var(--text-2)]">Projection stays unavailable until enough dated paycheck records exist. This prevents a single check or stale hardcoded number from being presented as a forecast.</p>{checks.length>=3&&<p className="mt-2 text-sm">Average recorded net per check: <b>{money(totals.net/checks.length)}</b>. This is a historical average, not a guaranteed future deposit.</p>}</div>
    </>}
  </section>;
}
