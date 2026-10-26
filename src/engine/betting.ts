import { getCard } from './cards';
import { ALL_DARTS, DARTS_PER_TURN, type Dart } from './darts';
import type { GameState, Outcome, Player } from './game';
import { evaluate, type Rule, type RuleResult } from './rules';

/**
 * Betting mode: the player sees the card, then bets coins on it. A solved card pays the bet times
 * its multiplier plus the pot; a failed card's bet goes into the pot (or to a gifter, or to the
 * others when the leader fails).
 */

/** Extra conditions a player can call before throwing, each adding 1 to the multiplier. */
export type Call = 'twoDarts' | 'noMiss';
export const CALLS: Call[] = ['twoDarts', 'noMiss'];

export interface BettingRules {
  startingCoins: number;
  /** Coins needed to win; 0 = play until the Autodarts match ends. */
  targetCoins: number;
  /** Other players can bet that the thrower fails. */
  doubters: boolean;
  /** The thrower can call a harder way to solve the card for a higher multiplier. */
  callShot: boolean;
  /** Players can pay to force a Hard card on the player whose turn it is. */
  gifts: boolean;
  /** A winner can let the card's payout ride on their next card. */
  doubleOrNothing: boolean;
  /** When the leader fails, their bet is split among the other players. */
  leaderBounty: boolean;
  /** Some cards are golden and pay double. */
  goldenCards: boolean;
  /** Payouts are doubled in the last round of the Autodarts match. */
  finalRoundDouble: boolean;
  /** Players can borrow coins, which are paid back with interest at the end. */
  loans: boolean;
}

export const DEFAULT_BETTING_RULES: BettingRules = {
  startingCoins: 100,
  targetCoins: 0,
  doubters: true,
  callShot: true,
  gifts: true,
  doubleOrNothing: true,
  leaderBounty: true,
  goldenCards: true,
  finalRoundDouble: true,
  loans: true,
};

export const MIN_BET = 10;
/** The minimum bet rises by this much every MIN_BET_ROUNDS rounds, so nobody can sit on a lead. */
const MIN_BET_STEP = 5;
const MIN_BET_ROUNDS = 10;
export const LOAN = { amount: 50, repay: 75, maxDebt: 150 };
export const GOLDEN_CHANCE = 0.1;

export const isBetting = (s: GameState) => s.settings.mode === 'betting';

/** Coins a player is worth: their coins, plus winnings left riding, minus debt. */
export const netWorth = (p: Player) => p.score + (p.ride?.amount ?? 0) - p.debt;

const activeId = (s: GameState) => s.players[s.active]!.id;

/** Coins a player had before the current attempt. */
export function committed(s: GameState, id: string): number {
  const player = s.players.find((p) => p.id === id);
  return player ? player.score - (s.applied[id] ?? 0) : 0;
}

export const isFinalRound = (s: GameState) => s.round !== null && s.maxRounds !== null && s.round >= s.maxRounds;

export const minBet = (s: GameState) =>
  MIN_BET + MIN_BET_STEP * Math.floor(Math.max(0, (s.round ?? 1) - 1) / MIN_BET_ROUNDS);

export const giftCost = (s: GameState) => 2 * minBet(s);

/** Bets the active player can place: at most half their coins, or everything in the final round. */
export function betLimits(s: GameState): { min: number; max: number } {
  const coins = committed(s, activeId(s));
  const min = Math.min(minBet(s), coins);
  const max = isFinalRound(s) ? coins : Math.max(min, Math.floor(coins / 2));
  return { min, max };
}

/** The bets offered as one-tap chips. */
export function betChips(s: GameState): number[] {
  const { min, max } = betLimits(s);
  const steps = [min, Math.round((min * 2.5) / 5) * 5, min * 5].filter((v) => v < max);
  return [...new Set([...steps, max])];
}

export const isGolden = (s: GameState) => s.card !== null && s.golden.includes(s.card.id);

/** What a solved card pays per coin bet, on top of the bet itself. */
export function payoutMultiplier(s: GameState): number {
  if (!s.card) return 0;
  const base = s.riding ? 1 : s.card.level + s.calls.length;
  const finalRound = s.settings.betting.finalRoundDouble && isFinalRound(s);
  return base * (isGolden(s) ? 2 : 1) * (finalRound ? 2 : 1);
}

const ruleWithCalls = (rule: Rule, calls: Call[]): Rule =>
  calls.includes('noMiss') ? { type: 'all', rules: [rule, { type: 'noMiss' }] } : rule;

/** Evaluates a card with the player's calls: "in 2 darts" ignores the third dart. */
export function evaluateWithCalls(rule: Rule, calls: Call[], darts: Dart[], complete = false): RuleResult {
  const limit = calls.includes('twoDarts') ? 2 : DARTS_PER_TURN;
  const counted = darts.slice(0, limit);
  return evaluate(ruleWithCalls(rule, calls), counted, complete || counted.length >= limit);
}

function solvable(rule: Rule, calls: Call[], darts: Dart[] = []): boolean {
  const result = evaluateWithCalls(rule, calls, darts);
  if (result !== 'pending') return result === 'solved';
  return ALL_DARTS.some((d) => solvable(rule, calls, [...darts, d]));
}

