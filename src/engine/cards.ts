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

/** Starter deck. Every card is played with 3 darts. src/engine/balance.test.ts keeps each card within its level. */
export const CARDS: Card[] = [
  // Level 1 – 1 point
  { id: 'l1-01', level: 1, text: { en: 'Score 45 or more', de: 'Wirf 45 oder mehr Punkte' }, rule: atLeast(45) },
  {
    id: 'l1-02',
    level: 1,
    text: { en: 'Hit two even numbers', de: 'Triff zwei gerade Zahlen' },
    rule: hits('EVEN', 2),
  },
  { id: 'l1-03', level: 1, text: { en: 'Score exactly 15', de: 'Wirf genau 15 Punkte' }, rule: exactly(15) },
  {
    id: 'l1-04',
    level: 1,
    text: { en: 'Hit the 20 and the 1', de: 'Triff die 20 und die 1' },
    rule: hitAll(['20', '1']),
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
    text: { en: 'Put all three darts in the 19, 3 or 7', de: 'Bring alle drei Darts in der 19, 3 oder 7 unter' },
    rule: hits('19|3|7', 3),
  },
  { id: 'l1-09', level: 1, text: { en: 'Score exactly 26', de: 'Wirf genau 26 Punkte' }, rule: exactly(26) },
  {
    id: 'l1-10',
    level: 1,
    text: { en: 'Hit the 13 and the 6', de: 'Triff die 13 und die 6' },
    rule: hitAll(['13', '6']),
  },
  { id: 'l1-11', level: 1, text: { en: 'Score exactly 10', de: 'Wirf genau 10 Punkte' }, rule: exactly(10) },
  {
    id: 'l1-12',
    level: 1,
    text: { en: 'Put all three darts in the 16, 8 or 11', de: 'Bring alle drei Darts in der 16, 8 oder 11 unter' },
    rule: hits('16|8|11', 3),
  },
  {
    id: 'l1-13',
    level: 1,
    text: { en: 'Put all three darts in the 20, 1 or 5', de: 'Bring alle drei Darts in der 20, 1 oder 5 unter' },
    rule: hits('20|1|5', 3),
  },
  {
    id: 'l1-14',
    level: 1,
    text: { en: 'Hit the 2 and the 15', de: 'Triff die 2 und die 15' },
    rule: hitAll(['2', '15']),
  },
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
  { id: 'l1-17', level: 1, text: { en: 'Score exactly 20', de: 'Wirf genau 20 Punkte' }, rule: exactly(20) },
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
      en: 'Score 30 or less without missing the board',
      de: 'Wirf 30 oder weniger Punkte, ohne das Board zu verfehlen',
    },
    rule: noMiss(atMost(30)),
  },
  {
    id: 'l1-20',
    level: 1,
    text: { en: 'Hit the 12 and the 5', de: 'Triff die 12 und die 5' },
    rule: hitAll(['12', '5']),
  },

  // Level 2 – 2 points
  { id: 'l2-01', level: 2, text: { en: 'Score 55 or more', de: 'Wirf 55 oder mehr Punkte' }, rule: atLeast(55) },
  { id: 'l2-02', level: 2, text: { en: 'Hit any treble', de: 'Triff ein beliebiges Triple' }, rule: hits('T') },
  { id: 'l2-03', level: 2, text: { en: 'Hit any double', de: 'Triff ein beliebiges Doppel' }, rule: hits('D') },
  { id: 'l2-04', level: 2, text: { en: 'Hit the 20 twice', de: 'Triff zweimal die 20' }, rule: hits('20', 2) },
  {
    id: 'l2-05',
    level: 2,
    text: { en: 'Hit three different odd numbers', de: 'Triff drei verschiedene ungerade Zahlen' },
    rule: hits('ODD', 3, true),
  },
  {
    id: 'l2-06',
    level: 2,
    text: { en: 'Hit the bull (25 or 50)', de: 'Triff das Bull (25 oder 50)' },
    rule: hits('BULL'),
  },
  { id: 'l2-07', level: 2, text: { en: 'Hit the 19 twice', de: 'Triff zweimal die 19' }, rule: hits('19', 2) },
  { id: 'l2-08', level: 2, text: { en: 'Score exactly 40', de: 'Wirf genau 40 Punkte' }, rule: exactly(40) },
  {
    id: 'l2-09',
    level: 2,
    text: {
      en: 'Score 20 or less without missing the board',
      de: 'Wirf 20 oder weniger Punkte, ohne das Board zu verfehlen',
    },
    rule: noMiss(atMost(20)),
  },
  { id: 'l2-10', level: 2, text: { en: 'Hit the 1 and the 5', de: 'Triff die 1 und die 5' }, rule: hitAll(['1', '5']) },
  {
    id: 'l2-11',
    level: 2,
    text: { en: 'Hit the 20 and then the 19', de: 'Triff erst die 20 und dann die 19' },
    rule: hitAll(['20', '19'], true),
  },
  {
    id: 'l2-12',
    level: 2,
    text: { en: 'Hit a double or a treble', de: 'Triff ein Doppel oder ein Triple' },
    rule: hits('D|T'),
  },
  {
    id: 'l2-13',
    level: 2,
    text: { en: 'Hit three even numbers', de: 'Triff drei gerade Zahlen' },
    rule: hits('EVEN', 3),
  },
  {
    id: 'l2-14',
    level: 2,
    text: { en: 'Hit the 6 and the 11', de: 'Triff die 6 und die 11' },
    rule: hitAll(['6', '11']),
  },
  {
    id: 'l2-15',
    level: 2,
    text: {
      en: 'Score 50 or more without missing the board',
      de: 'Wirf 50 oder mehr Punkte, ohne das Board zu verfehlen',
    },
    rule: noMiss(atLeast(50)),
  },
  {
    id: 'l2-16',
    level: 2,
    text: { en: 'Hit double 16 or double 8', de: 'Triff Doppel 16 oder Doppel 8' },
    rule: hits('D16|D8'),
  },
  {
    id: 'l2-17',
    level: 2,
    text: { en: 'Hit three different even numbers', de: 'Triff drei verschiedene gerade Zahlen' },
    rule: hits('EVEN', 3, true),
  },
  {
    id: 'l2-18',
    level: 2,
    text: { en: 'Hit a treble or the bull (25 or 50)', de: 'Triff ein Triple oder das Bull (25 oder 50)' },
    rule: hits('T|BULL'),
  },
  { id: 'l2-19', level: 2, text: { en: 'Score exactly 45', de: 'Wirf genau 45 Punkte' }, rule: exactly(45) },
  {
    id: 'l2-20',
    level: 2,
    text: { en: 'Hit the bull (25 or 50) and an odd number', de: 'Triff das Bull (25 oder 50) und eine ungerade Zahl' },
    rule: hitAll(['BULL', 'ODD']),
  },

  // Level 3 – 3 points
  { id: 'l3-01', level: 3, text: { en: 'Hit the bullseye (50)', de: 'Triff das Bullseye (50)' }, rule: hits('DB') },
  { id: 'l3-02', level: 3, text: { en: 'Score 70 or more', de: 'Wirf 70 oder mehr Punkte' }, rule: atLeast(70) },
  {
    id: 'l3-03',
    level: 3,
    text: { en: 'Hit treble 20, 19 or 18', de: 'Triff Triple 20, 19 oder 18' },
    rule: hits('T20|T19|T18'),
  },
  {
    id: 'l3-04',
    level: 3,
    text: { en: 'Check out 40 (finish on a double)', de: 'Checke 40 aus (Finish auf Doppel)' },
    rule: checkout(40),
  },
  {
    id: 'l3-05',
    level: 3,
    text: { en: 'Check out 32 (finish on a double)', de: 'Checke 32 aus (Finish auf Doppel)' },
    rule: checkout(32),
  },
  { id: 'l3-06', level: 3, text: { en: 'Hit treble 20', de: 'Triff die Triple 20' }, rule: hits('T20') },
  {
    id: 'l3-07',
    level: 3,
    text: { en: 'Hit the bull (25 or 50) and the 20', de: 'Triff das Bull (25 oder 50) und die 20' },
    rule: hitAll(['BULL', '20']),
  },
  { id: 'l3-08', level: 3, text: { en: 'Score exactly 50', de: 'Wirf genau 50 Punkte' }, rule: exactly(50) },
  { id: 'l3-09', level: 3, text: { en: 'Hit double 20', de: 'Triff die Doppel 20' }, rule: hits('D20') },
  {
    id: 'l3-10',
    level: 3,
    text: { en: 'Hit the same number three times', de: 'Triff dreimal dieselbe Zahl' },
    rule: { type: 'sameNumber', count: 3 },
  },
  {
    id: 'l3-11',
    level: 3,
    text: { en: 'Check out 24 (finish on a double)', de: 'Checke 24 aus (Finish auf Doppel)' },
    rule: checkout(24),
  },
  { id: 'l3-12', level: 3, text: { en: 'Score exactly 60', de: 'Wirf genau 60 Punkte' }, rule: exactly(60) },
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
      en: 'Score 10 or less without missing the board',
      de: 'Wirf 10 oder weniger Punkte, ohne das Board zu verfehlen',
    },
    rule: noMiss(atMost(10)),
  },
  { id: 'l3-15', level: 3, text: { en: 'Hit treble 19', de: 'Triff die Triple 19' }, rule: hits('T19') },
  {
    id: 'l3-16',
    level: 3,
    text: { en: 'Check out 36 (finish on a double)', de: 'Checke 36 aus (Finish auf Doppel)' },
    rule: checkout(36),
  },
  {
    id: 'l3-17',
    level: 3,
    text: {
      en: 'Score 60 or more without missing the board',
      de: 'Wirf 60 oder mehr Punkte, ohne das Board zu verfehlen',
    },
    rule: noMiss(atLeast(60)),
  },
  {
    id: 'l3-18',
    level: 3,
    text: { en: 'Hit 20, 1 and 18 (any order)', de: 'Triff 20, 1 und 18 (beliebige Reihenfolge)' },
    rule: hitAll(['20', '1', '18']),
  },
  {
    id: 'l3-19',
    level: 3,
    text: { en: 'Hit 12, 9 and 14 (any order)', de: 'Triff 12, 9 und 14 (beliebige Reihenfolge)' },
    rule: hitAll(['12', '9', '14']),
  },
  {
    id: 'l3-20',
    level: 3,
    text: { en: 'Check out 41 (finish on a double)', de: 'Checke 41 aus (Finish auf Doppel)' },
    rule: checkout(41),
  },
];

export const CARDS_BY_ID = new Map(CARDS.map((card) => [card.id, card]));

export function getCard(id: string): Card {
  const card = CARDS_BY_ID.get(id);
  if (!card) throw new Error(`Unknown card: ${id}`);
  return card;
}
