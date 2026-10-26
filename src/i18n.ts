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

  // Betting mode
  coins: (n: number) => `${n} coin${n === 1 ? '' : 's'}`,
  pot: (coins: string) => `Pot: ${coins}`,
  potHint: 'Lost bets go into the pot. Whoever solves the next card wins it.',
  finalRound: '🔥 High-roller round: payouts are doubled and you can go all-in.',
  multiplier: (n: number) => `×${n}`,
  placeBet: (name: string) => `${name}, place your bet`,
  dartsBeforeBet: "Darts thrown before betting don't count.",
  handout: (coins: string) => `Broke! The bank gives you ${coins}.`,
  potNotice: (coins: string) => `Solve this card to win the pot of ${coins}.`,
  golden: 'Golden ×2',
  giftFrom: (name: string) => `Gift from ${name}`,
  calls: { twoDarts: 'In 2 darts', noMiss: 'No misses' },
  callHint: 'Call your shot: every call adds 1 to the multiplier',
  pays: (n: number) => `A solve pays your bet ×${n}`,
  allIn: 'All-in',
  winPreview: (n: number) => `win +${n}`,
  loan: (amount: number, repay: number) => `Loan shark: take ${amount}, pay back ${repay} at the end`,
  stake: (bet: string, n: number) => `Bet ${bet} · pays ×${n}`,
  ridingNotice: (coins: string) => `Double or nothing: ${coins} riding on this card`,
  changeBet: 'Change bet',
  doubtTitle: (name: string) => `Doubt it? Bet that ${name} fails:`,
  doubting: (names: string[]) => `Doubting: ${names.join(', ')}`,
  solvedCoins: (coins: string) => `Solved! +${coins}`,
  lostToPot: (coins: string) => `${coins} go into the pot.`,
  lostToGift: (coins: string, name: string) => `${coins} go to ${name}, who gave you the card.`,
  lostToBounty: (coins: string) => `Bounty on the leader: ${coins} are split among the others.`,
  doubtersWin: (names: string[]) => `${names.join(' & ')} won the doubt bet.`,
  letItRide: (coins: string, level: string) => `Let it ride: ${coins} on your next ${level} card, double or nothing`,
  giftTitle: (name: string, coins: string) =>
    `Or someone gives ${name} a Hard card for ${coins}, and gets the bet if it's failed:`,
  skipCardCost: (coins: number) => `Skip (−${coins})`,
  debt: (coins: string) => `owes ${coins}`,
  riding: (coins: string) => `${coins} riding`,

  // Play page and lobby
  tileDescription: 'Draw a challenge card and beat it before your friends do.',
  carrierMissing: 'Party Challenges needs the "Count Up" game mode, but it is not available on this page.',
  lobbyBanner:
    "Add the players and select your board as usual, then start the game. The number of <strong>rounds</strong> is how long you play (50 is a good choice), and Count Up's own score does not matter: the cards decide.",
  gameMode: 'Game mode',
  modes: {
    classic: { name: 'Classic', hint: 'Cards are worth 1–3 points.' },
    betting: { name: 'Betting', hint: 'Bet coins on your cards. Lost bets go into the pot.' },
  },

  // Options page
  optionsTitle: 'Party Challenges – Settings',
  general: 'General',
  language: 'Language',
  languageAuto: 'Browser language',
  rules: 'Rules',
  targetScore: 'Points to win',
  targetScoreHint: '0 = no target; the game ends with the Autodarts leg (its number of rounds).',
  discardAfterFullRound: 'Discard a card when every player failed it',
  bettingRules: 'Betting mode',
  bettingRulesHint: 'Choose the game mode in the lobby.',
  startingCoins: 'Starting coins',
  targetCoins: 'Coins to win',
  bettingRuleNames: {
    doubters: 'Doubters: others can bet that the thrower fails',
    callShot: 'Call your shot: "in 2 darts" or "no misses" for a higher multiplier',
    gifts: 'Gifts: pay to force a Hard card on a player',
    doubleOrNothing: 'Double or nothing: let winnings ride on the next card',
    leaderBounty: "Bounty on the leader: the leader's lost bets go to the others",
    goldenCards: 'Golden cards that pay double',
    finalRoundDouble: 'High-roller final round with double payouts',
    loans: 'Loan shark: borrow coins, pay back with interest',
  },
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

  coins: (n: number) => `${n} ${n === 1 ? 'Münze' : 'Münzen'}`,
  pot: (coins: string) => `Pott: ${coins}`,
  potHint: 'Verlorene Einsätze kommen in den Pott. Wer die nächste Karte schafft, gewinnt ihn.',
  finalRound: '🔥 High-Roller-Runde: Gewinne zählen doppelt und du kannst alles setzen.',
  multiplier: (n: number) => `×${n}`,
  placeBet: (name: string) => `${name}, setz deinen Einsatz`,
  dartsBeforeBet: 'Darts, die vor dem Einsatz geworfen werden, zählen nicht.',
  handout: (coins: string) => `Pleite! Die Bank gibt dir ${coins}.`,
  potNotice: (coins: string) => `Schaff diese Karte und gewinn den Pott von ${coins}.`,
  golden: 'Gold ×2',
  giftFrom: (name: string) => `Geschenk von ${name}`,
  calls: { twoDarts: 'Mit 2 Darts', noMiss: 'Ohne Fehlwurf' },
  callHint: 'Sag deinen Wurf an: Jede Ansage erhöht den Multiplikator um 1',
  pays: (n: number) => `Geschafft zahlt deinen Einsatz ×${n}`,
  allIn: 'All-in',
  winPreview: (n: number) => `Gewinn +${n}`,
  loan: (amount: number, repay: number) => `Kredithai: ${amount} leihen, am Ende ${repay} zurückzahlen`,
  stake: (bet: string, n: number) => `Einsatz ${bet} · zahlt ×${n}`,
  ridingNotice: (coins: string) => `Doppelt oder nichts: ${coins} stehen auf dieser Karte`,
  changeBet: 'Einsatz ändern',
  doubtTitle: (name: string) => `Zweifel? Wette, dass ${name} es nicht schafft:`,
  doubting: (names: string[]) => `Zweifler: ${names.join(', ')}`,
  solvedCoins: (coins: string) => `Geschafft! +${coins}`,
  lostToPot: (coins: string) => `${coins} kommen in den Pott.`,
  lostToGift: (coins: string, name: string) => `${coins} gehen an ${name}: Die Karte war ein Geschenk.`,
  lostToBounty: (coins: string) => `Kopfgeld auf die Spitze: ${coins} werden unter den anderen aufgeteilt.`,
  doubtersWin: (names: string[]) =>
    `${names.join(' & ')} ${names.length === 1 ? 'gewinnt' : 'gewinnen'} die Zweifel-Wette.`,
  letItRide: (coins: string, level: string) =>
    `Stehen lassen: ${coins} auf deine nächste Karte (${level}), doppelt oder nichts`,
  giftTitle: (name: string, coins: string) =>
    `Oder jemand schenkt ${name} für ${coins} eine schwere Karte und bekommt den Einsatz, wenn sie nicht geschafft wird:`,
  skipCardCost: (coins: number) => `Überspringen (−${coins})`,
  debt: (coins: string) => `schuldet ${coins}`,
  riding: (coins: string) => `${coins} stehen`,

  tileDescription: 'Zieh eine Challenge-Karte und schaffe sie vor deinen Freunden.',
  carrierMissing: 'Party Challenges braucht den Spielmodus „Count Up“, aber er ist auf dieser Seite nicht verfügbar.',
  lobbyBanner:
    'Füge die Spieler hinzu und wähle wie gewohnt dein Board aus, dann starte das Spiel. Die Anzahl der <strong>Runden</strong> bestimmt, wie lange ihr spielt (50 ist eine gute Wahl). Der Punktestand von Count Up selbst spielt keine Rolle: Die Karten entscheiden.',
  gameMode: 'Spielmodus',
  modes: {
    classic: { name: 'Klassisch', hint: 'Karten bringen 1–3 Punkte.' },
    betting: { name: 'Wetten', hint: 'Setz Münzen auf deine Karten. Verlorene Einsätze kommen in den Pott.' },
  },

  optionsTitle: 'Party Challenges – Einstellungen',
  general: 'Allgemein',
  language: 'Sprache',
  languageAuto: 'Browsersprache',
  rules: 'Regeln',
  targetScore: 'Punkte zum Sieg',
  targetScoreHint: '0 = kein Ziel; das Spiel endet mit dem Autodarts-Leg (nach dessen Rundenzahl).',
  discardAfterFullRound: 'Karte ablegen, wenn alle Spieler sie verfehlt haben',
  bettingRules: 'Wettmodus',
  bettingRulesHint: 'Den Spielmodus wählst du in der Lobby.',
  startingCoins: 'Startmünzen',
  targetCoins: 'Münzen zum Sieg',
  bettingRuleNames: {
    doubters: 'Zweifler: Andere können wetten, dass der Werfer scheitert',
    callShot: 'Ansagen: „mit 2 Darts“ oder „ohne Fehlwurf“ für einen höheren Multiplikator',
    gifts: 'Geschenke: Zahlen, um einem Spieler eine schwere Karte zu geben',
    doubleOrNothing: 'Doppelt oder nichts: Gewinne auf die nächste Karte stehen lassen',
    leaderBounty: 'Kopfgeld auf die Spitze: Verlorene Einsätze der Führung gehen an die anderen',
    goldenCards: 'Goldene Karten, die doppelt zahlen',
    finalRoundDouble: 'High-Roller-Schlussrunde mit doppelten Gewinnen',
    loans: 'Kredithai: Münzen leihen und mit Zinsen zurückzahlen',
  },
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
