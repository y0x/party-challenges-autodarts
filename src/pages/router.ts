export type Route =
  | { name: 'play' }
  | { name: 'lobby'; id: string }
  | { name: 'match'; id: string }
  | { name: 'other' };

export function parseRoute(pathname: string): Route {
  const path = pathname.replace(/\/+$/, '');
  if (path === '/play') return { name: 'play' };
  const lobby = /^\/lobby\/([^/]+)$/.exec(path);
  if (lobby) return { name: 'lobby', id: lobby[1]! };
  const match = /^\/matches\/([^/]+)$/.exec(path);
  if (match) return { name: 'match', id: match[1]! };
  return { name: 'other' };
}

export const sameRoute = (a: Route, b: Route) =>
  a.name === b.name && ('id' in a ? a.id : '') === ('id' in b ? b.id : '');

/**
 * Calls `onChange` whenever the SPA navigates. The router uses the History API, which
 * fires no event for pushState/replaceState, so the URL is polled.
 */
export function watchRoute(onChange: (route: Route, previous: Route | null) => void): () => void {
  let current: Route | null = null;
  const check = () => {
    const route = parseRoute(window.location.pathname);
    if (current && sameRoute(route, current)) return;
    const previous = current;
    current = route;
    onChange(route, previous);
  };
  check();
  const interval = setInterval(check, 250);
  window.addEventListener('popstate', check);
  return () => {
    clearInterval(interval);
    window.removeEventListener('popstate', check);
  };
}

/** Runs `update` (throttled to animation frames) whenever the page's DOM changes. */
export function watchDom(update: () => void): () => void {
  let frame = 0;
  const schedule = () => {
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      update();
    });
  };
  const observer = new MutationObserver(schedule);
  observer.observe(document.body, { childList: true, subtree: true });
  schedule();
  return () => {
    observer.disconnect();
    // An update still pending would add our elements back to the page being left.
    cancelAnimationFrame(frame);
  };
}
