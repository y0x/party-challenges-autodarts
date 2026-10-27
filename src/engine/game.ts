import {
  type BettingRules,
  betLimits,
  bettingLedger,
  type Call,
  canCall,
  canDoubt,
  canGift,
  canLoan,
  canRide,
  DEFAULT_BETTING_RULES,
  evaluateWithCalls,
  GOLDEN_CHANCE,
  giftCost,
  isBetting,
  type Ledger,
  LOAN,
  minBet,
  netWorth,
  payoutMultiplier,
} from './betting';
import { CARDS, getCard, LEVELS, type Level } from './cards';
import type { Dart } from './darts';

export type Outcome = 'solved' | 'failed';
/** `bet`: betting mode only, the card is drawn and the player places a bet on it. */
export type Phase = 'pickLevel' | 'bet' | 'attempt' | 'resolved' | 'finished';
/** `classic`: cards are worth points; `betting`: players bet coins on the cards. */
export type GameMode = 'classic' | 'betting';

export interface Player {
  id: string;
  name: string;
  /** Points, or coins in betting mode. */
  score: number;
  /** Coins owed for loans, paid back when the game ends. */
  debt: number;
  /** Winnings let ride: played as the bet on the player's next card of `level`, double or nothing. */
  ride: { level: Level; amount: number } | null;
}

export interface GameSettings {
  mode: GameMode;
  /** Points needed to win; 0 = play until the Autodarts match ends. */
  targetScore: number;
  /** Discard a card once every player failed it in a row. */
  discardAfterFullRound: boolean;
  betting: BettingRules;
}

export const DEFAULT_GAME_SETTINGS: GameSettings = {
  mode: 'classic',
  targetScore: 10,
  discardAfterFullRound: false,
  betting: DEFAULT_BETTING_RULES,
};

/** What the card game needs to know about the Autodarts match it runs on. */
export interface MatchSnapshot {
  id: string;
  /** Set and leg being played (`set.leg`); a new leg starts a new card game. */
  leg: string;
  finished: boolean;
  players: { id: string; name: string }[];
  /** The turn in progress (Autodarts `turns[0]`). */
  turn: { id: string; playerId: string; darts: Dart[] } | null;
  /** Round of the turn in progress, and the match's number of rounds, when Autodarts sends them. */
  round?: number;
  maxRounds?: number;
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
  /** Points or coins already credited to each player for the current attempt. */
  applied: Record<string, number>;
  history: HistoryEntry[];
  winnerIds: string[];
  round: number | null;
  maxRounds: number | null;

  // Betting mode
  /** Coins lost on cards; whoever solves the next card wins them. */
  pot: number;
  /** Coins already put into the pot by the current attempt. */
  potApplied: number;
  /** Cards that pay double in this game. */
  golden: string[];
  /** The active player's bet on the current card; null until placed. */
  bet: number | null;
  calls: Call[];
  /** Players betting that the active player fails the card. */
  doubters: string[];
  /** Player who forced the current card on the active player; gets the bet if it is failed. */
  giftFrom: string | null;
  /** The current bet is the active player's ridden winnings. */
  riding: boolean;
  /** The active player lets the current card's payout ride on their next card. */
  letItRide: boolean;
  /** Coins the bank gave the active player this turn because they were broke. */
  handout: number;
}

export type GameAction =
  | { type: 'match'; match: MatchSnapshot }
  | { type: 'pickLevel'; level: Level }
  /** Puts the current card aside; the player whose turn it is picks a new one. */
  | { type: 'skipCard' }
  // Betting mode
  | { type: 'placeBet'; amount: number }
  /** Takes the bet back before the first dart, to bet again. */
  | { type: 'cancelBet' }
  | { type: 'toggleCall'; call: Call }
  | { type: 'toggleDoubt'; playerId: string }
  /** `from` pays to force a Hard card on the active player. */
  | { type: 'gift'; from: string }
  | { type: 'toggleRide' }
  | { type: 'loan' };

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
  const betting = settings.mode === 'betting';
  const decks = { 1: deck(1), 2: deck(2), 3: deck(3) };
  return {
    phase: 'pickLevel',
    players: players.map((p) => ({ ...p, score: betting ? settings.betting.startingCoins : 0, debt: 0, ride: null })),
    settings,
    decks,
    card: null,
    active: 0,
    failsOnCard: 0,
    turnId: null,
    turnDarts: [],
    ignored: 0,
    darts: [],
    outcome: null,
    applied: {},
    history: [],
    winnerIds: [],
    round: null,
    maxRounds: null,
    pot: 0,
    potApplied: 0,
    golden: betting && settings.betting.goldenCards ? CARDS.filter(() => rng() < GOLDEN_CHANCE).map((c) => c.id) : [],
    bet: null,
    calls: [],
    doubters: [],
    giftFrom: null,
    riding: false,
    letItRide: false,
    handout: 0,
  };
}

