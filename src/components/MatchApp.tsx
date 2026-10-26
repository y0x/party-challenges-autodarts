import { useCallback, useEffect, useRef, useState } from 'react';
import { browser } from '#imports';
import { isBetting } from '../engine/betting';
import { getCard } from '../engine/cards';
import { dartLabel } from '../engine/darts';
import {
  applyAction,
  createSession,
  type GameAction,
  type GameSettings,
  type MatchSnapshot,
  type Session,
  targetOf,
  upgradeSession,
} from '../engine/game';
import { messages } from '../i18n';
import type { MatchFeed } from '../matchFeed';
import { gameplayBarHeight } from '../pages/match';
import { getGameMode, loadSettings, saveSession, sessionsItem } from '../settings';
import { GameView } from './GameView';
import { useLocale } from './useLocale';

/** The card game on a match page. It covers the Count Up layout below the Autodarts gameplay bar. */
export function MatchApp({ matchId, feed }: { matchId: string; feed: MatchFeed }) {
  const { session, match, dispatch } = useMatchSession(matchId, feed);
  const locale = useLocale();
  const m = messages(locale);
  /**
   * Shows the Autodarts view underneath, e.g. to correct a dart, until the turn it was opened
   * in moves on.
   */
  const [boardView, setBoardView] = useState<{ turnId: string | null } | null>(null);
  const turnId = match?.turn?.id ?? null;
  const openBoardView = () => setBoardView({ turnId });
  useEffect(() => {
    if (boardView && boardView.turnId !== turnId) setBoardView(null);
  }, [boardView, turnId]);
  const style = { ['--cc-bar-height' as string]: gameplayBarHeight() };
  const game = session?.game;

  if (boardView) {
    const card = game?.card ? getCard(game.card.id) : null;
    return (
      <aside className="cc-root cc-peek" style={style}>
        <div className="cc-peek-info">
          <p className="cc-peek-text">{card ? card.text[locale] : '🎯 Party Challenges'}</p>
          {card && game && (
            <p className="cc-muted cc-small">{game.darts.length > 0 ? game.darts.map(dartLabel).join(' · ') : '–'}</p>
          )}
        </div>
        <button type="button" className="cc-btn cc-btn-primary" onClick={() => setBoardView(null)}>
          {m.backToGame}
        </button>
      </aside>
    );
  }

  return (
    <section className="cc-root cc-stage" style={style}>
      <header className="cc-stage-header">
        <p className="cc-stage-title">🎯 Party Challenges</p>
        {game && targetOf(game) > 0 && (
          <span className="cc-pill">
            {m.firstTo(isBetting(game) ? m.coins(targetOf(game)) : m.points(targetOf(game)))}
          </span>
        )}
        <span className="cc-spacer" />
        <button type="button" className="cc-btn" title={m.boardViewHint} onClick={openBoardView}>
          {m.boardView}
        </button>
        <button
          type="button"
          className="cc-icon"
          title={m.settings}
          onClick={() => void browser.runtime.sendMessage({ type: 'openOptions' })}
        >
          ⚙
        </button>
      </header>
      <div className="cc-stage-body">
        {matchId.startsWith('local-') ? (
          <p className="cc-notice">{m.manualMatch}</p>
        ) : game ? (
          <GameView
            game={game}
            dispatch={dispatch}
            turnDarts={match?.turn?.darts.length ?? 0}
            matchFinished={match?.finished ?? false}
            onCorrect={openBoardView}
            locale={locale}
          />
        ) : (
          <p className="cc-muted">{m.connecting}</p>
        )}
      </div>
    </section>
  );
}

function useMatchSession(matchId: string, feed: MatchFeed) {
  const [session, setSession] = useState<Session | null>(null);
  const [match, setMatch] = useState<MatchSnapshot | undefined>(() => feed.get(matchId));
  const ref = useRef<Session | null>(null);
  /** Rules for a new game; null until storage is loaded. */
  const settings = useRef<GameSettings | null>(null);

  const commit = useCallback((next: Session) => {
    if (next === ref.current) return;
    ref.current = next;
    setSession(next);
    void saveSession(next);
  }, []);

  const onMatch = useCallback(
    (snapshot: MatchSnapshot) => {
      if (snapshot.id !== matchId) return;
      setMatch(snapshot);
      if (!settings.current) return; // applied once storage is loaded
      if (ref.current) commit(applyAction(ref.current, { type: 'match', match: snapshot }));
      else commit(createSession(snapshot, settings.current));
    },
    [matchId, commit],
  );

  useEffect(() => {
    const unsubscribe = feed.subscribe(onMatch);
    void Promise.all([sessionsItem.getValue(), loadSettings(), getGameMode(matchId)]).then(
      ([sessions, rules, mode]) => {
        const saved = sessions[matchId];
        ref.current = saved ? upgradeSession(saved) : null;
        setSession(ref.current);
        settings.current = { ...rules, mode };
        const latest = feed.get(matchId);
        if (latest) onMatch(latest);
      },
    );
    return unsubscribe;
  }, [matchId, feed, onMatch]);

  const dispatch = useCallback(
    (action: GameAction) => {
      if (ref.current) commit(applyAction(ref.current, action));
    },
    [commit],
  );

  return { session, match, dispatch };
}
