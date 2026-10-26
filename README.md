# Party Challenges for Autodarts

A browser extension that adds a challenge card party game to [play.autodarts.com](https://play.autodarts.com/play),
for friends playing in front of one board.

**How to play:** on their turn, a player picks a level (Easy = 1 pt, Medium = 2 pts, Hard = 3 pts) and gets a
challenge card such as "Hit the 20 twice". They then throw their turn. If they solve the card, they get the points
and the next player picks a new card. If they fail, the next player tries the same card, and this continues until
someone solves it. A card can also be skipped.

The first player to reach the target score (10 points by default) wins. Without a target score, the game ends with
the Autodarts leg. The winner screen shows how many cards of each level every player solved, and the next leg starts
a new game.

### Betting mode

The game mode is chosen in the lobby banner: **Classic** (above) or **Betting**. In betting mode every player starts
with 100 coins. The player picks a level, sees the card and then bets on it with one tap (at least the minimum bet,
at most half their coins). A solved card pays the bet times the level (×1, ×2, ×3) plus the **pot**. A failed card's
bet goes into the pot, and the card goes to the next player, who bets on it in turn. Most coins after the leg wins,
or the first player to the target coins.

- **Doubters:** before the first dart, the other players can bet that the thrower fails, as much as the thrower bet.
  They win that much if the thrower fails, and pay it to the thrower otherwise.
- **Call your shot:** "in 2 darts" or "no misses" each add 1 to the multiplier. A call can't be made when the card
  can't be solved that way.
- **Gifts:** before the player picks a level, another player can pay twice the minimum bet to force a Hard card on
  them. If they fail it, the gifter gets their bet.
- **Double or nothing:** after a solve, the player can let the card's payout ride on their next card of that level.
- **Bounty on the leader:** when the player in the lead fails, their bet is split among the others.
- **Golden cards** pay double. In the **final round** of the Autodarts match, payouts are doubled and players can go
  all-in.
- **Loan shark:** borrow 50 coins and pay back 75 when the game ends (up to two loans).
- **No stalling:** the minimum bet (10) rises by 5 every 10 rounds. Skipping a card, or ending the turn without
  betting, costs the bet (or the minimum bet) into the pot. A broke player gets the minimum bet from the bank.

The starting coins, the target coins and each of these rules can be changed in the extension settings.

The cards and the interface are available in English and German. The language follows the browser (English for
any other language) and can be changed in the extension settings. The extension's name and description in the
browser and the store are translated too.

## How it fits into Autodarts

1. **`/play`**: a **Party Challenges** tile appears in the *Party* section. Clicking it clicks the *Count Up* tile,
   which creates a normal Autodarts lobby. The extension remembers that lobby (`src/pages/play.ts`).
2. **Lobby**: a banner marks it as a Party Challenges game (`src/pages/lobby.ts`). Players and the board are chosen
   as usual. The number of rounds sets how long a leg, and so a game without a target score, lasts.
3. **Match**: the card game covers the Count Up layout below the Autodarts top bar (`src/components/MatchApp.tsx`),
   with its own scoreboard, the card and the darts of the turn. Autodarts handles turns, darts, corrections and undo;
   the game's *Undo* and *Next player* buttons use Autodarts' keyboard shortcuts (`src/pages/match.ts`). Tapping a dart
   (or *Correct darts*) shows the Autodarts board to correct it; the game comes back when the turn moves on. The card game follows the match state and Count
   Up's own score is ignored.

## Match data

`entrypoints/ws-hook.content.ts` runs in the page and passes on what the page already receives:

- frames of the Autodarts WebSocket, where `channel: "autodarts.matches"` carries the full match state;
- responses of the page's own match API calls, which give the initial state when a match page opens.

`src/throws/autodarts.ts` reads the players and the current turn (`turns[0]`, with its throws) from that state.

Matches only run on the Autodarts server, and send this data, when a board is selected in the lobby. A match without
a board runs locally in the browser (match id `local-…`) and isn't supported.

If the game stays on "Connecting to the match…", turn on *Log Autodarts match messages* in the extension settings.
Then check the browser console on the match page.

## Development

```sh
pnpm install
pnpm dev            # Chrome with the extension loaded
pnpm dev:firefox    # Firefox (128+)
pnpm lint           # Biome (pnpm lint:fix to fix)
pnpm typecheck
pnpm test           # engine, parser and router tests
pnpm zip            # store-ready package (pnpm zip:firefox for Firefox)
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for the commit message convention.

## Layout

- `src/engine/`: pure game logic
  - `rules.ts`: challenge rules
  - `cards.ts`: the deck, with each card's text in every language; edit it to add your own cards
  - `solveRate.ts`: estimates each card's solve chance for a simulated player, used by `balance.test.ts`
  - `game.ts`: card game driven by match snapshots, including following Autodarts' undo
  - `betting.ts`: the rules of betting mode (bets, payouts, pot, doubters, calls, gifts, loans)
- `src/i18n.ts`: interface texts and the language choice
- `src/throws/`: parser for Autodarts match state
- `src/pages/`: page integrations for `/play`, the lobby, the match page and the router
- `src/components/`: React match screen, styled with the Autodarts design tokens
  (`entrypoints/autodarts.content/style.css`)
- `assets/`: icon sources. `icon.svg` is rendered to `public/icon/` at 48, 96 and 128 px, `icon-small.svg` at 16 and
  32 px (e.g. `rsvg-convert -w 128 -h 128 assets/icon.svg -o public/icon/128.png`)

## CI and releases

**Pull requests** run the *CI* workflow: lint, type check and tests, a build of the Chrome package (downloadable from
the run for 7 days), commitlint on every commit, actionlint and [zizmor](https://docs.zizmor.sh/) on the workflows,
and a dependency review. *CI passed* sums up all of them and is the check to require before merging. *CodeQL*
scans the code and the workflows. Dependency review and CodeQL need a public repository and are skipped while it is
private.

**Every push to `main`** runs the *Release* workflow:

1. *CI* runs again on the merged commit.
2. [semantic-release](https://semantic-release.gitbook.io/) reads the conventional commits since the last tag, picks
   the next version and creates the tag and the GitHub release with release notes.
3. *Build* builds the Chrome package of that version, without write access to the repository.
4. *Upload* attaches the package to the release, with signed build provenance once the repository is public. Verify
   a download with `gh attestation verify <file>.zip -R y0x/party-challenges-autodarts`.

If *Build* or *Upload* fails, re-run the failed jobs to attach the package to the existing release.

**Publishing is manual:** run the *Publish* workflow (*Actions → Publish → Run workflow*) with the release version.
It submits that release's package to the Chrome Web Store for review. A new submission replaces a version that is
still in review.

Firefox isn't released yet. The extension builds for it (`pnpm zip:firefox`), and the add-on id in `wxt.config.ts`
stays fixed for a later Firefox Add-ons listing.

### One-time store setup

The first version has to be uploaded by hand so the store creates the listing. Take the package from the latest
GitHub release.

1. Upload `*-chrome.zip` in the [developer dashboard](https://chrome.google.com/webstore/devconsole), fill in the
   listing and submit it. The name and summary come from `public/_locales/`; paste the detailed description for
   each language from `store/description.<lang>.txt`.
2. Create a Google Cloud service account with a JSON key and add its email under *Account → Service accounts* in the
   developer dashboard.
3. Add the secrets `CHROME_SERVICE_ACCOUNT_CLIENT_EMAIL` and `CHROME_SERVICE_ACCOUNT_PRIVATE_KEY` (from the JSON key)
   to the `chrome-web-store` environment.
4. Add the repository variables `CHROME_PUBLISHER_ID` (in the dashboard URL) and `CHROME_EXTENSION_ID`.

## Contributing

Contributions are welcome:

- **Bugs:** open an [issue](https://github.com/y0x/party-challenges-autodarts/issues) with the bug report template.
  Turn on *Log Autodarts match messages* in the settings and add the console output if the game doesn't follow
  the match.
- **New cards:** add them to `src/engine/cards.ts` with a text in every language and a rule from
  `src/engine/rules.ts`. Rules are covered by `src/engine/rules.test.ts`. `src/engine/balance.test.ts` checks that a
  casual player (3-dart average about 38) solves a card in one turn with a chance that fits its level: 40–75% for
  Easy, 18–35% for Medium and 4–18% for Hard.
- **Translations:** add the language to `src/i18n.ts` (texts and `LOCALES`), every card in `src/engine/cards.ts`,
  `public/_locales/` and `store/`.
- **Security issues:** report them privately as described in [SECURITY.md](SECURITY.md), not in a public issue.

See [CONTRIBUTING.md](CONTRIBUTING.md) for the setup, the checks and the commit message convention, and open a pull
request against `main`.

## Privacy

The extension collects no data and sends nothing anywhere. See [PRIVACY.md](PRIVACY.md).

## License

[GPL-3.0](LICENSE)
