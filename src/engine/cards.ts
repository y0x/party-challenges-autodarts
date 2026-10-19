import type { Locale } from '../i18n';
import type { Rule } from './rules';

export type Level = 1 | 2 | 3;
export const LEVELS: Level[] = [1, 2, 3];

export const LEVEL_COLORS: Record<Level, string> = {
  1: '#12cf81',
  2: '#fc712b',
  3: '#e24e67',
};

export interface Card {
  id: string;
  level: Level;
  text: Record<Locale, string>;
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
  { id: 'l1-01', level: 1, text: { en: 'Score 60 or more', de: 'Wirf 60 oder mehr Punkte' }, rule: atLeast(60) },
  { id: 'l1-02', level: 1, text: { en: 'Hit any double', de: 'Triff ein beliebiges Doppel' }, rule: hits('D') },
  { id: 'l1-03', level: 1, text: { en: 'Hit any treble', de: 'Triff ein beliebiges Triple' }, rule: hits('T') },
  {
    id: 'l1-04',
    level: 1,
    text: { en: 'Hit 20, 19 and 18 (any order)', de: 'Triff 20, 19 und 18 (beliebige Reihenfolge)' },
    rule: hitAll(['20', '19', '18']),
  },
  {
    id: 'l1-05',
    level: 1,
    text: {
      en: 'Score 40 or more without missing the board',
      de: 'Wirf 40 oder mehr Punkte, ohne das Board zu verfehlen',
    },
    rule: noMiss(atLeast(40)),
  },
  {
    id: 'l1-06',
    level: 1,
    text: { en: 'Hit the same number twice', de: 'Triff zweimal dieselbe Zahl' },
    rule: { type: 'sameNumber', count: 2 },
  },
  {
    id: 'l1-07',
    level: 1,
    text: { en: 'Hit three odd numbers', de: 'Triff drei ungerade Zahlen' },
    rule: hits('ODD', 3),
  },
  {
    id: 'l1-08',
    level: 1,
    text: { en: 'Hit three even numbers', de: 'Triff drei gerade Zahlen' },
    rule: hits('EVEN', 3),
  },
  { id: 'l1-09', level: 1, text: { en: 'Hit the 20 twice', de: 'Triff zweimal die 20' }, rule: hits('20', 2) },
  { id: 'l1-10', level: 1, text: { en: 'Hit the 1 and the 5', de: 'Triff die 1 und die 5' }, rule: hitAll(['1', '5']) },
  {
    id: 'l1-11',
    level: 1,
    text: { en: 'Hit three different numbers', de: 'Triff drei verschiedene Zahlen' },
    rule: hits('ANY', 3, true),
  },
  {
    id: 'l1-12',
    level: 1,
    text: { en: 'Hit the 6 and the 11', de: 'Triff die 6 und die 11' },
    rule: hitAll(['6', '11']),
  },
  {
    id: 'l1-13',
    level: 1,
    text: { en: 'Put all three darts in the 20, 1 or 5', de: 'Bring alle drei Darts in der 20, 1 oder 5 unter' },
    rule: hits('20|1|5', 3),
  },
  { id: 'l1-14', level: 1, text: { en: 'Hit the 19 twice', de: 'Triff zweimal die 19' }, rule: hits('19', 2) },
  {
    id: 'l1-15',
    level: 1,
    text: { en: 'Hit the 3 and the 17', de: 'Triff die 3 und die 17' },
    rule: hitAll(['3', '17']),
  },
  {
    id: 'l1-16',
    level: 1,
    text: { en: 'Hit the 16 and the 8', de: 'Triff die 16 und die 8' },
    rule: hitAll(['16', '8']),
  },
  {
    id: 'l1-17',
    level: 1,
    text: { en: 'Hit a double or a treble', de: 'Triff ein Doppel oder ein Triple' },
    rule: hits('D|T'),
  },
  {
    id: 'l1-18',
    level: 1,
    text: { en: 'Hit the 14 and the 9', de: 'Triff die 14 und die 9' },
    rule: hitAll(['14', '9']),
  },
  {
    id: 'l1-19',
    level: 1,
    text: {
      en: 'Score 45 or less without missing the board',
      de: 'Wirf 45 oder weniger Punkte, ohne das Board zu verfehlen',
    },
    rule: noMiss(atMost(45)),
  },
  {
    id: 'l1-20',
    level: 1,
    text: { en: 'Hit 12, 9 and 14 (any order)', de: 'Triff 12, 9 und 14 (beliebige Reihenfolge)' },
    rule: hitAll(['12', '9', '14']),
  },

