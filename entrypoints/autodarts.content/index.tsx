import ReactDOM from 'react-dom/client';
import { MatchApp } from '@/src/components/MatchApp';
import { messages, resolveLocale } from '@/src/i18n';
import { MatchFeed } from '@/src/matchFeed';
import { showLobbyBanner } from '@/src/pages/lobby';
import { watchPlayTile } from '@/src/pages/play';
import { type Route, watchRoute } from '@/src/pages/router';
import { challengeLobbiesItem, challengeMatchesItem, loadSettings, remember, settingsItem } from '@/src/settings';
import './style.css';

/** How long after clicking our tile a newly opened lobby counts as ours. */
const START_WINDOW_MS = 30_000;

export default defineContentScript({
  matches: ['https://play.autodarts.com/*', 'https://play.autodarts.io/*'],
  main(ctx) {
    const feed = new MatchFeed();
    void settingsItem.getValue().then((s) => (feed.debug = s.debug));
    const unwatchSettings = settingsItem.watch((s) => (feed.debug = s.debug));

    let startedAt = 0;
    let leavePage: (() => void) | null = null;

    const mountMatch = (matchId: string) => {
      const container = document.createElement('div');
      container.setAttribute('data-party-challenges-root', '');
      document.body.append(container);
      const root = ReactDOM.createRoot(container);
      root.render(<MatchApp matchId={matchId} feed={feed} />);
      return () => {
        root.unmount();
        container.remove();
      };
    };

    const enter = async (route: Route, previous: Route | null) => {
      const m = messages(resolveLocale((await loadSettings()).language));
      if (route.name === 'play') return watchPlayTile(m, () => (startedAt = Date.now()));

      if (route.name === 'lobby') {
        if (previous?.name === 'play' && Date.now() - startedAt < START_WINDOW_MS) {
          startedAt = 0;
          await remember(challengeLobbiesItem, route.id);
        }
        const ours = route.id in (await challengeLobbiesItem.getValue());
        return ours ? showLobbyBanner(m) : null;
      }

      if (route.name === 'match') {
        if (previous?.name === 'lobby' && previous.id in (await challengeLobbiesItem.getValue())) {
          await remember(challengeMatchesItem, route.id);
        }
        const ours = route.id in (await challengeMatchesItem.getValue());
        return ours ? mountMatch(route.id) : null;
      }
      return null;
    };

    // Routes can change while `enter` is still awaiting storage; only the latest one wins.
    let generation = 0;
    const stopRoutes = watchRoute((route, previous) => {
      const current = ++generation;
      leavePage?.();
      leavePage = null;
      void enter(route, previous).then((leave) => {
        if (current === generation) leavePage = leave;
        else leave?.();
      });
    });

    ctx.onInvalidated(() => {
      stopRoutes();
      leavePage?.();
      unwatchSettings();
      feed.dispose();
    });
  },
});
