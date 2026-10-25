export type Locale = 'en' | 'de';
export const LOCALES: Locale[] = ['en', 'de'];

/** The language setting: a fixed locale, or `auto` to follow the browser. */
export type Language = 'auto' | Locale;

/** Picks the first browser language we support, falling back to English. */
export function resolveLocale(language: Language | undefined, preferred: readonly string[] = navigator.languages) {
  if (language && language !== 'auto') return language;
  for (const tag of preferred) {
    const base = tag.toLowerCase().split('-')[0] as Locale;
    if (LOCALES.includes(base)) return base;
  }
  return 'en';
}

const en = {
  levels: { 1: 'Easy', 2: 'Medium', 3: 'Hard' },
  points: (n: number) => `${n} pt${n === 1 ? '' : 's'}`,

  // Match page
  settings: 'Settings',
  boardView: 'Autodarts view',
  boardViewHint: 'Show the Autodarts board, e.g. to correct a dart',
  backToGame: 'Back to the game',
  correctDarts: 'Correct darts',
  correctDartsHint: 'Open the Autodarts board to correct a wrongly detected dart',
  undo: 'Undo',
  next: 'Next player',
  finishMatch: 'Finish match',
  manualMatch:
    'This match is scored manually. Party Challenges needs your Autodarts board: select it for the players in the lobby.',
  connecting: 'Connecting to the match…',
  firstTo: (points: string) => `First to ${points} wins`,
  wins: (names: string[]) => `🏆 ${names.join(' & ')} ${names.length === 1 ? 'wins' : 'win'}!`,
  newGame: 'Start a new game from Party → Party Challenges.',
  pickLevel: (name: string) => `${name}, pick a level`,
  dartsBeforeCard: "Darts thrown before picking a card don't count.",
  cardsLeft: (n: number) => `${n} left`,
  attempt: (n: number) => `Attempt ${n}`,
  steal: (previous: string, active: string) => `${previous} missed this card — ${active} can steal it now.`,
  solved: (points: string) => `Solved! +${points}`,
  failed: 'Not this time',
  nextPlayer: 'Pull the darts out: the next player tries this card.',
  newCard: 'Pull the darts out for a new card.',
  skipCard: 'Skip card',
  skipCardHint: 'Put this card aside and pick a new one',
  summaryTotal: 'Total',
  summaryCell: (solved: number, attempts: number) => `${solved} of ${attempts} attempts solved`,
  summaryLegend: 'Cards solved / attempted',

  // Play page and lobby
  tileDescription: 'Draw a challenge card and beat it before your friends do.',
  carrierMissing: 'Party Challenges needs the "Count Up" game mode, but it is not available on this page.',
  lobbyBanner:
    "Add the players and select your board as usual, then start the game. The number of <strong>rounds</strong> is how long you play (50 is a good choice), and Count Up's own score does not matter: the cards decide.",

  // Options page
  optionsTitle: 'Party Challenges – Settings',
  general: 'General',
  language: 'Language',
  languageAuto: 'Browser language',
  rules: 'Rules',
  targetScore: 'Points to win',
  targetScoreHint: '0 = no target; the game ends with the Autodarts leg (its number of rounds).',
  discardAfterFullRound: 'Discard a card when every player failed it',
  troubleshooting: 'Troubleshooting',
  debug: 'Log Autodarts match messages to the browser console',
  save: 'Save',
  saved: 'Saved. Rule changes apply to the next game.',
};

export type Messages = typeof en;

const de: Messages = {
  levels: { 1: 'Leicht', 2: 'Mittel', 3: 'Schwer' },
  points: (n: number) => `${n} ${n === 1 ? 'Punkt' : 'Punkte'}`,

  settings: 'Einstellungen',
  boardView: 'Autodarts-Ansicht',
  boardViewHint: 'Das Autodarts-Board anzeigen, z. B. um einen Dart zu korrigieren',
  backToGame: 'Zurück zum Spiel',
  correctDarts: 'Darts korrigieren',
  correctDartsHint: 'Das Autodarts-Board öffnen, um einen falsch erkannten Dart zu korrigieren',
  undo: 'Rückgängig',
  next: 'Nächster Spieler',
  finishMatch: 'Spiel beenden',
  manualMatch:
    'Dieses Spiel wird manuell gezählt. Party Challenges braucht dein Autodarts-Board: Wähle es in der Lobby für die Spieler aus.',
  connecting: 'Verbinde mit dem Spiel…',
  firstTo: (points: string) => `Wer zuerst ${points} hat, gewinnt`,
  wins: (names: string[]) => `🏆 ${names.join(' & ')} ${names.length === 1 ? 'gewinnt' : 'gewinnen'}!`,
  newGame: 'Starte ein neues Spiel über Party → Party Challenges.',
  pickLevel: (name: string) => `${name}, wähle eine Stufe`,
  dartsBeforeCard: 'Darts, die vor der Kartenwahl geworfen werden, zählen nicht.',
  cardsLeft: (n: number) => `${n} übrig`,
  attempt: (n: number) => `Versuch ${n}`,
  steal: (previous: string, active: string) =>
    `${previous} hat diese Karte verfehlt — ${active} kann sie jetzt klauen.`,
  solved: (points: string) => `Geschafft! +${points}`,
  failed: 'Diesmal nicht',
  nextPlayer: 'Zieh die Darts raus: Der nächste Spieler versucht diese Karte.',
  newCard: 'Zieh die Darts raus für eine neue Karte.',
  skipCard: 'Karte überspringen',
  skipCardHint: 'Diese Karte beiseitelegen und eine neue ziehen',
  summaryTotal: 'Gesamt',
  summaryCell: (solved: number, attempts: number) => `${solved} von ${attempts} Versuchen geschafft`,
  summaryLegend: 'Karten geschafft / versucht',

  tileDescription: 'Zieh eine Challenge-Karte und schaffe sie vor deinen Freunden.',
  carrierMissing: 'Party Challenges braucht den Spielmodus „Count Up“, aber er ist auf dieser Seite nicht verfügbar.',
  lobbyBanner:
    'Füge die Spieler hinzu und wähle wie gewohnt dein Board aus, dann starte das Spiel. Die Anzahl der <strong>Runden</strong> bestimmt, wie lange ihr spielt (50 ist eine gute Wahl). Der Punktestand von Count Up selbst spielt keine Rolle: Die Karten entscheiden.',

  optionsTitle: 'Party Challenges – Einstellungen',
  general: 'Allgemein',
  language: 'Sprache',
  languageAuto: 'Browsersprache',
  rules: 'Regeln',
  targetScore: 'Punkte zum Sieg',
  targetScoreHint: '0 = kein Ziel; das Spiel endet mit dem Autodarts-Leg (nach dessen Rundenzahl).',
  discardAfterFullRound: 'Karte ablegen, wenn alle Spieler sie verfehlt haben',
  troubleshooting: 'Fehlersuche',
  debug: 'Autodarts-Spielnachrichten in der Browserkonsole protokollieren',
  save: 'Speichern',
  saved: 'Gespeichert. Regeländerungen gelten ab dem nächsten Spiel.',
};

const MESSAGES: Record<Locale, Messages> = { en, de };

export function messages(locale: Locale): Messages {
  return MESSAGES[locale];
}

/** Each language's name in that language, for the language picker. */
export const LOCALE_NAMES: Record<Locale, string> = { en: 'English', de: 'Deutsch' };
