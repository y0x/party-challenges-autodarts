import { describe, expect, it } from 'vitest';
import { type BettingRules, betChips, betLimits, canCall, DEFAULT_BETTING_RULES, minBet } from './betting';
import { getCard } from './cards';
import { parseDart } from './darts';
import {
  applyAction,
  createSession,
  DEFAULT_GAME_SETTINGS,
  type GameAction,
  type GameState,
  type MatchSnapshot,
  type Session,
  upgradeSession,
} from './game';

const PLAYERS = [
  { id: 'a', name: 'Ann' },
  { id: 'b', name: 'Ben' },
  { id: 'c', name: 'Cy' },
];

/** `turn(n, ...darts)` is turn number n (player n % players), in round n / players + 1. */
function turn(n: number, ...labels: string[]): MatchSnapshot {
  return {
    id: 'm1',
    leg: '0.0',
    finished: false,
    players: PLAYERS,
    turn: { id: `t${n}`, playerId: PLAYERS[n % PLAYERS.length]!.id, darts: labels.map(parseDart) },
  };
}

/** A betting session whose decks start with the given cards. */
function betting(cardIds: string[], rules: Partial<BettingRules> = {}): Session {
  const settings = {
    ...DEFAULT_GAME_SETTINGS,
    mode: 'betting' as const,
    betting: { ...DEFAULT_BETTING_RULES, goldenCards: false, ...rules },
  };
  const s = createSession(turn(0), settings);
  const decks = { ...s.game.decks };
  for (const id of [...cardIds].reverse()) {
    const level = getCard(id).level;
    decks[level] = [id, ...decks[level].filter((c) => c !== id)];
  }
  return { ...s, game: { ...s.game, decks } };
}

const run = (s: Session, ...actions: GameAction[]) => actions.reduce(applyAction, s);
const match = (snapshot: MatchSnapshot): GameAction => ({ type: 'match', match: snapshot });
const bet = (amount: number): GameAction => ({ type: 'placeBet', amount });
const coins = (g: GameState) => g.players.map((p) => p.score);
const withGame = (s: Session, game: Partial<GameState>): Session => ({ ...s, game: { ...s.game, ...game } });

