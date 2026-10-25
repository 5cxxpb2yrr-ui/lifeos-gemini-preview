import type { Rec, Variant } from '../types';
import { band } from '../lib/scoring';
import { ScoreRing } from './ScoreRing';

const ACCENT: Record<Variant, string> = {
  default: 'border-[var(--line)]',
  decision: 'border-[#3B82F666]',
  risk: 'border-[#F59E0B66] shadow-[0_0_24px_#F59E0B22]',
  opportunity: 'border-[#22C55E55]',
  relationship: 'border-[#EF444455]',
};

export function RecommendationCard({ rec, variant = 'default', label, onAction, compact = false, onExpand }: {
  rec: Rec; variant?: Variant; label?: string; onAction?: (id: string, action: string) => void;
  compact?: boolean; onExpand?: () => void;
}) {
  return (
    <article onClick={compact ? onExpand : undefined} onKeyDown={(e) => { if (compact && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onExpand?.(); } }} role={compact ? 'button' : undefined} tabIndex={compact ? 0 : undefined} className={`rounded-2xl border bg-[var(--surface-1)] p-3 transition duration-[180ms] ${compact ? 'cursor-pointer hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--amber)]' : ''} ${ACCENT[variant]}`}>
      {label && <p className="mb-1 text-[10px] font-bold tracking-wide text-[var(--text-2)]">{label}</p>}
      <p className="text-[11px] text-[var(--text-3)]">{rec.entity}</p>
      <h3 className="text-sm font-semibold leading-snug">{rec.title}</h3>
      {rec.context && <p className="mt-0.5 text-xs text-[var(--text-2)]">{rec.context}</p>}
      {!compact && <>
        {rec.recommendation && <p className="mt-2 text-sm"><span className="text-[var(--text-3)]">Recommendation · </span>{rec.recommendation}</p>}
        <div className="mt-3 flex gap-4"><ScoreRing label={`Impact · ${band(rec.impact)}`} value={rec.impact} /><ScoreRing label="Confidence" value={rec.confidence} suffix="%" color="#9fb0d0" /></div>
        {rec.outcome && <p className="mt-3 text-sm"><span className="block text-xs text-[var(--text-2)]">Expected outcome</span>{rec.outcome}</p>}
        {rec.why && <p className="mt-2 text-sm"><span className="block text-xs text-[var(--text-2)]">Why this matters</span>{rec.why}</p>}
        <div className="mt-3 flex flex-wrap gap-2">
          {rec.actions.map((a, i) => (
            <button key={a} onClick={() => onAction?.(rec.id, a)}
              className={`min-h-11 flex-1 rounded-xl px-3 text-sm font-semibold transition duration-[120ms] hover:brightness-110 ${i === 0 ? 'bg-[var(--blue)]' : 'bg-[var(--surface-3)]'}`}>{a}</button>
          ))}
        </div>
      </>}
    </article>
  );
}