  // Level 2 – 2 points
  { id: 'l2-01', level: 2, text: { en: 'Score 100 or more', de: 'Wirf 100 oder mehr Punkte' }, rule: atLeast(100) },
  { id: 'l2-02', level: 2, text: { en: 'Hit treble 20', de: 'Triff die Triple 20' }, rule: hits('T20') },
  {
    id: 'l2-03',
    level: 2,
    text: { en: 'Check out 32 (finish on a double)', de: 'Checke 32 aus (Finish auf Doppel)' },
    rule: checkout(32),
  },
  {
    id: 'l2-04',
    level: 2,
    text: { en: 'Check out 40 (finish on a double)', de: 'Checke 40 aus (Finish auf Doppel)' },
    rule: checkout(40),
  },
  {
    id: 'l2-05',
    level: 2,
    text: { en: 'Hit two different doubles', de: 'Triff zwei verschiedene Doppel' },
    rule: hits('D', 2, true),
  },
  {
    id: 'l2-06',
    level: 2,
    text: { en: 'Hit the bull (25 or 50)', de: 'Triff das Bull (25 oder 50)' },
    rule: hits('BULL'),
  },
  {
    id: 'l2-07',
    level: 2,
    text: { en: 'Put all three darts in the 20', de: 'Bring alle drei Darts in der 20 unter' },
    rule: hits('20', 3),
  },
  { id: 'l2-08', level: 2, text: { en: 'Score exactly 26', de: 'Wirf genau 26 Punkte' }, rule: exactly(26) },
  {
    id: 'l2-09',
    level: 2,
    text: {
      en: 'Score 15 or less without missing the board',
      de: 'Wirf 15 oder weniger Punkte, ohne das Board zu verfehlen',
    },
    rule: noMiss(atMost(15)),
  },
  {
    id: 'l2-10',
    level: 2,
    text: { en: 'Hit 1, 2 and 3 (any order)', de: 'Triff 1, 2 und 3 (beliebige Reihenfolge)' },
    rule: hitAll(['1', '2', '3']),
  },
  {
    id: 'l2-11',
    level: 2,
    text: { en: 'Hit 20, 19 and 18 in this order', de: 'Triff 20, 19 und 18 in dieser Reihenfolge' },
    rule: hitAll(['20', '19', '18'], true),
  },
  { id: 'l2-12', level: 2, text: { en: 'Hit two trebles', de: 'Triff zwei Triples' }, rule: hits('T', 2) },
  {
    id: 'l2-13',
    level: 2,
    text: { en: 'Hit the same number three times', de: 'Triff dreimal dieselbe Zahl' },
    rule: { type: 'sameNumber', count: 3 },
  },
  {
    id: 'l2-14',
    level: 2,
    text: { en: 'Check out 50 (finish on a double or bull)', de: 'Checke 50 aus (Finish auf Doppel oder Bull)' },
    rule: checkout(50),
  },
  {
    id: 'l2-15',
    level: 2,
    text: {
      en: 'Score 80 or more without missing the board',
      de: 'Wirf 80 oder mehr Punkte, ohne das Board zu verfehlen',
    },
    rule: noMiss(atLeast(80)),
  },
  { id: 'l2-16', level: 2, text: { en: 'Hit double 20', de: 'Triff die Doppel 20' }, rule: hits('D20') },
  {
    id: 'l2-17',
    level: 2,
    text: { en: 'Check out 24 (finish on a double)', de: 'Checke 24 aus (Finish auf Doppel)' },
    rule: checkout(24),
  },
  {
    id: 'l2-18',
    level: 2,
    text: { en: 'Hit a double and a treble', de: 'Triff ein Doppel und ein Triple' },
    rule: hitAll(['D', 'T']),
  },
  {
    id: 'l2-19',
    level: 2,
    text: { en: 'Put all three darts in the 19', de: 'Bring alle drei Darts in der 19 unter' },
    rule: hits('19', 3),
  },
  {
    id: 'l2-20',
    level: 2,
    text: { en: 'Check out 61 (finish on a double)', de: 'Checke 61 aus (Finish auf Doppel)' },
    rule: checkout(61),
  },

