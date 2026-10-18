import { watchDom } from './router';

const BANNER_ATTR = 'data-party-challenges-banner';

function createBanner(): HTMLElement {
  const banner = document.createElement('div');
  banner.setAttribute(BANNER_ATTR, '');
  banner.className = 'cc-banner';
  banner.innerHTML = `
    <p class="cc-banner-title">🎯 Party Challenges</p>
    <p class="cc-banner-text">
      Add the players and select your board as usual, then start the game.
      The number of <strong>rounds</strong> is how long you play (50 is a good choice),
      and Count Up's own score does not matter: the cards decide.
    </p>`;
  return banner;
}

/** Shows our banner under the page title of a Party Challenges lobby. */
export function showLobbyBanner(): () => void {
  const stop = watchDom(() => {
    if (document.querySelector(`[${BANNER_ATTR}]`)) return;
    const title = document.querySelector('main h1, main h2') ?? document.querySelector('h1');
    const header = title?.closest('[class*="items-start"]') ?? title?.parentElement;
    header?.after(createBanner());
  });
  return () => {
    stop();
    for (const el of document.querySelectorAll(`[${BANNER_ATTR}]`)) el.remove();
  };
}
