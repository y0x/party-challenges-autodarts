export default defineBackground(() => {
  // Content scripts can't open the options page themselves.
  browser.runtime.onMessage.addListener((message: { type?: string }) => {
    if (message?.type === 'openOptions') void browser.runtime.openOptionsPage();
  });
});
