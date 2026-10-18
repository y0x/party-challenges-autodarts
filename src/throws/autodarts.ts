import { type Dart, MISS, type Multiplier } from '../engine/darts';
import type { MatchSnapshot } from '../engine/game';

/** `source` marker of messages the MAIN-world hook posts to the content script. */
export const HOOK_MESSAGE_SOURCE = 'party-challenges-autodarts:hook';

export interface HookMessage {
  source: typeof HOOK_MESSAGE_SOURCE;
  /** "ws": a WebSocket frame; "http": an API response the page received. */
  kind: 'ws' | 'http';
  url: string;
  data: string;
}

interface RawSegment {
  number?: number;
  multiplier?: number;
  bed?: string;
  name?: string;
}

/** Converts an Autodarts throw (`{segment: {...}}`) or bare segment into a Dart. */
export function normalizeThrow(raw: unknown): Dart | null {
  if (!raw || typeof raw !== 'object') return null;
  const seg = ((raw as { segment?: RawSegment }).segment ?? raw) as RawSegment;
  if (typeof seg.number !== 'number' && typeof seg.multiplier !== 'number') return null;
  const number = seg.number ?? 0;
  const multiplier = seg.multiplier ?? 0;
  const bed = seg.bed ?? '';
  if (multiplier === 0 || number === 0 || /outside|miss/i.test(bed)) return MISS;
  if (number === 25 || number === 50 || /bull/i.test(bed)) {
    const isDouble = multiplier === 2 || number === 50 || /double|inner/i.test(bed);
    return { number: 25, multiplier: isDouble ? 2 : 1 };
  }
  if (number < 1 || number > 20 || multiplier > 3) return null;
  return { number, multiplier: multiplier as Multiplier };
}

interface RawMatch {
  id?: unknown;
  body?: unknown;
  finished?: unknown;
  gameFinished?: unknown;
  player?: unknown;
  round?: unknown;
  leg?: unknown;
  set?: unknown;
  players?: { id?: unknown; name?: unknown }[];
  turns?: { round?: unknown; playerId?: unknown; throws?: unknown[] }[];
}

/**
 * Reads an Autodarts match state, as sent on the `autodarts.matches` channel and returned by
 * `GET /gs/v0/matches/<id>/state`. `turns[0]` is the turn in progress.
 */
export function parseMatchState(data: unknown): MatchSnapshot | null {
  const match = data as RawMatch | null;
  if (!match || typeof match.id !== 'string' || match.body !== undefined) return null;
  if (!Array.isArray(match.players) || !Array.isArray(match.turns)) return null;
  const players = match.players.map((p, i) => ({
    id: typeof p.id === 'string' ? p.id : `player-${i}`,
    name: typeof p.name === 'string' && p.name ? p.name : `Player ${i + 1}`,
  }));
  const raw = match.turns[0];
  const playerIndex = typeof match.player === 'number' ? match.player : 0;
  // Turns carry no id of their own (Autodarts' createTurn has none), so a turn is identified
  // by where it sits in the match. Going back with undo yields the earlier key again.
  const round = raw?.round ?? match.round;
  const leg = `${String(match.set ?? 0)}.${String(match.leg ?? 0)}`;
  const turn = raw
    ? {
        id: `${leg}.${String(round)}.${playerIndex}`,
        playerId: typeof raw.playerId === 'string' ? raw.playerId : (players[playerIndex]?.id ?? ''),
        darts: (raw.throws ?? []).map(normalizeThrow).filter((d): d is Dart => d !== null),
      }
    : null;
  return { id: match.id, leg, finished: match.finished === true || match.gameFinished === true, players, turn };
}

/** Parses a hook message; returns the match state it carries, if any. */
export function parseHookMessage(message: Pick<HookMessage, 'kind' | 'data'>): MatchSnapshot | null {
  let payload: unknown;
  try {
    payload = JSON.parse(message.data);
  } catch {
    return null;
  }
  if (message.kind === 'ws') {
    const { channel, data } = (payload ?? {}) as { channel?: unknown; data?: unknown };
    return channel === 'autodarts.matches' ? parseMatchState(data) : null;
  }
  return parseMatchState(payload);
}
