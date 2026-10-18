# Party Challenges for Autodarts

A browser extension that adds a challenge card party game to [play.autodarts.com](https://play.autodarts.com/play),
for friends playing in front of one board.

**How to play:** on their turn, a player picks a level (Easy = 1 pt, Medium = 2 pts, Hard = 3 pts) and gets a
challenge card such as "Score 100 or more". They then throw their turn. If they solve the card, they get the points
and the next player picks a new card. If they fail, the next player tries the same card, and this continues until
someone solves it. A card can also be skipped.

The first player to reach the target score (10 points by default) wins. Without a target score, the game ends with
the Autodarts leg. The winner screen shows how many cards of each level every player solved, and the next leg starts
a new game.

## How it fits into Autodarts

1. **`/play`**: a **Party Challenges** tile appears in the *Party* section. Clicking it clicks the *Count Up* tile,
   which creates a normal Autodarts lobby. The extension remembers that lobby (`src/pages/play.ts`).
2. **Lobby**: a banner marks it as a Party Challenges game (`src/pages/lobby.ts`). Players and the board are chosen
   as usual. The number of rounds sets how long a leg, and so a game without a target score, lasts.
3. **Match**: a Party Challenges panel appears (`src/components/MatchApp.tsx`). Autodarts handles turns, darts,
   corrections and undo. The card game follows the match state and Count Up's own score is ignored.

## Match data

`entrypoints/ws-hook.content.ts` runs in the page and passes on what the page already receives:

- frames of the Autodarts WebSocket, where `channel: "autodarts.matches"` carries the full match state;
- responses of the page's own match API calls, which give the initial state when a match page opens.

`src/throws/autodarts.ts` reads the players and the current turn (`turns[0]`, with its throws) from that state.

Matches only run on the Autodarts server, and send this data, when a board is selected in the lobby. A match without
a board runs locally in the browser (match id `local-…`) and isn't supported.

If the panel stays on "Connecting to the match…", turn on *Log Autodarts match messages* in the extension settings.
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
  - `cards.ts`: the deck; edit it to add your own cards
  - `game.ts`: card game driven by match snapshots, including following Autodarts' undo
- `src/throws/`: parser for Autodarts match state
- `src/pages/`: page integrations for `/play`, the lobby and the router
- `src/components/`: React match panel, styled with the Autodarts design tokens
  (`entrypoints/autodarts.content/style.css`)

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
   listing and submit it.
2. Create a Google Cloud service account with a JSON key and add its email under *Account → Service accounts* in the
   developer dashboard.
3. Add the secrets `CHROME_SERVICE_ACCOUNT_CLIENT_EMAIL` and `CHROME_SERVICE_ACCOUNT_PRIVATE_KEY` (from the JSON key)
   to the `chrome-web-store` environment.
4. Add the repository variables `CHROME_PUBLISHER_ID` (in the dashboard URL) and `CHROME_EXTENSION_ID`.

## License

[GPL-3.0](LICENSE)
