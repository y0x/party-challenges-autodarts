import { DARTS_PER_TURN, type Dart, dartScore, isBull, isMiss } from './darts';

/**
 * Targets are strings, alternatives separated by "|":
 *   ANY, MISS, BULL (25 or 50), SB (25), DB (50), S / D / T (any single/double/treble 1–20),
 *   ODD, EVEN, "20" (any bed of 20), "S20", "D20", "T20".
 */
export type Target = string;

export type Rule =
  | { type: 'sumAtLeast'; value: number }
  | { type: 'sumAtMost'; value: number }
  | { type: 'sumExactly'; value: number }
  | { type: 'hitAll'; targets: Target[]; ordered?: boolean }
  | { type: 'countHits'; target: Target; count: number; distinct?: boolean }
  | { type: 'sameNumber'; count: number }
  | { type: 'checkout'; value: number }
  | { type: 'noMiss' }
  | { type: 'all'; rules: Rule[] };

export type RuleResult = 'solved' | 'failed' | 'pending';

const MAX_DART_SCORE = 60;

export function matchesTarget(target: Target, d: Dart): boolean {
  return target.split('|').some((atom) => matchesAtom(atom.trim().toUpperCase(), d));
}

function matchesAtom(atom: string, d: Dart): boolean {
  if (atom === 'MISS') return isMiss(d);
  if (isMiss(d)) return false;
  switch (atom) {
    case 'ANY':
      return true;
    case 'BULL':
      return isBull(d);
    case 'SB':
      return isBull(d) && d.multiplier === 1;
    case 'DB':
      return isBull(d) && d.multiplier === 2;
    case 'ODD':
      return !isBull(d) && d.number % 2 === 1;
    case 'EVEN':
      return !isBull(d) && d.number % 2 === 0;
  }
  const m = /^([SDT])?(\d{1,2})?$/.exec(atom);
  if (!m || (!m[1] && !m[2])) throw new Error(`Invalid target: ${atom}`);
  if (isBull(d)) return false;
  if (m[1] && d.multiplier !== 'SDT'.indexOf(m[1]) + 1) return false;
  return !m[2] || d.number === Number(m[2]);
}

/**
 * Evaluates a rule against the darts thrown so far.
 * `complete` marks that no further darts will follow (e.g. darts pulled early);
 * once complete (or all darts are thrown) the result is never "pending".
 */
export function evaluate(rule: Rule, darts: Dart[], complete = false): RuleResult {
  const done = complete || darts.length >= DARTS_PER_TURN;
  const left = done ? 0 : DARTS_PER_TURN - darts.length;
  const sum = darts.reduce((acc, d) => acc + dartScore(d), 0);
  const byMissing = (missing: number): RuleResult => (missing <= 0 ? 'solved' : missing > left ? 'failed' : 'pending');

  switch (rule.type) {
    case 'sumAtLeast':
      if (sum >= rule.value) return 'solved';
      return sum + left * MAX_DART_SCORE < rule.value ? 'failed' : 'pending';
    case 'sumAtMost':
      if (sum > rule.value) return 'failed';
      return done ? 'solved' : 'pending';
    case 'sumExactly': {
      // Solved the moment the total is exactly right; later darts don't matter.
      let total = 0;
      for (const d of darts) {
        total += dartScore(d);
        if (total === rule.value) return 'solved';
        if (total > rule.value) return 'failed';
      }
      return done || total + left * MAX_DART_SCORE < rule.value ? 'failed' : 'pending';
    }
    case 'hitAll': {
      const hit = rule.ordered ? orderedProgress(rule.targets, darts) : maxMatching(rule.targets, darts);
      return byMissing(rule.targets.length - hit);
    }
    case 'countHits': {
      const hits = darts.filter((d) => matchesTarget(rule.target, d));
      const n = rule.distinct ? new Set(hits.map((d) => d.number)).size : hits.length;
      return byMissing(rule.count - n);
    }
    case 'sameNumber': {
      const counts = new Map<number, number>();
      for (const d of darts) if (!isMiss(d)) counts.set(d.number, (counts.get(d.number) ?? 0) + 1);
      return byMissing(rule.count - Math.max(0, ...counts.values()));
    }
    case 'checkout': {
      let rest = rule.value;
      for (const d of darts) {
        rest -= dartScore(d);
        if (rest === 0) return !isMiss(d) && d.multiplier === 2 ? 'solved' : 'failed';
        if (rest < 2) return 'failed'; // bust: below zero or 1 left
      }
      return done || rest > left * MAX_DART_SCORE ? 'failed' : 'pending';
    }
    case 'noMiss':
      if (darts.some(isMiss)) return 'failed';
      return done ? 'solved' : 'pending';
    case 'all': {
      const results = rule.rules.map((r) => evaluate(r, darts, complete));
      if (results.includes('failed')) return 'failed';
      return results.every((r) => r === 'solved') ? 'solved' : 'pending';
    }
  }
}

function orderedProgress(targets: Target[], darts: Dart[]): number {
  let next = 0;
  for (const d of darts) if (next < targets.length && matchesTarget(targets[next]!, d)) next++;
  return next;
}

/** Largest number of targets that can each be covered by a different dart. */
function maxMatching(targets: Target[], darts: Dart[]): number {
  const used = darts.map(() => false);
  const match = (i: number): number => {
    if (i === targets.length) return 0;
    let best = match(i + 1);
    darts.forEach((d, j) => {
      if (used[j] || !matchesTarget(targets[i]!, d)) return;
      used[j] = true;
      best = Math.max(best, 1 + match(i + 1));
      used[j] = false;
    });
    return best;
  };
  return match(0);
}
