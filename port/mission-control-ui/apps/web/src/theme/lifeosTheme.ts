export const lifeosTheme = {
  color: {
    bg: '#0A0B0D',
    surface: ['#111318', '#151820', '#1A1F29'],
    text: { primary: '#F8FAFC', secondary: '#A1AAB8', muted: '#6B7280' },
    blue: '#3B82F6', blueHover: '#60A5FA',
    risk: '#F59E0B', opportunity: '#22C55E', critical: '#EF4444',
  },
  radius: { card: 28, button: 20 },
  motion: { fast: 120, base: 180, slow: 240 },
} as const;

/** Impact bands: 0-39 Low, 40-69 Moderate, 70-84 High, 85-100 Critical. */
export const impactColor = (v: number): string =>
  v >= 85 ? lifeosTheme.color.critical : v >= 70 ? lifeosTheme.color.risk : v >= 40 ? lifeosTheme.color.blue : lifeosTheme.color.text.muted;