/** Whether some turn solves the card without the call but not with it. */
function makesHarder(rule: Rule, call: Call, darts: Dart[] = []): boolean {
  const done = darts.length >= DARTS_PER_TURN;
  const result = evaluate(rule, darts, done);
  if (result === 'failed') return false;
  if (done) return evaluateWithCalls(rule, [call], darts, true) !== 'solved';
  return ALL_DARTS.some((d) => makesHarder(rule, call, [...darts, d]));
}

const callCache = new Map<string, boolean>();

/**
 * Whether a call fits a card: it can still be solved that way (not "in 2 darts" when it needs three hits),
 * and the call makes it harder (not "no misses" when a miss fails the card anyway).
 */
export function callFits(cardId: string, call: Call): boolean {
  const key = `${cardId}:${call}`;
  let fits = callCache.get(key);
  if (fits === undefined) {
    const rule = getCard(cardId).rule;
    fits = solvable(rule, [call]) && makesHarder(rule, call);
    callCache.set(key, fits);
  }
  return fits;
}

export function canCall(s: GameState, call: Call): boolean {
  if (!s.settings.betting.callShot || s.phase !== 'bet' || s.riding || !s.card) return false;
  return s.calls.includes(call) || callFits(s.card.id, call);
}

export function canDoubt(s: GameState, id: string): boolean {
  return (
    s.settings.betting.doubters &&
    s.phase === 'attempt' &&
    s.bet !== null &&
    s.darts.length === 0 &&
    id !== activeId(s) &&
    (s.doubters.includes(id) || committed(s, id) > 0)
  );
}

/** Each doubter bets as much as the thrower, or all they have. */
export function doubtStakes(s: GameState, stake = s.bet ?? 0): Record<string, number> {
  return Object.fromEntries(s.doubters.map((id) => [id, Math.min(stake, committed(s, id))]));
}

export function canGift(s: GameState, from: string): boolean {
  return (
    s.settings.betting.gifts &&
    s.phase === 'pickLevel' &&
    from !== activeId(s) &&
    s.decks[3].length > 0 &&
    committed(s, from) >= giftCost(s)
  );
}

export function canRide(s: GameState): boolean {
  return (
    s.settings.betting.doubleOrNothing &&
    s.phase === 'resolved' &&
    s.outcome === 'solved' &&
    !s.riding &&
    (s.bet ?? 0) > 0 &&
    s.card !== null &&
    s.decks[s.card.level].length > 0
  );
}

export function canLoan(s: GameState): boolean {
  return s.settings.betting.loans && s.phase === 'bet' && s.players[s.active]!.debt + LOAN.repay <= LOAN.maxDebt;
}

/** Who gets a lost bet: the gifter of the card, the others when the leader lost it, or the pot. */
export function lossTarget(s: GameState): { kind: 'pot' | 'gift' | 'bounty'; ids: string[] } {
  if (s.giftFrom) return { kind: 'gift', ids: [s.giftFrom] };
  if (s.settings.betting.leaderBounty && s.players.length > 1) {
    const worth = s.players.map((p) => netWorth(p) - (s.applied[p.id] ?? 0));
    const best = Math.max(...worth);
    if (worth[s.active] === best && worth.filter((w) => w === best).length === 1) {
      return { kind: 'bounty', ids: s.players.filter((_, i) => i !== s.active).map((p) => p.id) };
    }
  }
  return { kind: 'pot', ids: [] };
}

export interface Ledger {
  /** Coins each player gets (negative: pays) for the attempt. */
  coins: Record<string, number>;
  pot: number;
}

/**
 * Coins moved by the current attempt. While it is open, the bets are held back; a solved card
 * returns the bet with its payout, the pot and the doubters' bets, a failed one pays the doubters.
 */
export function bettingLedger(s: GameState, outcome: Outcome | null, stake: number, withDoubters = true): Ledger {
  const coins: Record<string, number> = {};
  let pot = 0;
  const add = (id: string, n: number) => {
    if (n) coins[id] = (coins[id] ?? 0) + n;
  };
  const active = activeId(s);
  const doubts = Object.entries(withDoubters ? doubtStakes(s, stake) : {});
  // Ridden winnings were taken from the player's coins when they chose to let them ride.
  if (!s.riding) add(active, -stake);
  for (const [id, d] of doubts) add(id, -d);

  if (outcome === 'solved') {
    const potBefore = s.pot - s.potApplied;
    const doubted = doubts.reduce((sum, [, d]) => sum + d, 0);
    add(active, stake + stake * payoutMultiplier(s) + potBefore + doubted);
    pot -= potBefore;
  } else if (outcome === 'failed') {
    for (const [id, d] of doubts) add(id, 2 * d);
    const target = lossTarget(s);
    if (target.kind === 'pot') {
      pot += stake;
    } else {
      const share = Math.floor(stake / target.ids.length);
      for (const id of target.ids) add(id, share);
      pot += stake - share * target.ids.length;
    }
  }
  return { coins, pot };
}
