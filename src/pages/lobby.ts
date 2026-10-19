import type { Messages } from '../i18n';
import { watchDom } from './router';

const BANNER_ATTR = 'data-party-challenges-banner';

function createBanner(m: Messages): HTMLElement {
  const banner = document.createElement('div');
  banner.setAttribute(BANNER_ATTR, '');
  banner.className = 'cc-banner';
  banner.innerHTML = `
    <p class="cc-banner-title">🎯 Party Challenges</p>
    <p class="cc-banner-text">${m.lobbyBanner}</p>`;
  return banner;
}

/** Shows our banner under the page title of a Party Challenges lobby. */
export function showLobbyBanner(m: Messages): () => void {
  const stop = watchDom(() => {
    if (document.querySelector(`[${BANNER_ATTR}]`)) return;
    const title = document.querySelector('main h1, main h2') ?? document.querySelector('h1');
    const header = title?.closest('[class*="items-start"]') ?? title?.parentElement;
    header?.after(createBanner(m));
  });
  return () => {
    stop();
    for (const el of document.querySelectorAll(`[${BANNER_ATTR}]`)) el.remove();
  };
}
