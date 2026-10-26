import type { GameMode } from '../engine/game';
import type { Messages } from '../i18n';
import { watchDom } from './router';

const BANNER_ATTR = 'data-party-challenges-banner';
const MODES: GameMode[] = ['classic', 'betting'];

function createBanner(m: Messages, mode: GameMode, onMode: (mode: GameMode) => void): HTMLElement {
  const banner = document.createElement('div');
  banner.setAttribute(BANNER_ATTR, '');
  banner.className = 'cc-banner';
  banner.innerHTML = `
    <p class="cc-banner-title">🎯 Party Challenges</p>
    <p class="cc-banner-text">${m.lobbyBanner}</p>`;

  const picker = document.createElement('div');
  picker.className = 'cc-modes';
  picker.setAttribute('role', 'group');
  picker.setAttribute('aria-label', m.gameMode);
  const buttons = MODES.map((value) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'cc-mode';
    const name = document.createElement('span');
    name.className = 'cc-mode-name';
    name.textContent = m.modes[value].name;
    const hint = document.createElement('span');
    hint.className = 'cc-mode-hint';
    hint.textContent = m.modes[value].hint;
    button.append(name, hint);
    button.addEventListener('click', () => {
      select(value);
      onMode(value);
    });
    return button;
  });
  const select = (value: GameMode) => {
    for (const [i, b] of buttons.entries()) b.setAttribute('aria-pressed', String(MODES[i] === value));
  };
  select(mode);
  picker.append(...buttons);
  banner.append(picker);
  return banner;
}

/** Shows our banner, with the game mode picker, under the page title of a Party Challenges lobby. */
export function showLobbyBanner(m: Messages, mode: GameMode, onMode: (mode: GameMode) => void): () => void {
  let current = mode;
  const choose = (next: GameMode) => {
    current = next;
    onMode(next);
  };
  const stop = watchDom(() => {
    if (document.querySelector(`[${BANNER_ATTR}]`)) return;
    const banner = () => createBanner(m, current, choose);
    // Older lobby pages had a page heading; the current one starts with section titles
    // (`<p class="font-display text-2xl">` in a row with the game's pill).
    const heading = document.querySelector('main h1, main h2');
    if (heading) {
      (heading.closest('[class*="items-start"]') ?? heading.parentElement)?.after(banner());
      return;
    }
    const section = document.querySelector('main p.font-display');
    if (section?.parentElement) section.parentElement.after(banner());
    else document.querySelector('main')?.prepend(banner());
  });
  return () => {
    stop();
    for (const el of document.querySelectorAll(`[${BANNER_ATTR}]`)) el.remove();
  };
}
