import type { ReactNode } from 'react';

/** Mission Control recommendation sections stack vertically for clear, mobile-first scanning. */
export function Section({ children, full = false }: { children: ReactNode; full?: boolean }) {
  return <div className="mb-3 grid grid-cols-1 gap-3">{children}</div>;
}
