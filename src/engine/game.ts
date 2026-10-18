import { CARDS, getCard, LEVELS, type Level } from './cards';
import type { Dart } from './darts';
import { evaluate } from './rules';

export type Outcome = 'solved' | 'failed';
export type Phase = 'pickLevel' | 'attempt' | 'resolved' | 'finished';

export interface Player {
  id: string;
  name: string;
  score: number;
}

export interface GameSettings {
  /** Points needed to win; 0 = play until the Autodarts match ends. */
  targetScore: number;
  /** Discard a card once every player failed it in a row. */
  discardAfterFullRound: boolean;
}

export const DEFAULT_GAME_SETTINGS: GameSettings = { targetScore: 10, discardAfterFullRound: false };

/** What the card game needs to know about the Autodarts match it runs on. */
export interface MatchSnapshot {
  id: string;
  /** Set and leg being played (`set.leg`); a new leg starts a new card game. */
  leg: string;
  finished: boolean;
  players: { id: string; name: string }[];
  /** The turn in progress (Autodarts `turns[0]`). */
  turn: { id: string; playerId: string; darts: Dart[] } | null;
}

export interface HistoryEntry {
  playerId: string;
  cardId: string;
  outcome: Outcome;
}

export interface GameState {
  phase: Phase;
  players: Player[];
  settings: GameSettings;
  decks: Record<Level, string[]>;
  card: { id: string; level: Level } | null;
  /** Index of the player whose turn it is in the Autodarts match. */
  active: number;
  failsOnCard: number;
  /** Autodarts turn currently being played. */
  turnId: string | null;
  /** All darts of the current Autodarts turn. */
  turnDarts: Dart[];
  /** Darts that were thrown before the card was picked; they don't count. */
  ignored: number;
  /** Darts counting for the current card. */
  darts: Dart[];
  outcome: Outcome | null;
  /** Points already credited to the active player for the current attempt. */
  awarded: number;
  history: HistoryEntry[];
  winnerIds: string[];
}

export type GameAction =
  | { type: 'match'; match: MatchSnapshot }
  | { type: 'pickLevel'; level: Level }
  /** Puts the current card aside; the player whose turn it is picks a new one. */
  | { type: 'skipCard' };

export function shuffle<T>(items: T[], rng: () => number = Math.random): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j]!, result[i]!];
  }
  return result;
}

export function createGame(
  players: { id: string; name: string }[],
  settings: GameSettings = DEFAULT_GAME_SETTINGS,
  rng: () => number = Math.random,
): GameState {
  const deck = (level: Level) =>
    shuffle(
      CARDS.filter((c) => c.level === level).map((c) => c.id),
      rng,
    );
  return {
    phase: 'pickLevel',
    players: players.map((p) => ({ ...p, score: 0 })),
    settings,
    decks: { 1: deck(1), 2: deck(2), 3: deck(3) },
    card: null,
    active: 0,
    failsOnCard: 0,
    turnId: null,
    turnDarts: [],
    ignored: 0,
    darts: [],
    outcome: null,
    awarded: 0,
    history: [],
    winnerIds: [],
  };
}

const inTurn = (s: GameState) => s.phase === 'attempt' || s.phase === 'resolved';
const decksEmpty = (s: GameState) => LEVELS.every((l) => s.decks[l].length === 0);

/** Recomputes darts, outcome and the active player's points for the current attempt. */
function reevaluate(s: GameState, complete = false): GameState {
  if (!s.card || !inTurn(s)) return s;
  const darts = s.turnDarts.slice(s.ignored, s.ignored + 3);
  const result = evaluate(getCard(s.card.id).rule, darts, complete);
  const outcome = result === 'pending' ? null : result;
  const awarded = outcome === 'solved' ? s.card.level : 0;
  const players = s.players.map((p, i) => (i === s.active ? { ...p, score: p.score + awarded - s.awarded } : p));
  return { ...s, darts, outcome, awarded, players, phase: outcome ? 'resolved' : 'attempt' };
}

function finish(s: GameState): GameState {
  const best = Math.max(...s.players.map((p) => p.score));
  return {
    ...s,
    phase: 'finished',
    card: null,
    winnerIds: s.players.filter((p) => p.score === best).map((p) => p.id),
  };
}

/** Closes the card attempt of the turn that just ended. */
function endTurn(state: GameState): GameState {
  if (!state.card || !inTurn(state)) return state;
  const s = reevaluate(state, true);
  const card = s.card!;
  const outcome = s.outcome ?? 'failed';
  const player = s.players[s.active]!;
  const history = [...s.history, { playerId: player.id, cardId: card.id, outcome }];
  const cleared = { ...s, history, darts: [], outcome: null, awarded: 0 };

  if (outcome === 'solved') {
    const target = s.settings.targetScore;
    if (target > 0 && player.score >= target) return finish(cleared);
    const next = { ...cleared, card: null, failsOnCard: 0, phase: 'pickLevel' as const };
    return decksEmpty(next) ? finish(next) : next;
  }

  const failsOnCard = s.failsOnCard + 1;
  // Playing alone, nobody can take the card over, so it is discarded.
  const discard = s.settings.discardAfterFullRound || s.players.length === 1;
  if (discard && failsOnCard >= s.players.length) {
    const next = { ...cleared, card: null, failsOnCard: 0, phase: 'pickLevel' as const };
    return decksEmpty(next) ? finish(next) : next;
  }
  // The same card goes to the next player.
  return { ...cleared, failsOnCard, phase: 'attempt' };
}

