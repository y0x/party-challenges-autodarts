import { getCard, LEVEL_INFO, LEVELS } from '../engine/cards';
import { DARTS_PER_TURN, dartLabel } from '../engine/darts';
import { type GameAction, type GameState, levelStats } from '../engine/game';

interface Props {
  game: GameState;
  dispatch: (action: GameAction) => void;
  /** Darts already thrown in the current Autodarts turn. */
  turnDarts: number;
}

const points = (n: number) => `${n} pt${n === 1 ? '' : 's'}`;

export function GameView({ game, dispatch, turnDarts }: Props) {
  const active = game.players[game.active]!;
  const previous = game.players[(game.active - 1 + game.players.length) % game.players.length]!;
  const card = game.card ? getCard(game.card.id) : null;
  const inTurn = game.phase === 'attempt' || game.phase === 'resolved';
  const winners = game.players.filter((p) => game.winnerIds.includes(p.id));

  return (
    <div className="cc-game">
      <ul className="cc-scores">
        {game.players.map((p, i) => (
          <li
            key={p.id}
            className={[
              i === game.active && game.phase !== 'finished' ? 'cc-active' : '',
              game.winnerIds.includes(p.id) ? 'cc-winner' : '',
            ].join(' ')}
          >
            <span className="cc-score-name">{p.name}</span>
            <span className="cc-score">{p.score}</span>
          </li>
        ))}
      </ul>
      {game.settings.targetScore > 0 && (
        <p className="cc-muted cc-small">First to {points(game.settings.targetScore)} wins</p>
      )}

      {game.phase === 'finished' && (
        <div className="cc-result cc-result-solved">
          <p className="cc-h2">🏆 {winners.map((p) => p.name).join(' & ')} wins!</p>
          <p className="cc-small">Start a new game from Party → Party Challenges.</p>
        </div>
      )}
      {game.phase === 'finished' && <LevelSummary game={game} />}

      {game.phase === 'pickLevel' && (
        <>
          <p className="cc-h2">{active.name}, pick a level</p>
          {turnDarts > 0 && <p className="cc-notice">Darts thrown before picking a card don't count.</p>}
          <div className="cc-levels">
            {LEVELS.map((level) => (
              <button
                type="button"
                key={level}
                className="cc-tile cc-level"
                style={{ ['--cc-level' as string]: LEVEL_INFO[level].color }}
                disabled={game.decks[level].length === 0}
                onClick={() => dispatch({ type: 'pickLevel', level })}
              >
                <span className="cc-tile-title">{LEVEL_INFO[level].name}</span>
                <span className="cc-pill cc-pill-level">{points(level)}</span>
                <span className="cc-muted cc-small">{game.decks[level].length} left</span>
              </button>
            ))}
          </div>
        </>
      )}

      {inTurn && card && (
        <>
          <div className="cc-card" style={{ ['--cc-level' as string]: LEVEL_INFO[card.level].color }}>
            <div className="cc-tile-header">
              <span className="cc-pill cc-pill-level">
                {LEVEL_INFO[card.level].name} · {points(card.level)}
              </span>
              {game.failsOnCard > 0 && <span className="cc-muted cc-small">Attempt {game.failsOnCard + 1}</span>}
            </div>
            <p className="cc-card-text">{card.text}</p>
          </div>

          <p className="cc-h2">{active.name}</p>
          {game.failsOnCard > 0 && game.outcome === null && game.darts.length === 0 && (
            <p className="cc-notice">
              {previous.name} missed this card — {active.name} can steal it now.
            </p>
          )}
          <div className="cc-darts">
            {Array.from({ length: DARTS_PER_TURN }, (_, i) => {
              const dart = game.darts[i];
              return (
                // biome-ignore lint/suspicious/noArrayIndexKey: one fixed slot per dart of the turn
                <span key={i} className={`cc-dart ${dart ? '' : 'cc-dart-empty'}`}>
                  {dart ? dartLabel(dart) : '–'}
                </span>
              );
            })}
          </div>

          {game.outcome === 'solved' && (
            <div className="cc-result cc-result-solved">
              <p className="cc-h2">Solved! +{points(card.level)}</p>
            </div>
          )}
          {game.outcome === 'failed' && (
            <div className="cc-result cc-result-failed">
              <p className="cc-h2">Not this time</p>
              <p className="cc-small">
                {game.players.length > 1
                  ? 'Pull the darts out: the next player tries this card.'
                  : 'Pull the darts out for a new card.'}
              </p>
            </div>
          )}

          <div className="cc-row">
            {game.outcome !== 'solved' && (
              <button
                type="button"
                className="cc-btn"
                onClick={() => dispatch({ type: 'skipCard' })}
                title="Put this card aside and pick a new one"
              >
                Skip card
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/** Cards solved per level by each player, shown once the game is over. */
function LevelSummary({ game }: { game: GameState }) {
  const stats = levelStats(game);
  return (
    <table className="cc-summary">
      <thead>
        <tr>
          <th />
          {LEVELS.map((level) => (
            <th key={level} style={{ ['--cc-level' as string]: LEVEL_INFO[level].color }}>
              <span className="cc-pill cc-pill-level">{LEVEL_INFO[level].name}</span>
            </th>
          ))}
          <th className="cc-muted cc-small">Total</th>
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
                <td key={level} title={`${levels[level].solved} of ${levels[level].attempts} attempts solved`}>
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
            Cards solved / attempted
          </td>
        </tr>
      </tfoot>
    </table>
  );
}
