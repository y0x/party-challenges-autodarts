# CI and releases

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

## One-time store setup

The first version has to be uploaded by hand so the store creates the listing. Take the package from the latest
GitHub release.

1. Upload `*-chrome.zip` in the [developer dashboard](https://chrome.google.com/webstore/devconsole), fill in the
   listing and submit it. The name and summary come from `public/_locales/`; paste the detailed description for
   each language from [`store/description.<lang>.txt`](../store/).
2. Create a Google Cloud service account with a JSON key and add its email under *Account → Service accounts* in the
   developer dashboard.
3. Add the secrets `CHROME_SERVICE_ACCOUNT_CLIENT_EMAIL` and `CHROME_SERVICE_ACCOUNT_PRIVATE_KEY` (from the JSON key)
   to the `chrome-web-store` environment.
4. Add the repository variables `CHROME_PUBLISHER_ID` (in the dashboard URL) and `CHROME_EXTENSION_ID`.
