import type { Rule } from './rules';

export type Level = 1 | 2 | 3;
export const LEVELS: Level[] = [1, 2, 3];

export const LEVEL_INFO: Record<Level, { name: string; color: string }> = {
  1: { name: 'Easy', color: '#12cf81' },
  2: { name: 'Medium', color: '#fc712b' },
  3: { name: 'Hard', color: '#e24e67' },
};

export interface Card {
  id: string;
  level: Level;
  text: string;
  rule: Rule;
}

const atLeast = (value: number): Rule => ({ type: 'sumAtLeast', value });
const atMost = (value: number): Rule => ({ type: 'sumAtMost', value });
const exactly = (value: number): Rule => ({ type: 'sumExactly', value });
const hitAll = (targets: string[], ordered = false): Rule => ({ type: 'hitAll', targets, ordered });
const hits = (target: string, count = 1, distinct = false): Rule => ({
  type: 'countHits',
  target,
  count,
  distinct,
});
const checkout = (value: number): Rule => ({ type: 'checkout', value });
const noMiss = (rule: Rule): Rule => ({ type: 'all', rules: [rule, { type: 'noMiss' }] });

/** Starter deck. Every card is played with 3 darts. Edit freely. */
export const CARDS: Card[] = [
  // Level 1 – 1 point
  { id: 'l1-01', level: 1, text: 'Score 60 or more', rule: atLeast(60) },
  { id: 'l1-02', level: 1, text: 'Hit any double', rule: hits('D') },
  { id: 'l1-03', level: 1, text: 'Hit any treble', rule: hits('T') },
  { id: 'l1-04', level: 1, text: 'Hit 20, 19 and 18 (any order)', rule: hitAll(['20', '19', '18']) },
  { id: 'l1-05', level: 1, text: 'Score 40 or more without missing the board', rule: noMiss(atLeast(40)) },
  { id: 'l1-06', level: 1, text: 'Hit the same number twice', rule: { type: 'sameNumber', count: 2 } },
  { id: 'l1-07', level: 1, text: 'Hit three odd numbers', rule: hits('ODD', 3) },
  { id: 'l1-08', level: 1, text: 'Hit three even numbers', rule: hits('EVEN', 3) },
  { id: 'l1-09', level: 1, text: 'Hit the 20 twice', rule: hits('20', 2) },
  { id: 'l1-10', level: 1, text: 'Hit the 1 and the 5', rule: hitAll(['1', '5']) },
  { id: 'l1-11', level: 1, text: 'Hit three different numbers', rule: hits('ANY', 3, true) },
  { id: 'l1-12', level: 1, text: 'Hit the 6 and the 11', rule: hitAll(['6', '11']) },
  { id: 'l1-13', level: 1, text: 'Put all three darts in the 20, 1 or 5', rule: hits('20|1|5', 3) },
  { id: 'l1-14', level: 1, text: 'Hit the 19 twice', rule: hits('19', 2) },
  { id: 'l1-15', level: 1, text: 'Hit the 3 and the 17', rule: hitAll(['3', '17']) },
  { id: 'l1-16', level: 1, text: 'Hit the 16 and the 8', rule: hitAll(['16', '8']) },
  { id: 'l1-17', level: 1, text: 'Hit a double or a treble', rule: hits('D|T') },
  { id: 'l1-18', level: 1, text: 'Hit the 14 and the 9', rule: hitAll(['14', '9']) },
  { id: 'l1-19', level: 1, text: 'Score 45 or less without missing the board', rule: noMiss(atMost(45)) },
  { id: 'l1-20', level: 1, text: 'Hit 12, 9 and 14 (any order)', rule: hitAll(['12', '9', '14']) },

  // Level 2 – 2 points
  { id: 'l2-01', level: 2, text: 'Score 100 or more', rule: atLeast(100) },
  { id: 'l2-02', level: 2, text: 'Hit treble 20', rule: hits('T20') },
  { id: 'l2-03', level: 2, text: 'Check out 32 (finish on a double)', rule: checkout(32) },
  { id: 'l2-04', level: 2, text: 'Check out 40 (finish on a double)', rule: checkout(40) },
  { id: 'l2-05', level: 2, text: 'Hit two different doubles', rule: hits('D', 2, true) },
  { id: 'l2-06', level: 2, text: 'Hit the bull (25 or 50)', rule: hits('BULL') },
  { id: 'l2-07', level: 2, text: 'Put all three darts in the 20', rule: hits('20', 3) },
  { id: 'l2-08', level: 2, text: 'Score exactly 26', rule: exactly(26) },
  { id: 'l2-09', level: 2, text: 'Score 15 or less without missing the board', rule: noMiss(atMost(15)) },
  { id: 'l2-10', level: 2, text: 'Hit 1, 2 and 3 (any order)', rule: hitAll(['1', '2', '3']) },
  { id: 'l2-11', level: 2, text: 'Hit 20, 19 and 18 in this order', rule: hitAll(['20', '19', '18'], true) },
  { id: 'l2-12', level: 2, text: 'Hit two trebles', rule: hits('T', 2) },
  { id: 'l2-13', level: 2, text: 'Hit the same number three times', rule: { type: 'sameNumber', count: 3 } },
  { id: 'l2-14', level: 2, text: 'Check out 50 (finish on a double or bull)', rule: checkout(50) },
  { id: 'l2-15', level: 2, text: 'Score 80 or more without missing the board', rule: noMiss(atLeast(80)) },
  { id: 'l2-16', level: 2, text: 'Hit double 20', rule: hits('D20') },
  { id: 'l2-17', level: 2, text: 'Check out 24 (finish on a double)', rule: checkout(24) },
  { id: 'l2-18', level: 2, text: 'Hit a double and a treble', rule: hitAll(['D', 'T']) },
  { id: 'l2-19', level: 2, text: 'Put all three darts in the 19', rule: hits('19', 3) },
  { id: 'l2-20', level: 2, text: 'Check out 61 (finish on a double)', rule: checkout(61) },

  // Level 3 – 3 points
  { id: 'l3-01', level: 3, text: 'Hit the bullseye (50)', rule: hits('DB') },
  { id: 'l3-02', level: 3, text: 'Score 140 or more', rule: atLeast(140) },
  { id: 'l3-03', level: 3, text: 'Hit treble 20 and treble 19', rule: hitAll(['T20', 'T19']) },
  { id: 'l3-04', level: 3, text: 'Check out 81 (finish on a double)', rule: checkout(81) },
  { id: 'l3-05', level: 3, text: 'Check out 100 (finish on a double)', rule: checkout(100) },
  { id: 'l3-06', level: 3, text: 'Hit three different trebles', rule: hits('T', 3, true) },
  { id: 'l3-07', level: 3, text: 'Hit the bull twice (25 or 50)', rule: hits('BULL', 2) },
  { id: 'l3-08', level: 3, text: 'Score exactly 100', rule: exactly(100) },
  { id: 'l3-09', level: 3, text: 'Hit double 16 and double 8', rule: hitAll(['D16', 'D8']) },
  { id: 'l3-10', level: 3, text: 'Hit three doubles', rule: hits('D', 3) },
  { id: 'l3-11', level: 3, text: 'Check out 70 (finish on a double)', rule: checkout(70) },
  { id: 'l3-12', level: 3, text: 'Every dart in a double or treble', rule: hits('D|T', 3) },
  { id: 'l3-13', level: 3, text: 'Hit 1, 2 and 3 in this order', rule: hitAll(['1', '2', '3'], true) },
  { id: 'l3-14', level: 3, text: 'Score 6 or less without missing the board', rule: noMiss(atMost(6)) },
  { id: 'l3-15', level: 3, text: 'Hit treble 20 twice', rule: hits('T20', 2) },
  { id: 'l3-16', level: 3, text: 'Check out 90 (finish on a double)', rule: checkout(90) },
  { id: 'l3-17', level: 3, text: 'Score 120 or more without missing the board', rule: noMiss(atLeast(120)) },
  { id: 'l3-18', level: 3, text: 'Hit a treble, a double and the bull', rule: hitAll(['T', 'D', 'BULL']) },
  { id: 'l3-19', level: 3, text: 'Hit the outer bull (25) and the bullseye (50)', rule: hitAll(['SB', 'DB']) },
  { id: 'l3-20', level: 3, text: 'Check out 110 (finish on a double or bull)', rule: checkout(110) },
];

export const CARDS_BY_ID = new Map(CARDS.map((card) => [card.id, card]));

export function getCard(id: string): Card {
  const card = CARDS_BY_ID.get(id);
  if (!card) throw new Error(`Unknown card: ${id}`);
  return card;
}