const inTurn = (s: GameState) => s.phase === 'attempt' || s.phase === 'resolved';
const decksEmpty = (s: GameState) => LEVELS.every((l) => s.decks[l].length === 0);

/** Points to win, or coins in betting mode; 0 = play until the Autodarts match ends. */
export const targetOf = (s: GameState) => (isBetting(s) ? s.settings.betting.targetCoins : s.settings.targetScore);

/** Credits the coins or points of `ledger` for the current attempt, replacing what was credited before. */
function applyLedger(s: GameState, ledger: Ledger): GameState {
  const players = s.players.map((p) => ({
    ...p,
    score: p.score + (ledger.coins[p.id] ?? 0) - (s.applied[p.id] ?? 0),
  }));
  return { ...s, players, applied: ledger.coins, pot: s.pot + ledger.pot - s.potApplied, potApplied: ledger.pot };
}

function ledgerOf(s: GameState): Ledger {
  if (!isBetting(s)) {
    const points = s.outcome === 'solved' && s.card ? s.card.level : 0;
    return { coins: points ? { [s.players[s.active]!.id]: points } : {}, pot: 0 };
  }
  return s.bet === null ? { coins: {}, pot: 0 } : bettingLedger(s, s.outcome, s.bet);
}

/** Keeps what was credited for the attempt as it is. */
const settle = (s: GameState): GameState => ({ ...s, applied: {}, potApplied: 0 });

/** State of a new attempt on the current card. */
const freshAttempt = {
  darts: [],
  outcome: null,
  applied: {},
  potApplied: 0,
  bet: null,
  calls: [],
  doubters: [],
  riding: false,
  letItRide: false,
} satisfies Partial<GameState>;

/** Recomputes darts, outcome and the coins or points of the current attempt. */
function reevaluate(s: GameState, complete = false): GameState {
  if (!s.card || !inTurn(s)) return s;
  const darts = s.turnDarts.slice(s.ignored, s.ignored + 3);
  const result = evaluateWithCalls(getCard(s.card.id).rule, s.calls, darts, complete);
  const outcome = result === 'pending' ? null : result;
  const next: GameState = { ...s, darts, outcome, phase: outcome ? 'resolved' : 'attempt' };
  return applyLedger(next, ledgerOf(next));
}

function finish(s: GameState): GameState {
  // Ridden winnings come back and loans are paid back.
  const players = s.players.map((p) => ({ ...p, score: netWorth(p), debt: 0, ride: null }));
  const best = Math.max(...players.map((p) => p.score));
  return {
    ...settle(s),
    players,
    phase: 'finished',
    card: null,
    winnerIds: players.filter((p) => p.score === best).map((p) => p.id),
  };
}

/** Draws the next card of `level` for the active player. */
function draw(s: GameState, level: Level): GameState | null {
  const [cardId, ...rest] = s.decks[level];
  if (!cardId) return null;
  return {
    ...s,
    ...freshAttempt,
    phase: isBetting(s) ? 'bet' : 'attempt',
    card: { id: cardId, level },
    decks: { ...s.decks, [level]: rest },
    failsOnCard: 0,
    giftFrom: null,
    // Darts already thrown this turn don't count for the card.
    ignored: s.turnDarts.length,
  };
}

/** Plays the active player's ridden winnings on a card of the same level (any level once that deck is empty). */
function drawRide(s: GameState): GameState {
  const player = s.players[s.active]!;
  if (!player.ride) return s;
  const level = [player.ride.level, ...LEVELS].find((l) => s.decks[l].length > 0);
  const drawn = level && draw(s, level);
  if (!drawn) return s;
  const players = s.players.map((p, i) => (i === s.active ? { ...p, ride: null } : p));
  return reevaluate({ ...drawn, players, phase: 'attempt', bet: player.ride.amount, riding: true });
}

