import { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { DEFAULT_SETTINGS, type Settings, settingsItem } from '@/src/settings';
import './style.css';

function Options() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [message, setMessage] = useState('');

  useEffect(() => {
    void settingsItem.getValue().then(setSettings);
  }, []);

  const save = async () => {
    await settingsItem.setValue(settings);
    setMessage('Saved. Rule changes apply to the next game.');
  };

  return (
    <main>
      <h1>🎯 Party Challenges – Settings</h1>

      <h2>Rules</h2>
      <label>
        <span>Points to win</span>
        <input
          type="number"
          min={0}
          value={settings.targetScore}
          onChange={(e) => setSettings({ ...settings, targetScore: Math.max(0, Number(e.target.value) || 0) })}
        />
      </label>
      <p className="hint">0 = no target; the game ends with the Autodarts leg (its number of rounds).</p>
      <label>
        <input
          type="checkbox"
          checked={settings.discardAfterFullRound}
          onChange={(e) => setSettings({ ...settings, discardAfterFullRound: e.target.checked })}
        />
        <span>Discard a card when every player failed it</span>
      </label>

      <h2>Troubleshooting</h2>
      <label>
        <input
          type="checkbox"
          checked={settings.debug}
          onChange={(e) => setSettings({ ...settings, debug: e.target.checked })}
        />
        <span>Log Autodarts match messages to the browser console</span>
      </label>

      <p>
        <button type="button" onClick={() => void save()}>
          Save
        </button>
      </p>
      {message && <p className="message">{message}</p>}
    </main>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(<Options />);
