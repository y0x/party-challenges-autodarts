import { describe, expect, it } from 'vitest';
import { getCard } from './cards';
import { parseDart } from './darts';
import {
  applyAction,
  createSession,
  DEFAULT_GAME_SETTINGS,
  type GameSettings,
  levelStats,
  type MatchSnapshot,
  type Session,
} from './game';

const PLAYERS = [
  { id: 'a', name: 'Ann' },
  { id: 'b', name: 'Ben' },
  { id: 'c', name: 'Cy' },
];

/** Builds Autodarts match snapshots; `turn(n, ...darts)` is turn number n (player n % players). */
function matchOf(players = PLAYERS) {
  return {
    turn: (n: number, ...labels: string[]): MatchSnapshot => ({
      id: 'm1',
      leg: '0.0',
      finished: false,
      players,
      turn: { id: `t${n}`, playerId: players[n % players.length]!.id, darts: labels.map(parseDart) },
    }),
  };
}

/** A session whose decks start with the given card. */
function sessionWith(cardId: string, settings: Partial<GameSettings> = {}, players = PLAYERS): Session {
  const s = createSession(matchOf(players).turn(0), { ...DEFAULT_GAME_SETTINGS, ...settings });
  const level = getCard(cardId).level;
  const decks = { ...s.game.decks, [level]: [cardId, ...s.game.decks[level].filter((id) => id !== cardId)] };
  return { ...s, game: { ...s.game, decks } };
}

const m = matchOf();
const run = (s: Session, ...actions: Parameters<typeof applyAction>[1][]) => actions.reduce(applyAction, s);
const match = (snapshot: MatchSnapshot) => ({ type: 'match' as const, match: snapshot });