  // Level 3 – 3 points
  { id: 'l3-01', level: 3, text: { en: 'Hit the bullseye (50)', de: 'Triff das Bullseye (50)' }, rule: hits('DB') },
  { id: 'l3-02', level: 3, text: { en: 'Score 140 or more', de: 'Wirf 140 oder mehr Punkte' }, rule: atLeast(140) },
  {
    id: 'l3-03',
    level: 3,
    text: { en: 'Hit treble 20 and treble 19', de: 'Triff Triple 20 und Triple 19' },
    rule: hitAll(['T20', 'T19']),
  },
  {
    id: 'l3-04',
    level: 3,
    text: { en: 'Check out 81 (finish on a double)', de: 'Checke 81 aus (Finish auf Doppel)' },
    rule: checkout(81),
  },
  {
    id: 'l3-05',
    level: 3,
    text: { en: 'Check out 100 (finish on a double)', de: 'Checke 100 aus (Finish auf Doppel)' },
    rule: checkout(100),
  },
  {
    id: 'l3-06',
    level: 3,
    text: { en: 'Hit three different trebles', de: 'Triff drei verschiedene Triples' },
    rule: hits('T', 3, true),
  },
  {
    id: 'l3-07',
    level: 3,
    text: { en: 'Hit the bull twice (25 or 50)', de: 'Triff zweimal das Bull (25 oder 50)' },
    rule: hits('BULL', 2),
  },
  { id: 'l3-08', level: 3, text: { en: 'Score exactly 100', de: 'Wirf genau 100 Punkte' }, rule: exactly(100) },
  {
    id: 'l3-09',
    level: 3,
    text: { en: 'Hit double 16 and double 8', de: 'Triff Doppel 16 und Doppel 8' },
    rule: hitAll(['D16', 'D8']),
  },
  { id: 'l3-10', level: 3, text: { en: 'Hit three doubles', de: 'Triff drei Doppel' }, rule: hits('D', 3) },
  {
    id: 'l3-11',
    level: 3,
    text: { en: 'Check out 70 (finish on a double)', de: 'Checke 70 aus (Finish auf Doppel)' },
    rule: checkout(70),
  },
  {
    id: 'l3-12',
    level: 3,
    text: { en: 'Every dart in a double or treble', de: 'Jeder Dart in einem Doppel oder Triple' },
    rule: hits('D|T', 3),
  },
  {
    id: 'l3-13',
    level: 3,
    text: { en: 'Hit 1, 2 and 3 in this order', de: 'Triff 1, 2 und 3 in dieser Reihenfolge' },
    rule: hitAll(['1', '2', '3'], true),
  },
  {
    id: 'l3-14',
    level: 3,
    text: {
      en: 'Score 6 or less without missing the board',
      de: 'Wirf 6 oder weniger Punkte, ohne das Board zu verfehlen',
    },
    rule: noMiss(atMost(6)),
  },
  {
    id: 'l3-15',
    level: 3,
    text: { en: 'Hit treble 20 twice', de: 'Triff zweimal die Triple 20' },
    rule: hits('T20', 2),
  },
  {
    id: 'l3-16',
    level: 3,
    text: { en: 'Check out 90 (finish on a double)', de: 'Checke 90 aus (Finish auf Doppel)' },
    rule: checkout(90),
  },
  {
    id: 'l3-17',
    level: 3,
    text: {
      en: 'Score 120 or more without missing the board',
      de: 'Wirf 120 oder mehr Punkte, ohne das Board zu verfehlen',
    },
    rule: noMiss(atLeast(120)),
  },
  {
    id: 'l3-18',
    level: 3,
    text: { en: 'Hit a treble, a double and the bull', de: 'Triff ein Triple, ein Doppel und das Bull' },
    rule: hitAll(['T', 'D', 'BULL']),
  },
  {
    id: 'l3-19',
    level: 3,
    text: {
      en: 'Hit the outer bull (25) and the bullseye (50)',
      de: 'Triff das Single Bull (25) und das Bullseye (50)',
    },
    rule: hitAll(['SB', 'DB']),
  },
  {
    id: 'l3-20',
    level: 3,
    text: { en: 'Check out 110 (finish on a double or bull)', de: 'Checke 110 aus (Finish auf Doppel oder Bull)' },
    rule: checkout(110),
  },
];

export const CARDS_BY_ID = new Map(CARDS.map((card) => [card.id, card]));

export function getCard(id: string): Card {
  const card = CARDS_BY_ID.get(id);
  if (!card) throw new Error(`Unknown card: ${id}`);
  return card;
}
