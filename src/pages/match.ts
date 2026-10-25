/**
 * The match page (GameView in the Autodarts bundle) has a gameplay bar at the top and, below
 * it, the game mode's layout: score cards, the dartboard and a control bar. We cover that
 * layout with the card game and drive the match through Autodarts' keyboard shortcuts, which
 * it listens for on `window` unless the chat is open or a button or input has the focus.
 */

/** Autodarts' keyboard shortcuts on the match page. */
export const SHORTCUTS = {
  /** Next player, or the next leg once a leg is finished. */
  next: 'Space',
  undo: 'Backspace',
  /** Finishes a match that played all its legs. */
  finish: 'KeyF',
} as const;

export type Shortcut = keyof typeof SHORTCUTS;

const KEYS: Record<string, string> = { Space: ' ', Backspace: 'Backspace', KeyF: 'f' };

export function pressShortcut(shortcut: Shortcut) {
  const code = SHORTCUTS[shortcut];
  window.dispatchEvent(new KeyboardEvent('keydown', { code, key: KEYS[code], bubbles: true }));
}

/** Height of the gameplay bar, which Autodarts sets as a CSS variable on the page layout. */
export function gameplayBarHeight(): string {
  const layout = document.querySelector('[class*="--gameplay-bar-height"]');
  const height = layout && getComputedStyle(layout).getPropertyValue('--gameplay-bar-height').trim();
  return height || '3.75rem';
}