describe('betting mode', () => {
  it('shows the card first, then takes the bet', () => {
    const s = run(betting(['l2-03']), { type: 'pickLevel', level: 2 });
    expect(s.game.phase).toBe('bet');
    expect(s.game.card?.id).toBe('l2-03');
    expect(coins(s.game)).toEqual([100, 100, 100]);
    const placed = run(s, bet(25));
    expect(placed.game.phase).toBe('attempt');
    expect(coins(placed.game)).toEqual([75, 100, 100]);
  });

  it('pays the bet times the level on a solve', () => {
    let s = run(betting(['l2-03']), { type: 'pickLevel', level: 2 }, bet(25), match(turn(0, 'D7')));
    expect(s.game.outcome).toBe('solved');
    expect(coins(s.game)).toEqual([150, 100, 100]);
    s = run(s, match(turn(1)));
    expect(s.game.phase).toBe('pickLevel');
    expect(coins(s.game)).toEqual([150, 100, 100]);
  });

  it('puts a lost bet into the pot, which the next solver wins', () => {
    let s = run(betting(['l2-03']), { type: 'pickLevel', level: 2 }, bet(10), match(turn(0, 'S1', 'S1', 'S1')));
    s = run(s, match(turn(1)));
    expect(coins(s.game)).toEqual([90, 100, 100]);
    expect(s.game.pot).toBe(10);
    expect(s.game.phase).toBe('bet');
    expect(s.game.card?.id).toBe('l2-03');
    s = run(s, bet(10), match(turn(1, 'D5')), match(turn(2)));
    expect(coins(s.game)).toEqual([90, 130, 100]);
    expect(s.game.pot).toBe(0);
  });

  it('caps the bet at half the coins, all of them in the final round', () => {
    const s = run(betting(['l2-03']), { type: 'pickLevel', level: 2 });
    expect(betLimits(s.game)).toEqual({ min: 10, max: 50 });
    expect(betChips(s.game)).toEqual([10, 25, 50]);
    expect(run(s, bet(100)).game.bet).toBe(50);
    expect(run(s, bet(1)).game.bet).toBe(10);
    const final = withGame(s, { round: 20, maxRounds: 20 });
    expect(betLimits(final.game).max).toBe(100);
  });

  it('raises the minimum bet every 10 rounds', () => {
    const s = betting([]);
    expect(minBet({ ...s.game, round: 10 })).toBe(10);
    expect(minBet({ ...s.game, round: 11 })).toBe(15);
    expect(minBet({ ...s.game, round: 25 })).toBe(20);
  });

  it("doesn't count darts thrown before the bet", () => {
    let s = run(betting(['l2-03']), { type: 'pickLevel', level: 2 }, match(turn(0, 'D1')));
    expect(s.game.outcome).toBeNull();
    s = run(s, bet(10), match(turn(0, 'D1', 'S5')));
    expect(s.game.darts).toEqual([parseDart('S5')]);
  });

  it('takes the minimum bet from a player who ends the turn without betting', () => {
    let s = run(betting(['l2-03']), { type: 'pickLevel', level: 2 }, match(turn(0, 'D1', 'D2', 'D3')));
    s = run(s, match(turn(1)));
    expect(coins(s.game)).toEqual([90, 100, 100]);
    expect(s.game.pot).toBe(10);
    expect(s.game.history.at(-1)).toEqual({ playerId: 'a', cardId: 'l2-03', outcome: 'failed' });
  });

  it('lets a bet be taken back before the first dart', () => {
    const s = run(betting(['l2-03']), { type: 'pickLevel', level: 2 }, bet(50), { type: 'cancelBet' });
    expect(s.game.phase).toBe('bet');
    expect(coins(s.game)).toEqual([100, 100, 100]);
    const thrown = run(s, bet(10), match(turn(0, 'S1')), { type: 'cancelBet' });
    expect(thrown.game.bet).toBe(10);
  });

  it('skipping costs the bet, or the minimum bet before betting', () => {
    let s = run(betting(['l2-03', 'l2-01']), { type: 'pickLevel', level: 2 }, { type: 'skipCard' });
    expect(s.game.phase).toBe('pickLevel');
    expect(coins(s.game)).toEqual([90, 100, 100]);
    expect(s.game.pot).toBe(10);
    s = run(s, { type: 'pickLevel', level: 2 }, bet(30), { type: 'skipCard' });
    expect(coins(s.game)).toEqual([60, 100, 100]);
    expect(s.game.pot).toBe(40);
  });

  describe('doubters', () => {
    const doubted = () =>
      run(betting(['l2-03']), { type: 'pickLevel', level: 2 }, bet(20), { type: 'toggleDoubt', playerId: 'b' });

    it('win their stake when the thrower fails', () => {
      const s = doubted();
      expect(coins(s.game)).toEqual([80, 80, 100]);
      const failed = run(s, match(turn(0, 'S1', 'S1', 'S1')));
      expect(coins(failed.game)).toEqual([80, 120, 100]);
      expect(failed.game.pot).toBe(20);
    });

    it('pay the thrower when the card is solved', () => {
      const s = run(doubted(), match(turn(0, 'D1')));
      expect(coins(s.game)).toEqual([160, 80, 100]);
    });

    it('can only doubt before the first dart, and not themselves', () => {
      const s = run(doubted(), match(turn(0, 'S1')), { type: 'toggleDoubt', playerId: 'c' });
      expect(s.game.doubters).toEqual(['b']);
      const self = run(doubted(), { type: 'toggleDoubt', playerId: 'a' });
      expect(self.game.doubters).toEqual(['b']);
    });

    it('bet at most what they have', () => {
      let s = run(betting(['l2-03']), { type: 'pickLevel', level: 2 }, bet(20));
      s = withGame(s, { players: s.game.players.map((p) => (p.id === 'b' ? { ...p, score: 5 } : p)) });
      s = run(s, { type: 'toggleDoubt', playerId: 'b' }, match(turn(0, 'S1', 'S1', 'S1')));
      expect(coins(s.game)).toEqual([80, 10, 100]);
    });
  });

  describe('calling the shot', () => {
    it('adds to the multiplier and only counts the first two darts', () => {
      let s = run(betting(['l2-03']), { type: 'pickLevel', level: 2 }, { type: 'toggleCall', call: 'twoDarts' });
      s = run(s, bet(10), match(turn(0, 'S1', 'D5')));
      expect(coins(s.game)).toEqual([130, 100, 100]);
      const late = run(betting(['l2-03']), { type: 'pickLevel', level: 2 }, { type: 'toggleCall', call: 'twoDarts' });
      expect(run(late, bet(10), match(turn(0, 'S1', 'S1', 'D5'))).game.outcome).toBe('failed');
    });

    it('fails on a miss when no misses were called', () => {
      let s = run(betting(['l2-03']), { type: 'pickLevel', level: 2 }, { type: 'toggleCall', call: 'noMiss' });
      s = run(s, bet(10), match(turn(0, 'MISS', 'D5')));
      expect(s.game.outcome).toBe('failed');
    });

    it("can't be called when the card can't be solved that way", () => {
      const three = run(betting(['l1-07']), { type: 'pickLevel', level: 1 }); // Hit three odd numbers
      expect(canCall(three.game, 'twoDarts')).toBe(false);
      // a miss already fails the card
      expect(canCall(three.game, 'noMiss')).toBe(false);
      const two = run(betting(['l1-04']), { type: 'pickLevel', level: 1 }); // Hit the 20 and the 1
      expect(canCall(two.game, 'twoDarts')).toBe(true);
      expect(canCall(two.game, 'noMiss')).toBe(true);
      const noMiss = run(betting(['l1-05']), { type: 'pickLevel', level: 1 }); // 40+ without missing
      expect(canCall(noMiss.game, 'noMiss')).toBe(false);
      expect(canCall(noMiss.game, 'twoDarts')).toBe(true);
      expect(run(three, { type: 'toggleCall', call: 'twoDarts' }).game.calls).toEqual([]);
    });
  });

  describe('gifts', () => {
    it('force a Hard card on the player; the gifter gets the bet if it is failed', () => {
      let s = run(betting(['l3-01']), { type: 'gift', from: 'b' });
      expect(s.game.phase).toBe('bet');
      expect(s.game.card?.id).toBe('l3-01');
      expect(s.game.giftFrom).toBe('b');
      expect(coins(s.game)).toEqual([100, 80, 100]);
      expect(s.game.pot).toBe(20);
      s = run(s, bet(10), match(turn(0, 'S1', 'S1', 'S1')), match(turn(1)));
      expect(coins(s.game)).toEqual([90, 90, 100]);
      expect(s.game.giftFrom).toBeNull();
    });

    it("can't be given to yourself or without the coins", () => {
      const s = betting(['l3-01']);
      expect(run(s, { type: 'gift', from: 'a' }).game.phase).toBe('pickLevel');
      const poor = withGame(s, { players: s.game.players.map((p) => ({ ...p, score: 10 })) });
      expect(run(poor, { type: 'gift', from: 'b' }).game.phase).toBe('pickLevel');
    });
  });

  it('splits the bet of a failing leader among the others', () => {
    let s = betting(['l2-03']);
    s = withGame(s, { players: s.game.players.map((p) => (p.id === 'a' ? { ...p, score: 200 } : p)) });
    s = run(s, { type: 'pickLevel', level: 2 }, bet(25), match(turn(0, 'S1', 'S1', 'S1')));
    expect(coins(s.game)).toEqual([175, 112, 112]);
    expect(s.game.pot).toBe(1);
  });

  it('lets winnings ride on the next card of the level, double or nothing', () => {
    let s = run(betting(['l2-03', 'l2-12']), { type: 'pickLevel', level: 2 }, bet(10), match(turn(0, 'D1')));
    s = run(s, { type: 'toggleRide' }, match(turn(1)));
    expect(s.game.players[0]).toMatchObject({ score: 100, ride: { level: 2, amount: 20 } });
    s = run(s, match(turn(2)), match(turn(3)));
    expect(s.game.phase).toBe('attempt');
    expect(s.game.card?.id).toBe('l2-12');
    expect(s.game).toMatchObject({ bet: 20, riding: true });
    s = run(s, match(turn(3, 'T5')));
    expect(s.game.players[0]).toMatchObject({ score: 140, ride: null });
  });

  it('loses ridden winnings to the pot', () => {
    let s = run(betting(['l2-03', 'l2-12']), { type: 'pickLevel', level: 2 }, bet(10), match(turn(0, 'D1')));
    s = run(s, { type: 'toggleRide' }, match(turn(1)), match(turn(2)), match(turn(3)));
    s = run(s, match(turn(3, 'S1', 'S1', 'S1')), match(turn(4)));
    expect(s.game.players[0]!.score).toBe(100);
    expect(s.game.pot).toBe(20);
  });

  it('gives loans that are paid back with interest at the end', () => {
    let s = run(betting(['l2-03']), { type: 'pickLevel', level: 2 }, { type: 'loan' });
    expect(s.game.players[0]).toMatchObject({ score: 150, debt: 75 });
    s = run(s, { type: 'loan' }, { type: 'loan' });
    expect(s.game.players[0]).toMatchObject({ score: 200, debt: 150 });
    s = run(s, bet(10), match({ ...turn(0, 'S1', 'S1', 'S1'), finished: true }));
    expect(s.game.phase).toBe('finished');
    expect(coins(s.game)).toEqual([40, 100, 100]);
    expect(s.game.winnerIds).toEqual(['b', 'c']);
  });

  it('pays double on golden cards and in the final round', () => {
    const golden = run(withGame(betting(['l2-03']), { golden: ['l2-03'] }), { type: 'pickLevel', level: 2 }, bet(10));
    expect(coins(run(golden, match(turn(0, 'D1'))).game)[0]).toBe(140);
    const final = run(withGame(betting(['l2-03']), { round: 9, maxRounds: 9 }), { type: 'pickLevel', level: 2 });
    expect(coins(run(final, bet(10), match(turn(0, 'D1'))).game)[0]).toBe(140);
  });

  it('gives a broke player the minimum bet', () => {
    let s = betting([]);
    s = withGame(s, { players: s.game.players.map((p) => (p.id === 'b' ? { ...p, score: 3 } : p)) });
    s = run(s, match(turn(1)));
    expect(s.game.players[1]!.score).toBe(10);
    expect(s.game.handout).toBe(7);
  });

  it('ends at the target coins', () => {
    let s = run(betting(['l3-01'], { targetCoins: 150 }), { type: 'pickLevel', level: 3 }, bet(20));
    s = run(s, match(turn(0, 'BULL')), match(turn(1)));
    expect(s.game.phase).toBe('finished');
    expect(s.game.winnerIds).toEqual(['a']);
  });

  it('follows Autodarts undo back into a turn with a bet', () => {
    let s = run(betting(['l2-03']), { type: 'pickLevel', level: 2 }, bet(10), match(turn(0, 'D1')));
    s = run(s, match(turn(1)));
    expect(coins(s.game)).toEqual([120, 100, 100]);
    s = run(s, match(turn(0, 'S1')));
    expect(coins(s.game)).toEqual([90, 100, 100]);
    expect(s.game.bet).toBe(10);
  });
});

describe('upgradeSession', () => {
  it('reads a classic game saved before betting mode', () => {
    const s = createSession(turn(0), DEFAULT_GAME_SETTINGS);
    const { applied: _, ...old } = s.game;
    const saved = {
      ...s,
      game: { ...old, awarded: 2, settings: { targetScore: 10, discardAfterFullRound: false } },
    } as unknown as Session;
    const upgraded = upgradeSession(saved);
    expect(upgraded.game.settings.mode).toBe('classic');
    expect(upgraded.game.applied).toEqual({ a: 2 });
    expect(upgraded.game.players[0]).toMatchObject({ debt: 0, ride: null });
  });
});
