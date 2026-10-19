import { describe, expect, it } from 'vitest';
import { CARDS } from './engine/cards';
import { LOCALES, resolveLocale } from './i18n';

describe('resolveLocale', () => {
  it('uses a fixed language as is', () => {
    expect(resolveLocale('de', ['en-US'])).toBe('de');
    expect(resolveLocale('en', ['de-DE'])).toBe('en');
  });

  it('follows the first supported browser language', () => {
    expect(resolveLocale('auto', ['de-AT', 'en'])).toBe('de');
    expect(resolveLocale('auto', ['fr-FR', 'en-GB', 'de'])).toBe('en');
    expect(resolveLocale(undefined, ['fr', 'DE'])).toBe('de');
  });

  it('falls back to English', () => {
    expect(resolveLocale('auto', ['fr-FR', 'es'])).toBe('en');
    expect(resolveLocale('auto', [])).toBe('en');
  });
});

it('every card has a text in every language', () => {
  for (const card of CARDS) for (const locale of LOCALES) expect(card.text[locale], card.id).toBeTruthy();
});
