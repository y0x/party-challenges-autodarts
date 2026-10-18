import { HOOK_MESSAGE_SOURCE, type HookMessage } from '@/src/throws/autodarts';

/**
 * Runs in the page's own JS world before play.autodarts starts, and forwards to the
 * isolated content script:
 *  - every frame of the Autodarts WebSocket (live match state), and
 *  - JSON responses of Autodarts match API calls the page makes itself (the initial
 *    match state when a match page opens).
 * Nothing is sent anywhere; the extension only reads what the page already receives.
 */
export default defineContentScript({
  matches: ['https://play.autodarts.com/*', 'https://play.autodarts.io/*'],
  world: 'MAIN',
  runAt: 'document_start',
  main() {
    const post = (kind: HookMessage['kind'], url: string, data: string) => {
      const message: HookMessage = { source: HOOK_MESSAGE_SOURCE, kind, url, data };
      window.postMessage(message, window.location.origin);
    };
    const isMatchApi = (url: string) => /autodarts\.[a-z]+\/.*\/matches\//.test(url);

    const NativeWebSocket = window.WebSocket;
    class ObservedWebSocket extends NativeWebSocket {
      constructor(url: string | URL, protocols?: string | string[]) {
        super(url, protocols);
        const source = String(url);
        if (!source.includes('autodarts')) return;
        this.addEventListener('message', (event) => {
          if (typeof event.data === 'string') post('ws', source, event.data);
        });
      }
    }
    window.WebSocket = ObservedWebSocket;

    const nativeFetch = window.fetch;
    window.fetch = async (...args: Parameters<typeof fetch>) => {
      const response = await nativeFetch(...args);
      const url = response.url || String(args[0] instanceof Request ? args[0].url : args[0]);
      if (isMatchApi(url)) {
        response
          .clone()
          .text()
          .then((text) => post('http', url, text))
          .catch(() => {});
      }
      return response;
    };

    const nativeOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function (
      this: XMLHttpRequest,
      method: string,
      url: string | URL,
      ...rest: [boolean?, string?, string?]
    ) {
      const target = String(url);
      if (isMatchApi(target)) {
        this.addEventListener('load', () => {
          if (this.responseType === '' || this.responseType === 'text') post('http', target, this.responseText);
          else if (this.responseType === 'json' && this.response) post('http', target, JSON.stringify(this.response));
        });
      }
      return nativeOpen.call(this, method, url, ...(rest as [boolean, string?, string?]));
    } as typeof XMLHttpRequest.prototype.open;
  },
});
