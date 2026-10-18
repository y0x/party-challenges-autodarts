import { describe, expect, it } from 'vitest';
import { parseDart } from '../engine/darts';
import { normalizeThrow, parseHookMessage, parseMatchState } from './autodarts';

describe('normalizeThrow', () => {
  it('handles beds, bulls and misses', () => {
    expect(normalizeThrow({ segment: { name: 'S20', number: 20, bed: 'SingleOuter', multiplier: 1 } })).toEqual(
      parseDart('S20'),
    );
    expect(normalizeThrow({ segment: { name: 'T19', number: 19, bed: 'Triple', multiplier: 3 } })).toEqual(
      parseDart('T19'),
    );
    expect(normalizeThrow({ segment: { name: '25', number: 25, bed: 'SingleBull', multiplier: 1 } })).toEqual(
      parseDart('25'),
    );
    expect(normalizeThrow({ segment: { name: 'Bull', number: 25, bed: 'DoubleBull', multiplier: 2 } })).toEqual(
      parseDart('BULL'),
    );
    expect(normalizeThrow({ segment: { name: 'M5', number: 5, bed: 'Outside', multiplier: 0 } })).toEqual(
      parseDart('MISS'),
    );
    expect(normalizeThrow(null)).toBeNull();
  });
});

describe('match state', () => {
  // Shape as used by Tools for Autodarts (IMatch): turns[0] is the turn in progress.
  const state = {
    id: 'match-1',
    variant: 'Count Up',
    finished: false,
    player: 1,
    round: 2,
    players: [
      { id: 'p1', name: 'Ann', boardId: 'b1' },
      { id: 'p2', name: 'Ben', boardId: 'b1' },
    ],
    turns: [
      {
        id: 'turn-7',
        playerId: 'p2',
        round: 2,
        throws: [
          { id: 'x', throw: 0, segment: { name: 'T20', number: 20, bed: 'Triple', multiplier: 3 } },
          { id: 'y', throw: 1, segment: { name: 'S5', number: 5, bed: 'SingleInner', multiplier: 1 } },
        ],
      },
    ],
  };

  it('parses players and the current turn', () => {
    expect(parseMatchState(state)).toEqual({
      id: 'match-1',
      leg: '0.0',
      finished: false,
      players: [
        { id: 'p1', name: 'Ann' },
        { id: 'p2', name: 'Ben' },
      ],
      turn: { id: '0.0.2.1', playerId: 'p2', darts: [parseDart('T20'), parseDart('S5')] },
    });
  });

  it('gives every turn its own key, without relying on turn ids', () => {
    const at = (round: number, player: number) =>
      parseMatchState({ ...state, round, player, turns: [{ round, playerId: `p${player + 1}`, throws: [] }] })!.turn!
        .id;
    // one player: only the round changes
    expect(at(1, 0)).not.toBe(at(2, 0));
    // two players: same player in the next round is a new turn
    expect(new Set([at(1, 0), at(1, 1), at(2, 0), at(2, 1)]).size).toBe(4);
    expect(at(2, 1)).toBe(at(2, 1));
  });

  it('reads WebSocket frames and API responses', () => {
    const ws = JSON.stringify({ channel: 'autodarts.matches', topic: 'match-1.state', data: state });
    expect(parseHookMessage({ kind: 'ws', data: ws })?.turn?.id).toBe('0.0.2.1');
    expect(parseHookMessage({ kind: 'http', data: JSON.stringify(state) })?.id).toBe('match-1');
  });

  it('ignores events, other channels and junk', () => {
    const event = JSON.stringify({ channel: 'autodarts.matches', data: { id: 'match-1', body: {} } });
    expect(parseHookMessage({ kind: 'ws', data: event })).toBeNull();
    const board = JSON.stringify({ channel: 'autodarts.boards', data: state });
    expect(parseHookMessage({ kind: 'ws', data: board })).toBeNull();
    expect(parseHookMessage({ kind: 'http', data: '{"items":[]}' })).toBeNull();
    expect(parseHookMessage({ kind: 'ws', data: 'not json' })).toBeNull();
  });
});