function startTurn(s: GameState, turn: NonNullable<MatchSnapshot['turn']>): GameState {
  const index = s.players.findIndex((p) => p.id === turn.playerId);
  return {
    ...s,
    active: index >= 0 ? index : s.active,
    turnId: turn.id,
    turnDarts: [],
    ignored: 0,
    darts: [],
    outcome: null,
    awarded: 0,
  };
}

export function gameReducer(s: GameState, action: GameAction): GameState {
  if (s.phase === 'finished') return s;

  switch (action.type) {
    case 'match': {
      const { match } = action;
      let next = s;
      if (match.turn) {
        if (match.turn.id !== next.turnId) {
          if (next.turnId !== null) next = endTurn(next);
          if (next.phase === 'finished') return next;
          next = startTurn(next, match.turn);
        }
        next = reevaluate({ ...next, turnDarts: match.turn.darts });
      }
      if (match.finished) next = finish(endTurn(next));
      return next;
    }
    case 'pickLevel': {
      if (s.phase !== 'pickLevel') return s;
      const [cardId, ...rest] = s.decks[action.level];
      if (!cardId) return s;
      return reevaluate({
        ...s,
        phase: 'attempt',
        card: { id: cardId, level: action.level },
        decks: { ...s.decks, [action.level]: rest },
        failsOnCard: 0,
        ignored: s.turnDarts.length,
        darts: [],
        outcome: null,
        awarded: 0,
      });
    }
    case 'skipCard': {
      if (!inTurn(s) || s.outcome === 'solved') return s;
      const next: GameState = {
        ...s,
        phase: 'pickLevel',
        card: null,
        failsOnCard: 0,
        // Darts already thrown this turn don't count for the next card.
        ignored: s.turnDarts.length,
        darts: [],
        outcome: null,
        awarded: 0,
      };
      return decksEmpty(next) ? finish(next) : next;
    }
  }
}

export interface LevelStats {
  solved: number;
  attempts: number;
}

/** Solved cards and attempts per level for every player, from the game history. */
export function levelStats(s: GameState): Record<string, Record<Level, LevelStats>> {
  const stats = Object.fromEntries(
    s.players.map((p) => [p.id, Object.fromEntries(LEVELS.map((l) => [l, { solved: 0, attempts: 0 }]))]),
  ) as Record<string, Record<Level, LevelStats>>;
  for (const entry of s.history) {
    const level = stats[entry.playerId]?.[getCard(entry.cardId).level];
    if (!level) continue;
    level.attempts++;
    if (entry.outcome === 'solved') level.solved++;
  }
  return stats;
}

/** The card game attached to one Autodarts match, as persisted by the extension. */
export interface Session {
  matchId: string;
  /** Leg the card game is played in; missing in sessions saved before legs were tracked. */
  leg?: string;
  game: GameState;
  /** Game state as each Autodarts turn ended, to follow Autodarts' undo back into it. */
  turnEnds: Record<string, GameState>;
}

const MAX_TURN_ENDS = 100;

export function createSession(match: MatchSnapshot, settings: GameSettings, rng?: () => number): Session {
  return applyAction(
    { matchId: match.id, leg: match.leg, game: createGame(match.players, settings, rng), turnEnds: {} },
    { type: 'match', match },
  );
}

/** Whether the match moved on to a leg the card game was not played in. */
function isNewLeg(session: Session, match: MatchSnapshot) {
  // A finished snapshot still belongs to the leg that just ended.
  if (match.finished || !match.turn) return false;
  return session.leg === undefined ? session.game.phase === 'finished' : session.leg !== match.leg;
}

export function applyAction(session: Session, action: GameAction): Session {
  if (action.type === 'match' && isNewLeg(session, action.match)) {
    return createSession(action.match, session.game.settings);
  }
  let base = session.game;
  let turnEnds = session.turnEnds;
  const turnId = action.type === 'match' ? action.match.turn?.id : undefined;
  if (turnId && base.turnId && turnId !== base.turnId) {
    const entries = Object.entries({ ...turnEnds, [base.turnId]: base });
    turnEnds = Object.fromEntries(entries.slice(-MAX_TURN_ENDS));
    // Autodarts went back to an earlier turn (undo): continue from where that turn was.
    if (session.turnEnds[turnId]) base = session.turnEnds[turnId]!;
  }
  const game = gameReducer(base, action);
  if (game === session.game && turnEnds === session.turnEnds) return session;
  return { ...session, game, turnEnds };
}
