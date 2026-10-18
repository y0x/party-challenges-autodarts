import { describe, expect, it } from 'vitest';
import { CARDS } from './cards';
import { type Dart, parseDart } from './darts';
import { evaluate, matchesTarget, type Rule } from './rules';

const darts = (...labels: string[]): Dart[] => labels.map(parseDart);
const run = (rule: Rule, labels: string[], complete = false) => evaluate(rule, darts(...labels), complete);

describe('matchesTarget', () => {
  it('matches beds, numbers and groups', () => {
    expect(matchesTarget('T20', parseDart('T20'))).toBe(true);
    expect(matchesTarget('T20', parseDart('S20'))).toBe(false);
    expect(matchesTarget('20', parseDart('D20'))).toBe(true);
    expect(matchesTarget('D', parseDart('D5'))).toBe(true);
    expect(matchesTarget('D', parseDart('BULL'))).toBe(false);
    expect(matchesTarget('BULL', parseDart('25'))).toBe(true);
    expect(matchesTarget('DB', parseDart('25'))).toBe(false);
    expect(matchesTarget('ODD', parseDart('T19'))).toBe(true);
    expect(matchesTarget('20|1|5', parseDart('S1'))).toBe(true);
    expect(matchesTarget('ANY', parseDart('MISS'))).toBe(false);
    expect(matchesTarget('MISS', parseDart('MISS'))).toBe(true);
  });
});

describe('evaluate', () => {
  it('sumAtLeast solves early and fails when out of reach', () => {
    const rule: Rule = { type: 'sumAtLeast', value: 100 };
    expect(run(rule, ['T20', 'D20'])).toBe('solved');
    expect(run(rule, ['T20'])).toBe('pending');
    expect(run(rule, ['MISS', 'MISS'])).toBe('failed');
    expect(run(rule, ['T20', 'S5'], true)).toBe('failed');
  });

  it('sumAtMost and sumExactly', () => {
    expect(run({ type: 'sumAtMost', value: 6 }, ['1', '2'])).toBe('pending');
    expect(run({ type: 'sumAtMost', value: 6 }, ['1', '2', '3'])).toBe('solved');
    expect(run({ type: 'sumAtMost', value: 6 }, ['1', '2', '4'])).toBe('failed');
    expect(run({ type: 'sumExactly', value: 26 }, ['20', '1', '5'])).toBe('solved');
    expect(run({ type: 'sumExactly', value: 26 }, ['T20'])).toBe('failed');
    expect(run({ type: 'sumExactly', value: 26 }, ['20', '6'])).toBe('solved');
    expect(run({ type: 'sumExactly', value: 26 }, ['20', '6', 'T20'])).toBe('solved');
    expect(run({ type: 'sumExactly', value: 26 }, ['20', '5'])).toBe('pending');
    expect(run({ type: 'sumExactly', value: 26 }, ['20', '5'], true)).toBe('failed');
  });

  it('hitAll unordered uses each dart once', () => {
    const rule: Rule = { type: 'hitAll', targets: ['D', 'D16'] };
    expect(run(rule, ['D16', 'D3'])).toBe('solved');
    expect(run(rule, ['D16', 'MISS'])).toBe('pending');
    expect(run(rule, ['D16', 'MISS', 'S3'])).toBe('failed');
    expect(run({ type: 'hitAll', targets: ['20', '19', '18'] }, ['18', '20', '19'])).toBe('solved');
    expect(run({ type: 'hitAll', targets: ['20', '19', '18'] }, ['MISS'])).toBe('failed');
  });

  it('hitAll ordered requires the sequence', () => {
    const rule: Rule = { type: 'hitAll', targets: ['1', '2', '3'], ordered: true };
    expect(run(rule, ['1', '2', '3'])).toBe('solved');
    expect(run(rule, ['3', '2', '1'])).toBe('failed');
    expect(run(rule, ['1', '2'])).toBe('pending');
  });

  it('countHits with distinct numbers', () => {
    expect(run({ type: 'countHits', target: 'D', count: 2, distinct: true }, ['D5', 'D5'])).toBe('pending');
    expect(run({ type: 'countHits', target: 'D', count: 2, distinct: true }, ['D5', 'D6'])).toBe('solved');
    expect(run({ type: 'countHits', target: 'T', count: 3 }, ['T1', 'S1'])).toBe('failed');
  });

  it('sameNumber ignores misses', () => {
    expect(run({ type: 'sameNumber', count: 2 }, ['S20', 'T20'])).toBe('solved');
    expect(run({ type: 'sameNumber', count: 3 }, ['S20', 'S19'])).toBe('failed');
    expect(run({ type: 'sameNumber', count: 2 }, ['MISS'])).toBe('pending');
    expect(run({ type: 'sameNumber', count: 2 }, ['MISS', 'MISS'])).toBe('failed');
  });

  it('checkout requires a double finish and busts', () => {
    const rule: Rule = { type: 'checkout', value: 40 };
    expect(run(rule, ['D20'])).toBe('solved');
    expect(run(rule, ['20', 'D10'])).toBe('solved');
    expect(run(rule, ['20', '20'])).toBe('failed');
    expect(run(rule, ['T13'])).toBe('failed'); // 1 left
    expect(run(rule, ['T20'])).toBe('failed'); // bust
    expect(run(rule, ['10'])).toBe('pending');
    expect(run({ type: 'checkout', value: 50 }, ['BULL'])).toBe('solved');
    expect(run({ type: 'checkout', value: 170 }, ['MISS'])).toBe('failed');
  });

  it('all + noMiss', () => {
    const rule: Rule = {
      type: 'all',
      rules: [{ type: 'sumAtLeast', value: 40 }, { type: 'noMiss' }],
    };
    expect(run(rule, ['T20'])).toBe('pending');
    expect(run(rule, ['T20', 'MISS'])).toBe('failed');
    expect(run(rule, ['T20', '1', '1'])).toBe('solved');
  });

  it('is never pending once complete', () => {
    const samples = [[], ['MISS'], ['T20', 'D16'], ['BULL', '25', 'S1']];
    for (const card of CARDS) {
      for (const sample of samples) {
        expect(run(card.rule, sample, true), card.id).not.toBe('pending');
      }
    }
  });
});

describe('starter deck', () => {
  it('has unique ids and 20 cards per level', () => {
    expect(new Set(CARDS.map((c) => c.id)).size).toBe(CARDS.length);
    for (const level of [1, 2, 3]) {
      expect(CARDS.filter((c) => c.level === level)).toHaveLength(20);
    }
  });
});
