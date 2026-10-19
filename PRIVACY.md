# Privacy policy / Datenschutzerklärung

**Party Challenges for Autodarts** · effective 2026-10-18 · [Deutsch](#deutsch)

## English

Party Challenges for Autodarts does not collect, transmit, sell or share any personal data. It has no servers,
no analytics and no tracking, and it makes no network requests of its own.

### What the extension reads

The extension only runs on `play.autodarts.com` and `play.autodarts.io`. There it reads the match data that the
Autodarts page itself receives: the players of the match, the current turn and the darts thrown. It needs this
data to check the darts against the challenge cards and to keep score.

### What the extension stores

Everything is stored in your browser only:

- **Settings** (language, points to win, discarding cards, logging) are stored with `chrome.storage.sync`. If you use Chrome
  sync, Chrome syncs them between your own devices through your Google account.
- **Game state** (players, scores and played cards of each match) and the ids of the lobbies and matches started
  through the extension are stored with `chrome.storage.local`. Entries older than 7 days are deleted
  automatically the next time you start a game.

Removing the extension deletes all of this data.

If you turn on *Log Autodarts match messages* in the settings, the match messages are also written to your
browser's developer console. They stay on your device.

### Third parties

No data is passed on to anyone. The extension does not load code from other servers.

### Contact

Questions: open an issue at <https://github.com/y0x/party-challenges-autodarts/issues>.

## Deutsch

Party Challenges for Autodarts erhebt, überträgt, verkauft und teilt keine personenbezogenen Daten. Die
Erweiterung hat keine Server, keine Analyse- oder Tracking-Funktionen und stellt selbst keine Netzwerkanfragen.

### Was die Erweiterung liest

Die Erweiterung läuft nur auf `play.autodarts.com` und `play.autodarts.io`. Dort liest sie die Match-Daten, die die
Autodarts-Seite selbst empfängt: die Spieler des Matches, die aktuelle Aufnahme und die geworfenen Darts. Diese
Daten braucht sie, um die Würfe mit den Challenge-Karten abzugleichen und die Punkte zu zählen.

### Was die Erweiterung speichert

Alles wird nur in deinem Browser gespeichert:

- **Einstellungen** (Punkte zum Sieg, Karten verwerfen, Protokollierung) werden mit `chrome.storage.sync`
  gespeichert. Wenn du die Chrome-Synchronisierung nutzt, gleicht Chrome sie über dein Google-Konto zwischen deinen
  eigenen Geräten ab.
- **Spielstand** (Spieler, Punkte und gespielte Karten je Match) sowie die IDs der über die Erweiterung gestarteten
  Lobbys und Matches werden mit `chrome.storage.local` gespeichert. Einträge, die älter als 7 Tage sind, werden beim
  nächsten Spielstart automatisch gelöscht.

Wenn du die Erweiterung entfernst, werden alle diese Daten gelöscht.

Wenn du in den Einstellungen *Log Autodarts match messages* einschaltest, werden die Match-Nachrichten zusätzlich in
die Entwicklerkonsole deines Browsers geschrieben. Sie bleiben auf deinem Gerät.

### Dritte

Es werden keine Daten an Dritte weitergegeben. Die Erweiterung lädt keinen Code von anderen Servern.

### Kontakt

Fragen: Erstelle ein Issue unter <https://github.com/y0x/party-challenges-autodarts/issues>.
