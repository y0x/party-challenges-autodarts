/** @type {import('@commitlint/types').UserConfig} */
export default {
  extends: ['@commitlint/config-conventional'],
  // Dependabot writes long, generated commit bodies (release notes, links).
  ignores: [(message) => message.includes('Signed-off-by: dependabot[bot]')],
};
