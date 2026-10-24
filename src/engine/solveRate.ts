import type { Dart } from './darts';
import { evaluate, type Rule } from './rules';

/**
 * Estimates how hard a card is: the chance to solve it in one turn for a player whose darts land around the aim
 * point with a Gaussian spread of `sigma` mm. Every dart is aimed as well as possible, so real players do somewhat
 * worse, but the order of the cards holds. Only used by tests.
 */

// Regulation board radii in mm
const R = { bullseye: 6.35, bull: 15.9, trebleIn: 99, trebleOut: 107, doubleIn: 162, doubleOut: 170 };
const NUMBERS = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5];

const OUTCOMES: Dart[] = [
  { number: 0, multiplier: 0 },
  ...([1, 2, 3] as const).flatMap((multiplier) => NUMBERS.map((number) => ({ number, multiplier }))),
  { number: 25, multiplier: 1 },
  { number: 25, multiplier: 2 },
];

function outcomeAt(x: number, y: number): number {
  const r = Math.hypot(x, y);
  if (r > R.doubleOut) return 0;
  if (r <= R.bullseye) return OUTCOMES.length - 1;
  if (r <= R.bull) return OUTCOMES.length - 2;
  const multiplier = r >= R.doubleIn ? 2 : r >= R.trebleIn && r <= R.trebleOut ? 3 : 1;
  const degrees = ((Math.atan2(x, y) * 180) / Math.PI + 369) % 360; // clockwise from the top, 20 centered
  return 1 + (multiplier - 1) * 20 + Math.floor(degrees / 18);
}

// The bull and the middle of every bed: inner single, treble, outer single, double
const AIMS: [number, number][] = [[0, 0]];
NUMBERS.forEach((_, i) => {
  const angle = (i * Math.PI) / 10;
  for (const r of [57, 103, 134, 166]) AIMS.push([r * Math.sin(angle), r * Math.cos(angle)]);
});

// 1 mm grid around the board
const EXTENT = 300;
let grid: { x: number; y: number; outcome: number }[] | undefined;

/** Outcome probabilities for each aim point. */
export function throwModel(sigma: number): Float64Array[] {
  grid ??= Array.from({ length: (2 * EXTENT + 1) ** 2 }, (_, i) => {
    const x = (i % (2 * EXTENT + 1)) - EXTENT;
    const y = Math.floor(i / (2 * EXTENT + 1)) - EXTENT;
    return { x, y, outcome: outcomeAt(x, y) };
  });
  const norm = 2 * Math.PI * sigma * sigma;
  return AIMS.map(([ax, ay]) => {
    const p = new Float64Array(OUTCOMES.length);
    let onGrid = 0;
    for (const { x, y, outcome } of grid!) {
      const w = Math.exp(-((x - ax) ** 2 + (y - ay) ** 2) / (2 * sigma * sigma)) / norm;
      p[outcome]! += w;
      onGrid += w;
    }
    p[0]! += Math.max(0, 1 - onGrid); // off the grid is a miss
    return p;
  });
}

/** 3-dart average when aiming every dart at treble 20. */
export function threeDartAverage(model: Float64Array[]): number {
  const t20 = model[2]!;
  return 3 * OUTCOMES.reduce((sum, d, o) => sum + t20[o]! * d.number * d.multiplier, 0);
}

/** Chance to solve `rule` in one turn, aiming every dart at the point that gives the best chance. */
export function solveRate(rule: Rule, model: Float64Array[]): number {
  const value = (darts: Dart[]): number => {
    const result = evaluate(rule, darts);
    if (result !== 'pending') return result === 'solved' ? 1 : 0;
    const next = OUTCOMES.map((d) => value([...darts, d]));
    let best = 0;
    for (const p of model) {
      let v = 0;
      for (let o = 0; o < next.length; o++) v += p[o]! * next[o]!;
      best = Math.max(best, v);
    }
    return best;
  };
  return value([]);
}
