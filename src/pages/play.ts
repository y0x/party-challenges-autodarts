import { watchDom } from './router';

/**
 * The game mode picker on `/play` (GamePickerList in the Autodarts bundle) renders a grid of
 * tiles per game type:
 *   <div class="flex flex-col gap-3 pt-5">                     ← section
 *     <p class="font-display text-2xl ...">Party</p>
 *     <div class="grid grid-cols-1 gap-3 expanded:grid-cols-3">  ← grid
 *       <button class="flex w-full flex-col gap-3 rounded-[12px] ...">
 *         <div …><div …><p class="… font-bold …">Count Up</p></div><pill/></div>
 *         <p class="text-[13px] …">description</p>
 *       </button>
 * We add our tile to the Party grid. Clicking it clicks the Count Up tile, which creates a
 * Count Up lobby; the card game then runs on top of that lobby's match.
 */

const TILE_ATTR = 'data-party-challenges-tile';
/** Count Up is called "Count Up" in every language Autodarts ships. */
const CARRIER_GAME = /^count\s*up$/i;

/** Same classes Autodarts uses for its game tiles, so the tile matches the design. */
const TILE_CLASS =
  'flex w-full flex-col gap-3 rounded-[12px] border border-mono-white/6 px-4 py-5 text-left transition bg-black-85 hover:bg-[image:linear-gradient(rgba(255,255,255,0.05),rgba(255,255,255,0.05))]';
const PILL_FALLBACK_CLASS =
  'flex h-6.25 shrink-0 items-center rounded-full px-2.5 text-[13px] leading-none bg-game-party/20 text-game-party';

interface PartySection {
  grid: HTMLElement;
  pill: HTMLElement | null;
}

function findPartySection(): PartySection | null {
  // Preferred: a Party game tile, recognised by its "text-game-party" pill.
  for (const pill of document.querySelectorAll<HTMLElement>('[class*="text-game-party"]')) {
    if (pill.closest(`[${TILE_ATTR}]`)) continue;
    const grid = pill.closest<HTMLElement>('button, [class*="rounded-[12px]"]')?.parentElement;
    if (grid) return { grid, pill };
  }
  // Fallback (e.g. all party games locked): the section heading.
  for (const heading of document.querySelectorAll<HTMLElement>('p.font-display')) {
    if (!/party/i.test(heading.textContent ?? '')) continue;
    const grid = heading.nextElementSibling;
    if (grid instanceof HTMLElement) return { grid, pill: null };
  }
  return null;
}

function findCarrierTile(): HTMLButtonElement | null {
  for (const button of document.querySelectorAll<HTMLButtonElement>('button')) {
    if (button.hasAttribute(TILE_ATTR)) continue;
    const title = button.querySelector('p');
    if (title && CARRIER_GAME.test(title.textContent?.trim() ?? '')) return button;
  }
  return null;
}

function createTile(pill: HTMLElement | null, onClick: () => void): HTMLElement {
  const tile = document.createElement('button');
  tile.type = 'button';
  tile.className = TILE_CLASS;
  tile.setAttribute(TILE_ATTR, '');

  const header = document.createElement('div');
  header.className = 'flex items-center gap-2';
  const titleWrap = document.createElement('div');
  titleWrap.className = 'flex min-w-0 flex-1 items-center gap-1.5';
  const title = document.createElement('p');
  title.className = 'min-w-0 text-base font-bold leading-[1.2]';
  title.textContent = 'Party Challenges';
  titleWrap.append(title);

  let badge: HTMLElement;
  if (pill) {
    badge = pill.cloneNode(true) as HTMLElement;
  } else {
    badge = document.createElement('span');
    badge.className = PILL_FALLBACK_CLASS;
    badge.textContent = 'Party';
  }
  header.append(titleWrap, badge);

  const description = document.createElement('p');
  description.className = 'text-[13px] font-medium leading-[1.2] text-muted-foreground';
  description.textContent = 'Draw a challenge card and beat it before your friends do.';

  tile.append(header, description);
  tile.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    onClick();
  });
  return tile;
}

/**
 * Keeps our tile in the Party section while on `/play`. `onStart` is called right before
 * the Count Up lobby is created, so the caller can tag the lobby that opens next.
 */
export function watchPlayTile(onStart: () => void): () => void {
  const start = () => {
    const carrier = findCarrierTile();
    if (!carrier || carrier.disabled) {
      alert('Party Challenges needs the "Count Up" game mode, but it is not available on this page.');
      return;
    }
    onStart();
    carrier.click();
  };

  return watchDom(() => {
    const section = findPartySection();
    if (section && !section.grid.querySelector(`[${TILE_ATTR}]`)) {
      section.grid.append(createTile(section.pill, start));
    }
  });
}