describe('card game on an Autodarts match', () => {
  it('awards level points on solve; the next player picks', () => {
    let s = run(sessionWith('l2-01'), { type: 'pickLevel', level: 2 }); // Score 100+
    s = run(s, match(m.turn(0, 'T20')), match(m.turn(0, 'T20', 'D20')));
    expect(s.game.outcome).toBe('solved');
    expect(s.game.players[0]!.score).toBe(2);
    s = run(s, match(m.turn(1)));
    expect(s.game.active).toBe(1);
    expect(s.game.phase).toBe('pickLevel');
    expect(s.game.history).toEqual([{ playerId: 'a', cardId: 'l2-01', outcome: 'solved' }]);
  });

  it('passes a failed card to the next player', () => {
    let s = run(sessionWith('l1-02'), { type: 'pickLevel', level: 1 }); // Any double
    s = run(s, match(m.turn(0, 'S1', 'S2', 'S3')));
    expect(s.game.outcome).toBe('failed');
    s = run(s, match(m.turn(1)));
    expect(s.game.phase).toBe('attempt');
    expect(s.game.active).toBe(1);
    expect(s.game.card?.id).toBe('l1-02');
    expect(s.game.failsOnCard).toBe(1);
    s = run(s, match(m.turn(1, 'D7')), match(m.turn(2)));
    expect(s.game.players[1]!.score).toBe(1);
    expect(s.game.phase).toBe('pickLevel');
  });

  it('counts missing darts as misses when the turn ends early', () => {
    let s = run(sessionWith('l1-02'), { type: 'pickLevel', level: 1 });
    s = run(s, match(m.turn(0, 'S1')), match(m.turn(1)));
    expect(s.game.history.at(-1)?.outcome).toBe('failed');
  });

  it('ignores darts thrown before the card was picked', () => {
    let s = run(sessionWith('l1-02'), match(m.turn(0, 'D1')), { type: 'pickLevel', level: 1 });
    expect(s.game.darts).toEqual([]);
    s = run(s, match(m.turn(0, 'D1', 'S5')));
    expect(s.game.darts).toEqual([parseDart('S5')]);
    expect(s.game.outcome).toBeNull();
  });

  it('a player who does not pick a card just loses the turn', () => {
    const s = run(sessionWith('l1-02'), match(m.turn(0, 'S1', 'S1', 'S1')), match(m.turn(1)));
    expect(s.game.phase).toBe('pickLevel');
    expect(s.game.active).toBe(1);
    expect(s.game.history).toEqual([]);
  });

  it('follows dart corrections made in Autodarts', () => {
    let s = run(sessionWith('l1-02'), { type: 'pickLevel', level: 1 }, match(m.turn(0, 'D5')));
    expect(s.game.players[0]!.score).toBe(1);
    s = run(s, match(m.turn(0, 'S5')));
    expect(s.game.players[0]!.score).toBe(0);
    expect(s.game.phase).toBe('attempt');
  });

  it("rewinds when Autodarts' undo goes back to an earlier turn", () => {
    let s = run(sessionWith('l1-02'), { type: 'pickLevel', level: 1 }, match(m.turn(0, 'D5')));
    s = run(s, match(m.turn(1)));
    expect(s.game.players[0]!.score).toBe(1);
    expect(s.game.phase).toBe('pickLevel');
    s = run(s, match(m.turn(0, 'D5', 'S1')));
    expect(s.game.active).toBe(0);
    expect(s.game.card?.id).toBe('l1-02');
    expect(s.game.players[0]!.score).toBe(1);
    s = run(s, match(m.turn(0, 'S5')));
    expect(s.game.players[0]!.score).toBe(0);
  });

  it('discards a card after a full round of fails when enabled', () => {
    const two = matchOf(PLAYERS.slice(0, 2));
    let s = run(sessionWith('l1-02', { discardAfterFullRound: true }, PLAYERS.slice(0, 2)), {
      type: 'pickLevel',
      level: 1,
    });
    s = run(s, match(two.turn(0, 'S1', 'S1', 'S1')), match(two.turn(1, 'S1', 'S1', 'S1')), match(two.turn(2)));
    expect(s.game.phase).toBe('pickLevel');
    expect(s.game.card).toBeNull();
  });

  it('discards a failed card when playing alone', () => {
    const solo = matchOf(PLAYERS.slice(0, 1));
    let s = run(sessionWith('l1-02', {}, PLAYERS.slice(0, 1)), { type: 'pickLevel', level: 1 });
    s = run(s, match(solo.turn(0, 'S1', 'S1', 'S1')), match(solo.turn(1)));
    expect(s.game.phase).toBe('pickLevel');
    expect(s.game.card).toBeNull();
  });

  it('skipping a card lets the current player pick a new one', () => {
    let s = run(sessionWith('l1-02'), { type: 'pickLevel', level: 1 }, match(m.turn(0, 'S1')));
    s = run(s, { type: 'skipCard' });
    expect(s.game.phase).toBe('pickLevel');
    expect(s.game.active).toBe(0);
    s = run(s, { type: 'pickLevel', level: 2 }, match(m.turn(0, 'S1', 'T20')));
    expect(s.game.darts).toEqual([parseDart('T20')]);
  });

  it('ends at the target score', () => {
    let s = run(sessionWith('l3-01', { targetScore: 3 }), { type: 'pickLevel', level: 3 });
    s = run(s, match(m.turn(0, 'BULL')), match(m.turn(1)));
    expect(s.game.phase).toBe('finished');
    expect(s.game.winnerIds).toEqual(['a']);
  });

  it('ends with the Autodarts match', () => {
    let s = run(sessionWith('l1-02', { targetScore: 0 }), { type: 'pickLevel', level: 1 }, match(m.turn(0, 'D1')));
    s = run(s, match({ ...m.turn(0, 'D1'), finished: true }));
    expect(s.game.phase).toBe('finished');
    expect(s.game.winnerIds).toEqual(['a']);
  });

  it('starts a new card game in the next leg', () => {
    let s = run(sessionWith('l1-02', { targetScore: 1 }), { type: 'pickLevel', level: 1 });
    s = run(s, match(m.turn(0, 'D1')), match({ ...m.turn(0, 'D1'), finished: true }));
    expect(s.game.phase).toBe('finished');
    // the leg's last state may already carry the next leg number
    s = run(s, match({ ...m.turn(0, 'D1'), leg: '0.1', finished: true }));
    expect(s.game.phase).toBe('finished');

    s = run(s, match({ ...m.turn(0), leg: '0.1' }));
    expect(s.leg).toBe('0.1');
    expect(s.game.phase).toBe('pickLevel');
    expect(s.game.players.map((p) => p.score)).toEqual([0, 0, 0]);
    expect(s.game.history).toEqual([]);
    expect(s.game.settings.targetScore).toBe(1);
    // the new game keeps going within the leg
    s = run(s, match({ ...m.turn(1), leg: '0.1' }));
    expect(s.game.history).toEqual([]);
    expect(s.game.active).toBe(1);
  });

  it('restarts a finished game saved before legs were tracked', () => {
    let s = run(sessionWith('l1-02', { targetScore: 1 }), { type: 'pickLevel', level: 1 });
    s = run(s, match(m.turn(0, 'D1')), match(m.turn(1)));
    expect(s.game.phase).toBe('finished');
    s = run({ ...s, leg: undefined }, match({ ...m.turn(0), leg: '0.1' }));
    expect(s.game.phase).toBe('pickLevel');
  });
});

describe('levelStats', () => {
  it('counts solved cards and attempts per player and level', () => {
    const s = sessionWith('l2-01');
    const game = {
      ...s.game,
      history: [
        { playerId: 'a', cardId: 'l1-01', outcome: 'solved' as const },
        { playerId: 'a', cardId: 'l2-01', outcome: 'failed' as const },
        { playerId: 'b', cardId: 'l2-01', outcome: 'solved' as const },
        { playerId: 'a', cardId: 'l3-01', outcome: 'solved' as const },
      ],
    };
    const stats = levelStats(game);
    expect(stats.a).toEqual({
      1: { solved: 1, attempts: 1 },
      2: { solved: 0, attempts: 1 },
      3: { solved: 1, attempts: 1 },
    });
    expect(stats.b![2]).toEqual({ solved: 1, attempts: 1 });
    expect(stats.c![1]).toEqual({ solved: 0, attempts: 0 });
  });
});