const nextCard = (s: GameState): GameState => {
  const next = { ...s, card: null, failsOnCard: 0, giftFrom: null, phase: 'pickLevel' as const };
  return decksEmpty(next) ? finish(next) : next;
};

/** Closes the card attempt of the turn that just ended. */
function endTurn(state: GameState): GameState {
  let s: GameState;
  if (state.card && state.phase === 'bet') {
    // A player who doesn't bet on their card loses the minimum bet, so nobody can wait the game out.
    const bet = betLimits(state).min;
    s = applyLedger({ ...state, bet, outcome: 'failed' }, bettingLedger(state, 'failed', bet, false));
  } else if (state.card && inTurn(state)) {
    s = reevaluate(state, true);
  } else {
    return state;
  }
  const card = s.card!;
  const outcome = s.outcome ?? 'failed';
  let player = s.players[s.active]!;
  const history = [...s.history, { playerId: player.id, cardId: card.id, outcome }];
  let players = s.players;
  if (outcome === 'solved' && s.letItRide && canRide({ ...s, phase: 'resolved' })) {
    const amount = s.bet! * payoutMultiplier(s);
    player = { ...player, score: player.score - amount, ride: { level: card.level, amount } };
    players = players.map((p, i) => (i === s.active ? player : p));
  }
  const cleared = { ...settle(s), ...freshAttempt, players, history };

  if (outcome === 'solved') {
    const target = targetOf(s);
    if (target > 0 && netWorth(player) >= target) return finish(cleared);
    return nextCard(cleared);
  }

  const failsOnCard = s.failsOnCard + 1;
  // Playing alone, nobody can take the card over, so it is discarded.
  const discard = s.settings.discardAfterFullRound || s.players.length === 1;
  if (discard && failsOnCard >= s.players.length) return nextCard(cleared);
  // The same card goes to the next player; a gift only applies to the player it was given to.
  return { ...cleared, failsOnCard, giftFrom: null, phase: isBetting(s) ? 'bet' : 'attempt' };
}

function startTurn(s: GameState, turn: NonNullable<MatchSnapshot['turn']>): GameState {
  const index = s.players.findIndex((p) => p.id === turn.playerId);
  const active = index >= 0 ? index : s.active;
  let next: GameState = {
    ...s,
    active,
    turnId: turn.id,
    turnDarts: [],
    ignored: 0,
    darts: [],
    outcome: null,
    applied: {},
    handout: 0,
  };
  if (!isBetting(next)) return next;
  // A broke player gets the minimum bet from the bank.
  const handout = Math.max(0, minBet(next) - next.players[active]!.score);
  if (handout > 0) {
    const players = next.players.map((p, i) => (i === active ? { ...p, score: p.score + handout } : p));
    next = { ...next, players, handout };
  }
  return next.phase === 'pickLevel' ? drawRide(next) : next;
}

/** Updates the round, keeping the state as it is when nothing changed. */
function withRound(s: GameState, match: MatchSnapshot): GameState {
  const round = match.round ?? s.round;
  const maxRounds = match.maxRounds ?? s.maxRounds;
  return round === s.round && maxRounds === s.maxRounds ? s : { ...s, round, maxRounds };
}

