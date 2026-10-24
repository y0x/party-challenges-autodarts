import { describe, expect, it } from 'vitest';
import { CARDS, type Level } from './cards';
import { solveRate, threeDartAverage, throwModel } from './solveRate';

/** A casual player: about 38 on average when aiming at treble 20. */
const CASUAL = throwModel(35);

/** Solve chance in one turn that each level aims for. Every level is worth roughly the same points per turn. */
const BANDS: Record<Level, [number, number]> = {
  1: [0.4, 0.75],
  2: [0.18, 0.35],
  3: [0.04, 0.18],
};

describe('card balance', () => {
  it('models a casual player', () => {
    expect(threeDartAverage(CASUAL)).toBeCloseTo(38, 0);
  });

  it.each(CARDS)('$id $text.en fits its level', (card) => {
    const [min, max] = BANDS[card.level];
    const rate = solveRate(card.rule, CASUAL);
    expect(rate, `solved ${(rate * 100).toFixed(1)}%`).toBeGreaterThanOrEqual(min);
    expect(rate, `solved ${(rate * 100).toFixed(1)}%`).toBeLessThanOrEqual(max);
  });
});
