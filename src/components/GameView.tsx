import type { MouseEvent } from 'react';
import { type Card, getCard, LEVEL_COLORS, LEVELS } from '../engine/cards';
import { DARTS_PER_TURN, dartLabel } from '../engine/darts';
import { type GameAction, type GameState, levelStats } from '../engine/game';
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
  const press = (shortcut: Shortcut) => (event: MouseEvent<HTMLButtonElement>) => {
    // Autodarts ignores its shortcuts while a button has the focus.
    event.currentTarget.blur();
    pressShortcut(shortcut);
  };

  return (
    <div className="cc-game">
      <Scoreboard game={game} m={m} />
      <div className="cc-table">
        <div className="cc-play">
          {game.phase === 'finished' && <Finished game={game} m={m} />}
          {game.phase === 'pickLevel' && <PickLevel game={game} dispatch={dispatch} turnDarts={turnDarts} m={m} />}
          {inTurn && card && <Attempt game={game} card={card} onCorrect={onCorrect} locale={locale} m={m} />}
        </div>
        <div className="cc-controls">
          <button type="button" className="cc-btn" onClick={press('undo')}>
            {m.undo}
          </button>
          {inTurn && game.outcome !== 'solved' && (
            <button
              type="button"
              className="cc-btn"
              onClick={() => dispatch({ type: 'skipCard' })}
              title={m.skipCardHint}
            >
              {m.skipCard}
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
  const target = game.settings.targetScore;
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
          <span className="cc-score" title={m.points(p.score)}>
            {p.score}
          </span>
          {target > 0 && (
            <span className="cc-progress">
              <span style={{ width: `${Math.min(100, (p.score / target) * 100)}%` }} />
            </span>
          )}
        </li>
      ))}
    </ol>
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
  return (
    <>
      <p className="cc-h1">{m.pickLevel(active.name)}</p>
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
            <span className="cc-level-points">+{level}</span>
            <span className="cc-muted cc-small">{m.cardsLeft(game.decks[level].length)}</span>
          </button>
        ))}
      </div>
    </>
  );
}

function Attempt({
  game,
  card,
  onCorrect,
  locale,
  m,
}: {
  game: GameState;
  card: Card;
  onCorrect: () => void;
  locale: Locale;
  m: Messages;
}) {
  const active = game.players[game.active]!;
  const previous = game.players[(game.active - 1 + game.players.length) % game.players.length]!;
  return (
    <>
      <p className="cc-h1">{active.name}</p>
      <div className="cc-card" style={{ ['--cc-level' as string]: LEVEL_COLORS[card.level] }}>
        <div className="cc-card-header">
          <span className="cc-pill cc-pill-level">
            {m.levels[card.level]} · {m.points(card.level)}
          </span>
          {game.failsOnCard > 0 && <span className="cc-muted cc-small">{m.attempt(game.failsOnCard + 1)}</span>}
        </div>
        <p className="cc-card-text">{card.text[locale]}</p>
      </div>
      {game.failsOnCard > 0 && game.outcome === null && game.darts.length === 0 && (
        <p className="cc-notice">{m.steal(previous.name, active.name)}</p>
      )}
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
          <p className="cc-h2">{m.solved(m.points(card.level))}</p>
        </div>
      )}
      {game.outcome === 'failed' && (
        <div className="cc-result cc-result-failed">
          <p className="cc-h2">{m.failed}</p>
          <p className="cc-small">{game.players.length > 1 ? m.nextPlayer : m.newCard}</p>
        </div>
      )}
    </>
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
