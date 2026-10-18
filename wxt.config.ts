import { defineConfig } from 'wxt';

// See https://wxt.dev/api/reference/wxt/interfaces/inlineconfig.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  // MV3 everywhere: the WebSocket hook needs `world: "MAIN"` content scripts (Firefox 128+).
  manifestVersion: 3,
  manifest: {
    name: 'Party Challenges for Autodarts',
    description: 'A challenge card party game for your Autodarts board, right inside play.autodarts.com.',
    permissions: ['storage'],
    browser_specific_settings: {
      gecko: {
        id: 'party-challenges-autodarts@y0x',
        strict_min_version: '128.0',
        // The extension collects no data; AMO requires new add-ons to declare that.
        data_collection_permissions: { required: ['none'] },
      },
    },
  },
});
