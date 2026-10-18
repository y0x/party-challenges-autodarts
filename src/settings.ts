import { storage } from '#imports';
import { DEFAULT_GAME_SETTINGS, type GameSettings, type Session } from './engine/game';

export interface Settings extends GameSettings {
  /** Log Autodarts WebSocket and match API messages to the console. */
  debug: boolean;
}

export const DEFAULT_SETTINGS: Settings = { ...DEFAULT_GAME_SETTINGS, debug: false };

export const settingsItem = storage.defineItem<Settings>('sync:settings-v2', {
  fallback: DEFAULT_SETTINGS,
});

/** Lobbies created through the Party Challenges tile, by id → creation time. */
export const challengeLobbiesItem = storage.defineItem<Record<string, number>>('local:challenge-lobbies', {
  fallback: {},
});

/** Matches started from such a lobby, by id → start time. */
export const challengeMatchesItem = storage.defineItem<Record<string, number>>('local:challenge-matches', {
  fallback: {},
});

/** Card game per match. */
export const sessionsItem = storage.defineItem<Record<string, Session>>('local:sessions-v2', {
  fallback: {},
});

const KEEP_DAYS = 7;

/** Adds `id` to a time-stamped record, dropping entries older than a week. */
export async function remember(item: typeof challengeLobbiesItem, id: string) {
  const now = Date.now();
  const current = await item.getValue();
  const kept = Object.entries(current).filter(([, at]) => now - at < KEEP_DAYS * 86_400_000);
  await item.setValue({ ...Object.fromEntries(kept), [id]: now });
}

export async function saveSession(session: Session) {
  const all = await sessionsItem.getValue();
  const known = await challengeMatchesItem.getValue();
  const kept = Object.entries(all).filter(([id]) => id in known);
  await sessionsItem.setValue({ ...Object.fromEntries(kept), [session.matchId]: session });
}
