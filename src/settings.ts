import { storage } from '#imports';
import { DEFAULT_GAME_SETTINGS, type GameMode, type GameSettings, type Session } from './engine/game';
import type { Language } from './i18n';

/** Rules for new games; the game mode is chosen per lobby. */
export interface Settings extends Omit<GameSettings, 'mode'> {
  /** Log Autodarts WebSocket and match API messages to the console. */
  debug: boolean;
  /** Language of the cards and the interface. */
  language: Language;
}

const { mode: _, ...DEFAULT_RULES } = DEFAULT_GAME_SETTINGS;

export const DEFAULT_SETTINGS: Settings = { ...DEFAULT_RULES, debug: false, language: 'auto' };

export const settingsItem = storage.defineItem<Settings>('sync:settings-v2', {
  fallback: DEFAULT_SETTINGS,
});

/** Stored settings, with defaults for fields added after they were saved. */
export async function loadSettings(): Promise<Settings> {
  const stored = await settingsItem.getValue();
  return { ...DEFAULT_SETTINGS, ...stored, betting: { ...DEFAULT_SETTINGS.betting, ...stored.betting } };
}

/** Lobbies created through the Party Challenges tile, by id → creation time. */
export const challengeLobbiesItem = storage.defineItem<Record<string, number>>('local:challenge-lobbies', {
  fallback: {},
});

/** Matches started from such a lobby, by id → start time. */
export const challengeMatchesItem = storage.defineItem<Record<string, number>>('local:challenge-matches', {
  fallback: {},
});

/** Game mode chosen for a lobby, and for the matches started from it, by id. */
export const gameModesItem = storage.defineItem<Record<string, GameMode>>('local:game-modes', {
  fallback: {},
});

/** Stores the game mode of a lobby or match, dropping lobbies and matches that were forgotten. */
export async function setGameMode(id: string, mode: GameMode) {
  const [modes, lobbies, matches] = await Promise.all([
    gameModesItem.getValue(),
    challengeLobbiesItem.getValue(),
    challengeMatchesItem.getValue(),
  ]);
  const kept = Object.entries(modes).filter(([key]) => key in lobbies || key in matches);
  await gameModesItem.setValue({ ...Object.fromEntries(kept), [id]: mode });
}

export async function getGameMode(id: string): Promise<GameMode> {
  return (await gameModesItem.getValue())[id] ?? 'classic';
}

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
