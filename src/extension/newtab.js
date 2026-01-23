// Ridel New Tab Extension
(function() {
  'use strict';

  // Default shortcuts
  const DEFAULT_SHORTCUTS = [
    { id: '1', name: 'YouTube', url: 'https://youtube.com', favicon: 'https://www.google.com/s2/favicons?domain=youtube.com&sz=64' },
    { id: '2', name: 'Gmail', url: 'https://gmail.com', favicon: 'https://www.google.com/s2/favicons?domain=gmail.com&sz=64' },
    { id: '3', name: 'GitHub', url: 'https://github.com', favicon: 'https://www.google.com/s2/favicons?domain=github.com&sz=64' },
    { id: '4', name: 'Twitter', url: 'https://twitter.com', favicon: 'https://www.google.com/s2/favicons?domain=twitter.com&sz=64' },
    { id: '5', name: 'Reddit', url: 'https://reddit.com', favicon: 'https://www.google.com/s2/favicons?domain=reddit.com&sz=64' },
    { id: '6', name: 'Netflix', url: 'https://netflix.com', favicon: 'https://www.google.com/s2/favicons?domain=netflix.com&sz=64' },
  ];

  // Storage keys
  const SHORTCUTS_KEY = 'ridel-shortcuts';
  const THEME_KEY = 'ridel-theme';

  // Get shortcuts from storage
  function getShortcuts() {
    try {
      const stored = localStorage.getItem(SHORTCUTS_KEY);
      return stored ? JSON.parse(stored) : DEFAULT_SHORTCUTS;
    } catch (e) {
      return DEFAULT_SHORTCUTS;
    }
  }

  // Save shortcuts to storage
  function saveShortcuts(shortcuts) {
    try {
      localStorage.setItem(SHORTCUTS_KEY, JSON.stringify(shortcuts));
    } catch (e) {
      console.error('Failed to save shortcuts:', e);
    }
  }

  // Get theme from storage
  function getTheme() {
    try {
      const stored = localStorage.getItem(THEME_KEY);
      if (stored) return stored;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } catch (e) {
      return 'light';
    }
  }

  // Save theme to storage
  function saveTheme(theme) {
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch (e) {
      console.error('Failed to save theme:', e);
    }
  }

  // Apply theme
  function applyTheme(theme) {
    document.documentElement.style.colorScheme = theme;
    if (theme === 'dark') {
      document.documentElement.style.setProperty('--background', '240 10% 3.9%');
      document.documentElement.style.setProperty('--foreground', '0 0% 98%');
      document.documentElement.style.setProperty('--card', '240 10% 3.9%');
      document.documentElement.style.setProperty('--card-foreground', '0 0% 98%');
      document.documentElement.style.setProperty('--secondary', '240 3.7% 15.9%');
      document.documentElement.style.setProperty('--secondary-foreground', '0 0% 98%');
      document.documentElement.style.setProperty('--muted', '240 3.7% 15.9%');
      document.documentElement.style.setProperty('--muted-foreground', '240 5% 64.9%');
      document.documentElement.style.setProperty('--border', '240 3.7% 15.9%');
      document.documentElement.style.setProperty('--input', '240 3.7% 15.9%');
    } else {
      document.documentElement.style.setProperty('--background', '0 0% 100%');
      document.documentElement.style.setProperty('--foreground', '240 10% 3.9%');
      document.documentElement.style.setProperty('--card', '0 0% 100%');
      document.documentElement.style.setProperty('--card-foreground', '240 10% 3.9%');
      document.documentElement.style.setProperty('--secondary', '240 4.8% 95.9%');
      document.documentElement.style.setProperty('--secondary-foreground', '240 5.9% 10%');
      document.documentElement.style.setProperty('--muted', '240 4.8% 95.9%');
      document.documentElement.style.setProperty('--muted-foreground', '240 3.8% 46.1%');
      document.documentElement.style.setProperty('--border', '240 5.9% 90%');
      document.documentElement.style.setProperty('--input', '240 5.9% 90%');
    }
  }

  // Search SVG icon
  const searchIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>`;

  // Sun icon SVG
  const sunIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>`;

  // Moon icon SVG
  const moonIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>`;

  // Plus icon SVG
  const plusIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>`;

  // Globe icon SVG (fallback)
  const globeIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>`;

  // Render the page
  function render() {
    const root = document.getElementById('root');
    const shortcuts = getShortcuts();
    const theme = getTheme();
    
    applyTheme(theme);

    root.innerHTML = `
      <button class="theme-toggle" id="themeToggle">
        ${theme === 'dark' ? sunIconSVG : moonIconSVG}
      </button>
      
      <div class="container">
        <div class="logo">
          <h1>Ridel</h1>
        </div>
        
        <div class="search-container">
          <form class="search-box" id="searchForm">
            <span class="search-icon">${searchIconSVG}</span>
            <input 
              type="text" 
              class="search-input" 
              id="searchInput"
              placeholder="Search the web..."
              autocomplete="off"
              autofocus
            />
          </form>
        </div>
        
        <div class="shortcuts-grid" id="shortcutsGrid">
          ${shortcuts.slice(0, 8).map(shortcut => `
            <a href="${shortcut.url}" class="shortcut" data-id="${shortcut.id}">
              <div class="shortcut-icon">
                <img src="${shortcut.favicon}" alt="${shortcut.name}" onerror="this.style.display='none'; this.parentElement.innerHTML='${globeIconSVG}';" />
              </div>
              <span class="shortcut-name">${shortcut.name}</span>
            </a>
          `).join('')}
          ${shortcuts.length < 8 ? `
            <button class="shortcut add-shortcut" id="addShortcut">
              <div class="shortcut-icon">
                ${plusIconSVG}
              </div>
              <span class="shortcut-name">Add shortcut</span>
            </button>
          ` : ''}
        </div>
      </div>
    `;

    // Event listeners
    document.getElementById('searchForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const query = document.getElementById('searchInput').value.trim();
      if (query) {
        // Check if it's a URL
        const urlPattern = /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/.*)?$/;
        if (urlPattern.test(query)) {
          window.location.href = query.startsWith('http') ? query : `https://${query}`;
        } else {
          window.location.href = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
        }
      }
    });

    document.getElementById('themeToggle').addEventListener('click', () => {
      const currentTheme = getTheme();
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      saveTheme(newTheme);
      render();
    });

    const addBtn = document.getElementById('addShortcut');
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        const name = prompt('Shortcut name:');
        if (!name) return;
        
        let url = prompt('Shortcut URL:');
        if (!url) return;
        
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
          url = 'https://' + url;
        }

        const newShortcut = {
          id: Date.now().toString(),
          name: name,
          url: url,
          favicon: `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=64`
        };

        const shortcuts = getShortcuts();
        shortcuts.push(newShortcut);
        saveShortcuts(shortcuts);
        render();
      });
    }
  }

  // Initialize
  document.addEventListener('DOMContentLoaded', render);
})();
