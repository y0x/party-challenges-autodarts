import { useEffect, useState } from 'react';
import { type Locale, resolveLocale } from '../i18n';
import { loadSettings, settingsItem } from '../settings';

/** The display locale, following the language setting as it changes. */
export function useLocale(): Locale {
  const [locale, setLocale] = useState<Locale>(() => resolveLocale('auto'));
  useEffect(() => {
    void loadSettings().then((s) => setLocale(resolveLocale(s.language)));
    return settingsItem.watch((s) => setLocale(resolveLocale(s?.language)));
  }, []);
  return locale;
}
