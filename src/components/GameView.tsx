import type { MouseEvent } from 'react';
import {
  betChips,
  betLimits,
  CALLS,
  canCall,
  canDoubt,
  canGift,
  canLoan,
  canRide,
  doubtStakes,
  giftCost,
  isBetting,
  isFinalRound,
  isGolden,
  LOAN,
  lossTarget,
  payoutMultiplier,
} from '../engine/betting';
import { type Card, getCard, LEVEL_COLORS, LEVELS } from '../engine/cards';
import { DARTS_PER_TURN, dartLabel } from '../engine/darts';
import { type GameAction, type GameState, levelStats, targetOf } from '../engine/game';
import { type Locale, type Messages, messages } from '../i18n';
import { pressShortcut, type Shortcut } from '../pages/match';

interface Props {
  game: GameState;
  dispatch: (action: GameAction) => void;
  /** Darts already thrown in the current Autodarts turn. */
  turnDarts: number;
  /** The Autodarts match played all its rounds and only needs to be finished. */
  matchFinished: boolean;
  /** Opens the Autodarts view to correct the darts of the turn. */
  onCorrect: () => void;
  locale: Locale;
}

export function GameView({ game, dispatch, turnDarts, matchFinished, onCorrect, locale }: Props) {
  const m = messages(locale);
  const card = game.card ? getCard(game.card.id) : null;
  const inTurn = game.phase === 'attempt' || game.phase === 'resolved';
  const betting = isBetting(game);
  const press = (shortcut: Shortcut) => (event: MouseEvent<HTMLButtonElement>) => {
    // Autodarts ignores its shortcuts while a button has the focus.
    event.currentTarget.blur();
    pressShortcut(shortcut);
  };
  const canSkip = (inTurn || game.phase === 'bet') && game.outcome !== 'solved';
  const skipCost = game.bet ?? (game.phase === 'bet' ? betLimits(game).min : 0);

  return (
    <div className="cc-game">
      <Scoreboard game={game} m={m} />
      <div className="cc-table">
        <div className="cc-play">
          {betting && game.phase !== 'finished' && <BettingStatus game={game} m={m} />}
          {game.phase === 'finished' && <Finished game={game} m={m} />}
          {game.phase === 'pickLevel' && <PickLevel game={game} dispatch={dispatch} turnDarts={turnDarts} m={m} />}
          {game.phase === 'bet' && card && (
            <Bet game={game} card={card} dispatch={dispatch} turnDarts={turnDarts} locale={locale} m={m} />
          )}
          {inTurn && card && (
            <Attempt game={game} card={card} dispatch={dispatch} onCorrect={onCorrect} locale={locale} m={m} />
          )}
        </div>
        <div className="cc-controls">
          <button type="button" className="cc-btn" onClick={press('undo')}>
            {m.undo}
          </button>
          {canSkip && (
            <button
              type="button"
              className="cc-btn"
              onClick={() => dispatch({ type: 'skipCard' })}
              title={m.skipCardHint}
            >
              {betting && skipCost > 0 ? m.skipCardCost(skipCost) : m.skipCard}
            </button>
          )}
          <button type="button" className="cc-btn cc-btn-primary" onClick={press(matchFinished ? 'finish' : 'next')}>
            {matchFinished ? m.finishMatch : m.next}
          </button>
        </div>
      </div>
    </div>
  );
}

function Scoreboard({ game, m }: { game: GameState; m: Messages }) {
  const target = targetOf(game);
  const betting = isBetting(game);
  return (
    <ol className="cc-scores">
      {game.players.map((p, i) => (
        <li
          key={p.id}
          className={[
            i === game.active && game.phase !== 'finished' ? 'cc-active' : '',
            game.winnerIds.includes(p.id) ? 'cc-winner' : '',
          ].join(' ')}
        >
          <span className="cc-score-name">{p.name}</span>
          <span className="cc-score" title={betting ? m.coins(p.score) : m.points(p.score)}>
            {p.score}
          </span>
          {(p.debt > 0 || p.ride) && (
            <span className="cc-score-extra cc-muted cc-small">
              {[p.ride && `🎲 ${m.riding(m.coins(p.ride.amount))}`, p.debt > 0 && m.debt(m.coins(p.debt))]
                .filter(Boolean)
                .join(' · ')}
            </span>
          )}
          {target > 0 && (
            <span className="cc-progress">
              <span style={{ width: `${Math.max(0, Math.min(100, (p.score / target) * 100))}%` }} />
            </span>
          )}
        </li>
      ))}
    </ol>
  );
}

