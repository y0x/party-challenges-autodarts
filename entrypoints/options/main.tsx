import { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import type { BettingRules } from '@/src/engine/betting';
import { type Language, LOCALE_NAMES, LOCALES, messages, resolveLocale } from '@/src/i18n';
import { DEFAULT_SETTINGS, loadSettings, type Settings, settingsItem } from '@/src/settings';
import './style.css';

function Options() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(false);
  const locale = resolveLocale(settings.language);
  const m = messages(locale);

  useEffect(() => {
    void loadSettings().then(setSettings);
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.title = m.optionsTitle;
  }, [locale, m]);

  const setBetting = (rules: Partial<BettingRules>) =>
    setSettings({ ...settings, betting: { ...settings.betting, ...rules } });
  const toggles = Object.keys(m.bettingRuleNames) as (keyof typeof m.bettingRuleNames)[];

  const save = async () => {
    await settingsItem.setValue(settings);
    setSaved(true);
  };

  return (
    <main>
      <h1>🎯 {m.optionsTitle}</h1>

      <h2>{m.general}</h2>
      <label>
        <span>{m.language}</span>
        <select
          value={settings.language}
          onChange={(e) => setSettings({ ...settings, language: e.target.value as Language })}
        >
          <option value="auto">{m.languageAuto}</option>
          {LOCALES.map((l) => (
            <option key={l} value={l}>
              {LOCALE_NAMES[l]}
            </option>
          ))}
        </select>
      </label>

      <h2>{m.rules}</h2>
      <label>
        <span>{m.targetScore}</span>
        <input
          type="number"
          min={0}
          value={settings.targetScore}
          onChange={(e) => setSettings({ ...settings, targetScore: Math.max(0, Number(e.target.value) || 0) })}
        />
      </label>
      <p className="hint">{m.targetScoreHint}</p>
      <label>
        <input
          type="checkbox"
          checked={settings.discardAfterFullRound}
          onChange={(e) => setSettings({ ...settings, discardAfterFullRound: e.target.checked })}
        />
        <span>{m.discardAfterFullRound}</span>
      </label>

      <h2>{m.bettingRules}</h2>
      <p className="hint">{m.bettingRulesHint}</p>
      <label>
        <span>{m.startingCoins}</span>
        <input
          type="number"
          min={10}
          value={settings.betting.startingCoins}
          onChange={(e) => setBetting({ startingCoins: Math.max(10, Number(e.target.value) || 0) })}
        />
      </label>
      <label>
        <span>{m.targetCoins}</span>
        <input
          type="number"
          min={0}
          value={settings.betting.targetCoins}
          onChange={(e) => setBetting({ targetCoins: Math.max(0, Number(e.target.value) || 0) })}
        />
      </label>
      <p className="hint">{m.targetScoreHint}</p>
      {toggles.map((rule) => (
        <label key={rule}>
          <input
            type="checkbox"
            checked={settings.betting[rule]}
            onChange={(e) => setBetting({ [rule]: e.target.checked })}
          />
          <span>{m.bettingRuleNames[rule]}</span>
        </label>
      ))}

      <h2>{m.troubleshooting}</h2>
      <label>
        <input
          type="checkbox"
          checked={settings.debug}
          onChange={(e) => setSettings({ ...settings, debug: e.target.checked })}
        />
        <span>{m.debug}</span>
      </label>

      <p>
        <button type="button" onClick={() => void save()}>
          {m.save}
        </button>
      </p>
      {saved && <p className="message">{m.saved}</p>}
    </main>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(<Options />);
