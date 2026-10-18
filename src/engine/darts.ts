export type Multiplier = 0 | 1 | 2 | 3;

/** A single dart. `number` is 1–20, 25 for the bull, 0 for a miss. */
export interface Dart {
  number: number;
  multiplier: Multiplier;
}

export const DARTS_PER_TURN = 3;
export const MISS: Dart = { number: 0, multiplier: 0 };

export const isMiss = (d: Dart) => d.multiplier === 0 || d.number === 0;
export const isBull = (d: Dart) => !isMiss(d) && d.number === 25;
export const dartScore = (d: Dart) => (isMiss(d) ? 0 : d.number * d.multiplier);

export function dartLabel(d: Dart): string {
  if (isMiss(d)) return 'Miss';
  if (isBull(d)) return d.multiplier === 2 ? 'Bull' : '25';
  return `${'SDT'[d.multiplier - 1]}${d.number}`;
}

/** Parses labels like "T20", "D16", "S5", "7", "25", "BULL", "MISS". */
export function parseDart(label: string): Dart {
  const s = label.trim().toUpperCase();
  if (s === 'MISS' || s === 'M') return MISS;
  if (s === '25' || s === 'SB') return { number: 25, multiplier: 1 };
  if (s === 'BULL' || s === 'DB' || s === '50') return { number: 25, multiplier: 2 };
  const m = /^([SDT])?(\d{1,2})$/.exec(s);
  if (m) {
    const n = Number(m[2]);
    if (n >= 1 && n <= 20) {
      return { number: n, multiplier: (m[1] ? 'SDT'.indexOf(m[1]) + 1 : 1) as Multiplier };
    }
  }
  throw new Error(`Invalid dart: ${label}`);
}