/** The pot, and the high-roller notice in the final round. */
function BettingStatus({ game, m }: { game: GameState; m: Messages }) {
  const finalRound = game.settings.betting.finalRoundDouble && isFinalRound(game);
  return (
    <div className="cc-status">
      <span className="cc-pill cc-pot" title={m.potHint}>
        🪙 {m.pot(m.coins(game.pot))}
      </span>
      {finalRound && <span className="cc-pill cc-pill-hot">{m.finalRound}</span>}
    </div>
  );
}

function Finished({ game, m }: { game: GameState; m: Messages }) {
  const winners = game.players.filter((p) => game.winnerIds.includes(p.id));
  return (
    <>
      <div className="cc-result cc-result-solved cc-result-big">
        <p className="cc-h1">{m.wins(winners.map((p) => p.name))}</p>
        <p className="cc-small">{m.newGame}</p>
      </div>
      <LevelSummary game={game} m={m} />
    </>
  );
}

function PickLevel({
  game,
  dispatch,
  turnDarts,
  m,
}: Omit<Props, 'matchFinished' | 'onCorrect' | 'locale'> & { m: Messages }) {
  const active = game.players[game.active]!;
  const betting = isBetting(game);
  const gifters = game.players.filter((p) => p.id !== active.id);
  return (
    <>
      <p className="cc-h1">{m.pickLevel(active.name)}</p>
      {game.handout > 0 && <p className="cc-notice">{m.handout(m.coins(game.handout))}</p>}
      {turnDarts > 0 && <p className="cc-notice">{m.dartsBeforeCard}</p>}
      <div className="cc-levels">
        {LEVELS.map((level) => (
          <button
            type="button"
            key={level}
            className="cc-level"
            style={{ ['--cc-level' as string]: LEVEL_COLORS[level] }}
            disabled={game.decks[level].length === 0}
            onClick={() => dispatch({ type: 'pickLevel', level })}
          >
            <span className="cc-level-name">{m.levels[level]}</span>
            <span className="cc-level-points">{betting ? m.multiplier(level) : `+${level}`}</span>
            <span className="cc-muted cc-small">{m.cardsLeft(game.decks[level].length)}</span>
          </button>
        ))}
      </div>
      {betting && game.settings.betting.gifts && gifters.length > 0 && game.decks[3].length > 0 && (
        <div className="cc-section">
          <p className="cc-muted cc-small">{m.giftTitle(active.name, m.coins(giftCost(game)))}</p>
          <div className="cc-chips">
            {gifters.map((p) => (
              <button
                type="button"
                key={p.id}
                className="cc-chip"
                disabled={!canGift(game, p.id)}
                onClick={() => dispatch({ type: 'gift', from: p.id })}
              >
                🎁 {p.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

function CardView({ game, card, locale, m }: { game: GameState; card: Card; locale: Locale; m: Messages }) {
  const golden = isGolden(game);
  const giftFrom = game.players.find((p) => p.id === game.giftFrom);
  return (
    <div
      className={`cc-card ${golden ? 'cc-card-golden' : ''}`}
      style={{ ['--cc-level' as string]: LEVEL_COLORS[card.level] }}
    >
      <div className="cc-card-header">
        <span className="cc-pill cc-pill-level">
          {m.levels[card.level]} · {isBetting(game) ? m.multiplier(card.level) : m.points(card.level)}
        </span>
        {golden && <span className="cc-pill cc-pill-golden">★ {m.golden}</span>}
        {giftFrom && <span className="cc-pill">🎁 {m.giftFrom(giftFrom.name)}</span>}
        <span className="cc-spacer" />
        {game.failsOnCard > 0 && <span className="cc-muted cc-small">{m.attempt(game.failsOnCard + 1)}</span>}
      </div>
      <p className="cc-card-text">{card.text[locale]}</p>
    </div>
  );
}

function Bet({
  game,
  card,
  dispatch,
  turnDarts,
  locale,
  m,
}: {
  game: GameState;
  card: Card;
  dispatch: (action: GameAction) => void;
  turnDarts: number;
  locale: Locale;
  m: Messages;
}) {
  const active = game.players[game.active]!;
  const multiplier = payoutMultiplier(game);
  // Only the calls that fit the card, e.g. no "in 2 darts" on a card that needs three hits.
  const calls = CALLS.filter((call) => canCall(game, call));
  return (
    <>
      <p className="cc-h1">{m.placeBet(active.name)}</p>
      <CardView game={game} card={card} locale={locale} m={m} />
      {game.handout > 0 && <p className="cc-notice">{m.handout(m.coins(game.handout))}</p>}
      {turnDarts > 0 && <p className="cc-notice">{m.dartsBeforeBet}</p>}
      {game.pot > 0 && <p className="cc-notice">{m.potNotice(m.coins(game.pot))}</p>}
      {calls.length > 0 && (
        <div className="cc-chips" title={m.callHint}>
          {calls.map((call) => (
            <button
              type="button"
              key={call}
              className="cc-chip"
              aria-pressed={game.calls.includes(call)}
              onClick={() => dispatch({ type: 'toggleCall', call })}
            >
              {m.calls[call]} +1×
            </button>
          ))}
        </div>
      )}
      <p className="cc-muted cc-small cc-center">{m.pays(multiplier)}</p>
      <div className="cc-bets">
        {betChips(game).map((amount) => (
          <button type="button" key={amount} className="cc-bet" onClick={() => dispatch({ type: 'placeBet', amount })}>
            <span className="cc-bet-amount">{amount === active.score && amount > 0 ? m.allIn : amount}</span>
            <span className="cc-small">{m.winPreview(amount * multiplier)}</span>
          </button>
        ))}
      </div>
      {canLoan(game) && (
        <button type="button" className="cc-link" onClick={() => dispatch({ type: 'loan' })}>
          🦈 {m.loan(LOAN.amount, LOAN.repay)}
        </button>
      )}
    </>
  );
}

function Attempt({
  game,
  card,
  dispatch,
  onCorrect,
  locale,
  m,
}: {
  game: GameState;
  card: Card;
  dispatch: (action: GameAction) => void;
  onCorrect: () => void;
  locale: Locale;
  m: Messages;
}) {
  const active = game.players[game.active]!;
  const previous = game.players[(game.active - 1 + game.players.length) % game.players.length]!;
  const betting = isBetting(game) && game.bet !== null;
  const open = game.outcome === null && game.darts.length === 0;
  return (
    <>
      <p className="cc-h1">{active.name}</p>
      <CardView game={game} card={card} locale={locale} m={m} />
      {game.failsOnCard > 0 && open && !betting && <p className="cc-notice">{m.steal(previous.name, active.name)}</p>}
      {betting && (
        <p className="cc-center cc-stake">
          {game.riding
            ? `🎲 ${m.ridingNotice(m.coins(game.bet!))}`
            : m.stake(m.coins(game.bet!), payoutMultiplier(game))}
          {game.calls.length > 0 && ` · ${game.calls.map((c) => m.calls[c]).join(', ')}`}
          {open && !game.riding && (
            <button type="button" className="cc-link" onClick={() => dispatch({ type: 'cancelBet' })}>
              {m.changeBet}
            </button>
          )}
        </p>
      )}
      {betting && <Doubters game={game} dispatch={dispatch} m={m} />}
      <div className="cc-darts">
        {Array.from({ length: DARTS_PER_TURN }, (_, i) => {
          const dart = game.darts[i];
          return (
            <button
              type="button"
              // biome-ignore lint/suspicious/noArrayIndexKey: one fixed slot per dart of the turn
              key={i}
              className={`cc-dart ${dart ? '' : 'cc-dart-empty'}`}
              title={m.correctDartsHint}
              onClick={onCorrect}
            >
              {dart ? dartLabel(dart) : '–'}
            </button>
          );
        })}
      </div>
      {game.darts.length > 0 && (
        <button type="button" className="cc-link" title={m.correctDartsHint} onClick={onCorrect}>
          ✎ {m.correctDarts}
        </button>
      )}
      {game.outcome === 'solved' && (
        <div className="cc-result cc-result-solved">
          <p className="cc-h2">
            {betting ? m.solvedCoins(m.coins(game.applied[active.id] ?? 0)) : m.solved(m.points(card.level))}
          </p>
          {canRide(game) && (
            <button
              type="button"
              className="cc-chip"
              aria-pressed={game.letItRide}
              onClick={() => dispatch({ type: 'toggleRide' })}
            >
              🎲 {m.letItRide(m.coins(game.bet! * payoutMultiplier(game)), m.levels[card.level])}
            </button>
          )}
        </div>
      )}
      {game.outcome === 'failed' && (
        <div className="cc-result cc-result-failed">
          <p className="cc-h2">{m.failed}</p>
          {betting && <p className="cc-small">{lostText(game, m)}</p>}
          <p className="cc-small">{game.players.length > 1 ? m.nextPlayer : m.newCard}</p>
        </div>
      )}
    </>
  );
}

/** Where the bet of a failed card went, and who won the doubt bet. */
function lostText(game: GameState, m: Messages): string {
  const coins = m.coins(game.bet ?? 0);
  const target = lossTarget(game);
  const name = (id: string) => game.players.find((p) => p.id === id)?.name ?? '';
  const lost =
    target.kind === 'gift'
      ? m.lostToGift(coins, name(target.ids[0]!))
      : target.kind === 'bounty'
        ? m.lostToBounty(coins)
        : m.lostToPot(coins);
  return game.doubters.length > 0 ? `${lost} ${m.doubtersWin(game.doubters.map(name))}` : lost;
}

/** Other players betting that the active player fails, chosen before the first dart. */
function Doubters({ game, dispatch, m }: { game: GameState; dispatch: (action: GameAction) => void; m: Messages }) {
  if (!game.settings.betting.doubters || game.players.length < 2) return null;
  const active = game.players[game.active]!;
  const stakes = doubtStakes(game);
  if (game.darts.length > 0 || game.outcome !== null) {
    if (game.doubters.length === 0) return null;
    const names = game.doubters.map((id) => game.players.find((p) => p.id === id)?.name ?? '');
    return <p className="cc-muted cc-small cc-center">🤨 {m.doubting(names)}</p>;
  }
  return (
    <div className="cc-section">
      <p className="cc-muted cc-small">{m.doubtTitle(active.name)}</p>
      <div className="cc-chips">
        {game.players
          .filter((p) => p.id !== active.id)
          .map((p) => (
            <button
              type="button"
              key={p.id}
              className="cc-chip"
              aria-pressed={game.doubters.includes(p.id)}
              disabled={!canDoubt(game, p.id)}
              onClick={() => dispatch({ type: 'toggleDoubt', playerId: p.id })}
            >
              🤨 {p.name}
              {stakes[p.id] !== undefined && ` (${stakes[p.id]})`}
            </button>
          ))}
      </div>
    </div>
  );
}

/** Cards solved per level by each player, shown once the game is over. */
function LevelSummary({ game, m }: { game: GameState; m: Messages }) {
  const stats = levelStats(game);
  return (
    <table className="cc-summary">
      <thead>
        <tr>
          <th />
          {LEVELS.map((level) => (
            <th key={level} style={{ ['--cc-level' as string]: LEVEL_COLORS[level] }}>
              <span className="cc-pill cc-pill-level">{m.levels[level]}</span>
            </th>
          ))}
          <th className="cc-muted cc-small">{m.summaryTotal}</th>
        </tr>
      </thead>
      <tbody>
        {game.players.map((p) => {
          const levels = stats[p.id]!;
          const solved = LEVELS.reduce((n, l) => n + levels[l].solved, 0);
          const attempts = LEVELS.reduce((n, l) => n + levels[l].attempts, 0);
          return (
            <tr key={p.id}>
              <th className="cc-score-name">{p.name}</th>
              {LEVELS.map((level) => (
                <td key={level} title={m.summaryCell(levels[level].solved, levels[level].attempts)}>
                  <span className="cc-summary-solved">{levels[level].solved}</span>
                  <span className="cc-muted cc-small">/{levels[level].attempts}</span>
                </td>
              ))}
              <td>
                <span className="cc-summary-solved">{solved}</span>
                <span className="cc-muted cc-small">/{attempts}</span>
              </td>
            </tr>
          );
        })}
      </tbody>
      <tfoot>
        <tr>
          <td colSpan={LEVELS.length + 2} className="cc-muted cc-small">
            {m.summaryLegend}
          </td>
        </tr>
      </tfoot>
    </table>
  );
}