export function gameReducer(s: GameState, action: GameAction): GameState {
  if (s.phase === 'finished') return s;

  switch (action.type) {
    case 'match': {
      const { match } = action;
      let next = withRound(s, match);
      if (match.turn) {
        if (match.turn.id !== next.turnId) {
          if (next.turnId !== null) next = endTurn(next);
          if (next.phase === 'finished') return next;
          next = startTurn(next, match.turn);
        }
        next = reevaluate({ ...next, turnDarts: match.turn.darts });
      }
      // A card that wasn't bet on yet when the match ended is not played.
      if (match.finished) next = finish(next.phase === 'bet' ? next : endTurn(next));
      return next;
    }
    case 'pickLevel': {
      if (s.phase !== 'pickLevel') return s;
      const next = draw(s, action.level);
      return next ? reevaluate(next) : s;
    }
    case 'skipCard': {
      if (!s.card || !(inTurn(s) || s.phase === 'bet') || s.outcome === 'solved') return s;
      let next = s;
      if (isBetting(s)) {
        // Skipping costs the bet (the minimum bet before betting), without the doubters.
        const stake = s.bet ?? betLimits(s).min;
        next = settle(applyLedger(s, bettingLedger(s, 'failed', stake, false)));
      } else {
        next = applyLedger(s, { coins: {}, pot: 0 });
      }
      return nextCard({
        ...next,
        ...freshAttempt,
        // Darts already thrown this turn don't count for the next card.
        ignored: s.turnDarts.length,
      });
    }
    case 'placeBet': {
      if (s.phase !== 'bet') return s;
      const { min, max } = betLimits(s);
      const bet = Math.min(max, Math.max(min, Math.round(action.amount)));
      return reevaluate({ ...s, phase: 'attempt', bet, ignored: s.turnDarts.length });
    }
    case 'cancelBet': {
      if (s.phase !== 'attempt' || s.bet === null || s.riding || s.darts.length > 0) return s;
      return { ...applyLedger(s, { coins: {}, pot: 0 }), phase: 'bet', bet: null, doubters: [] };
    }
    case 'toggleCall': {
      if (!canCall(s, action.call)) return s;
      const calls = s.calls.includes(action.call)
        ? s.calls.filter((c) => c !== action.call)
        : [...s.calls, action.call];
      return { ...s, calls };
    }
    case 'toggleDoubt': {
      if (!canDoubt(s, action.playerId)) return s;
      const { playerId } = action;
      const doubters = s.doubters.includes(playerId)
        ? s.doubters.filter((id) => id !== playerId)
        : [...s.doubters, playerId];
      return reevaluate({ ...s, doubters });
    }
    case 'gift': {
      if (!canGift(s, action.from)) return s;
      const cost = giftCost(s);
      const players = s.players.map((p) => (p.id === action.from ? { ...p, score: p.score - cost } : p));
      const next = draw({ ...s, players, pot: s.pot + cost }, 3);
      return next ? { ...next, giftFrom: action.from } : s;
    }
    case 'toggleRide': {
      if (!canRide(s)) return s;
      return { ...s, letItRide: !s.letItRide };
    }
    case 'loan': {
      if (!canLoan(s)) return s;
      const players = s.players.map((p, i) =>
        i === s.active ? { ...p, score: p.score + LOAN.amount, debt: p.debt + LOAN.repay } : p,
      );
      return { ...s, players };
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

type StoredGame = Omit<GameState, 'players' | 'settings'> & {
  players: (Omit<Player, 'debt' | 'ride'> & Partial<Player>)[];
  settings: Partial<GameSettings>;
  /** Points credited to the active player, in games saved before betting mode. */
  awarded?: number;
};

/** Adds the fields of betting mode to a game saved before it existed. */
function upgradeGame(stored: GameState): GameState {
  const g = stored as unknown as StoredGame;
  if (g.applied !== undefined) return stored;
  const { awarded = 0, ...rest } = g;
  const active = g.players[g.active]?.id;
  return {
    ...createGame([], DEFAULT_GAME_SETTINGS),
    ...rest,
    settings: { ...DEFAULT_GAME_SETTINGS, ...g.settings, mode: 'classic', betting: DEFAULT_BETTING_RULES },
    players: g.players.map((p) => ({ debt: 0, ride: null, ...p })),
    applied: active && awarded ? { [active]: awarded } : {},
    golden: [],
  };
}

export function upgradeSession(session: Session): Session {
  if (session.game.applied !== undefined) return session;
  const turnEnds = Object.fromEntries(Object.entries(session.turnEnds).map(([id, g]) => [id, upgradeGame(g)]));
  return { ...session, game: upgradeGame(session.game), turnEnds };
}

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
    let entries = Object.entries({ ...turnEnds, [base.turnId]: base });
    const rewind = entries.findIndex(([id]) => id === turnId);
    if (rewind >= 0) {
      // Autodarts went back to an earlier turn (undo): continue from where that turn was.
      base = entries[rewind]![1];
      // The turns after it are played again, so their saved states no longer apply.
      entries = entries.slice(0, rewind);
    }
    turnEnds = Object.fromEntries(entries.slice(-MAX_TURN_ENDS));
  }
  const game = gameReducer(base, action);
  if (game === session.game && turnEnds === session.turnEnds) return session;
  return { ...session, game, turnEnds };
}
