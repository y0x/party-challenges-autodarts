import { useCallback, useEffect, useRef, useState } from 'react';
import { browser } from '#imports';
import { applyAction, createSession, type GameAction, type MatchSnapshot, type Session } from '../engine/game';
import { messages } from '../i18n';
import type { MatchFeed } from '../matchFeed';
import { loadSettings, type Settings, saveSession, sessionsItem } from '../settings';
import { GameView } from './GameView';
import { useLocale } from './useLocale';

const COLLAPSED_KEY = 'party-challenges-collapsed';

function readCollapsed() {
  try {
    return localStorage.getItem(COLLAPSED_KEY) === '1';
  } catch {
    return false;
  }
}

/** The card game panel on a match page. */
export function MatchApp({ matchId, feed }: { matchId: string; feed: MatchFeed }) {
  const { session, match, dispatch } = useMatchSession(matchId, feed);
  const locale = useLocale();
  const m = messages(locale);
  const [collapsed, setCollapsedState] = useState(readCollapsed);
  const setCollapsed = (value: boolean) => {
    setCollapsedState(value);
    try {
      localStorage.setItem(COLLAPSED_KEY, value ? '1' : '0');
    } catch {
      // ignore
    }
  };

  const active = session?.game.players[session.game.active];

  return (
    <aside className={`cc-root cc-panel ${collapsed ? 'cc-panel-collapsed' : ''}`}>
      <header className="cc-panel-header">
        <button
          type="button"
          className="cc-panel-toggle"
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? m.show : m.hide}
        >
          <span className="cc-panel-title">🎯 Party Challenges</span>
          {collapsed && active && <span className="cc-muted cc-small">{active.name}</span>}
        </button>
        <button
          type="button"
          className="cc-icon"
          title={m.settings}
          onClick={() => void browser.runtime.sendMessage({ type: 'openOptions' })}
        >
          ⚙
        </button>
        <button
          type="button"
          className="cc-icon"
          title={collapsed ? m.show : m.hide}
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? '▴' : '▾'}
        </button>
      </header>
      {!collapsed && (
        <div className="cc-panel-body">
          {matchId.startsWith('local-') ? (
            <p className="cc-notice">{m.manualMatch}</p>
          ) : session ? (
            <GameView
              game={session.game}
              dispatch={dispatch}
              turnDarts={match?.turn?.darts.length ?? 0}
              locale={locale}
            />
          ) : (
            <p className="cc-muted">{m.connecting}</p>
          )}
        </div>
      )}
    </aside>
  );
}

function useMatchSession(matchId: string, feed: MatchFeed) {
  const [session, setSession] = useState<Session | null>(null);
  const [match, setMatch] = useState<MatchSnapshot | undefined>(() => feed.get(matchId));
  const ref = useRef<Session | null>(null);
  /** Rules for a new game; null until storage is loaded. */
  const settings = useRef<Settings | null>(null);

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
    void Promise.all([sessionsItem.getValue(), loadSettings()]).then(([sessions, rules]) => {
      ref.current = sessions[matchId] ?? null;
      setSession(ref.current);
      settings.current = rules;
      const latest = feed.get(matchId);
      if (latest) onMatch(latest);
    });
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
