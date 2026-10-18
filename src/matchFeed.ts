import type { MatchSnapshot } from './engine/game';
import { HOOK_MESSAGE_SOURCE, type HookMessage, parseHookMessage } from './throws/autodarts';

type Listener = (match: MatchSnapshot) => void;

/**
 * Collects match states from the page hook from the moment the page loads, so the
 * latest state is available even before the match view mounts.
 */
export class MatchFeed {
  private latest = new Map<string, MatchSnapshot>();
  private listeners = new Set<Listener>();
  debug = false;

  constructor() {
    window.addEventListener('message', this.onMessage);
  }

  private onMessage = (event: MessageEvent<HookMessage>) => {
    if (event.source !== window || event.data?.source !== HOOK_MESSAGE_SOURCE) return;
    if (this.debug) console.debug(`[Party Challenges] ${event.data.kind}`, event.data.url, event.data.data);
    const match = parseHookMessage(event.data);
    if (!match) return;
    this.latest.set(match.id, match);
    for (const listener of this.listeners) listener(match);
  };

  get(matchId: string) {
    return this.latest.get(matchId);
  }

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  dispose() {
    window.removeEventListener('message', this.onMessage);
    this.listeners.clear();
  }
}
