# Ridel Chrome Extension

A beautiful new tab page extension for Chrome.

## Building the Extension

Since this extension uses React, you need to build it before loading into Chrome.

### Option 1: Simple Static Version (Ready to Use)

The extension includes a simple static version that works immediately:

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `src/extension` folder
5. Open a new tab to see Ridel!

### Option 2: Build Full React Version

To get the full React experience with all features:

1. Create a separate Vite build config for the extension
2. Build with: `npm run build:extension`
3. Load the `dist/extension` folder in Chrome

## Files

- `manifest.json` - Chrome extension manifest (v3)
- `newtab.html` - New tab page HTML
- `newtab.js` - New tab page JavaScript
- `styles.css` - Styles for the new tab page
- `icons/` - Extension icons (16x16, 48x48, 128x128)

## Features

- Clean, minimal new tab page
- Quick search with Google
- Customizable shortcuts
- Dark/Light theme support
- Trending searches
