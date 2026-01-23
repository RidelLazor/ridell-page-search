// RidelL New Tab Extension - Enhanced Version
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

  // Google Apps
  const GOOGLE_APPS = [
    { name: 'YouTube', icon: 'https://www.gstatic.com/images/branding/product/1x/youtube_64dp.png', url: 'https://youtube.com' },
    { name: 'Gemini', icon: 'https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg', url: 'https://gemini.google.com' },
    { name: 'Maps', icon: 'https://www.gstatic.com/images/branding/product/1x/maps_64dp.png', url: 'https://maps.google.com' },
    { name: 'Search', icon: 'https://www.gstatic.com/images/branding/product/1x/googleg_64dp.png', url: 'https://google.com' },
    { name: 'Calendar', icon: 'https://www.gstatic.com/images/branding/product/1x/calendar_64dp.png', url: 'https://calendar.google.com' },
    { name: 'News', icon: 'https://www.gstatic.com/images/branding/product/1x/news_64dp.png', url: 'https://news.google.com' },
    { name: 'Photos', icon: 'https://www.gstatic.com/images/branding/product/1x/photos_64dp.png', url: 'https://photos.google.com' },
    { name: 'Meet', icon: 'https://www.gstatic.com/images/branding/product/1x/meet_64dp.png', url: 'https://meet.google.com' },
    { name: 'Translate', icon: 'https://www.gstatic.com/images/branding/product/1x/translate_64dp.png', url: 'https://translate.google.com' },
    { name: 'Sheets', icon: 'https://www.gstatic.com/images/branding/product/1x/sheets_64dp.png', url: 'https://sheets.google.com' },
    { name: 'Docs', icon: 'https://www.gstatic.com/images/branding/product/1x/docs_64dp.png', url: 'https://docs.google.com' },
    { name: 'Drive', icon: 'https://www.gstatic.com/images/branding/product/1x/drive_64dp.png', url: 'https://drive.google.com' },
  ];

  // Accent colors
  const ACCENT_COLORS = [
    { name: 'blue', label: 'Blue', hsl: '222.2 47.4% 45%' },
    { name: 'rose', label: 'Rose', hsl: '346.8 77.2% 49.8%' },
    { name: 'orange', label: 'Orange', hsl: '24.6 95% 53.1%' },
    { name: 'green', label: 'Green', hsl: '142 76% 36%' },
    { name: 'purple', label: 'Purple', hsl: '262.1 83.3% 57.8%' },
    { name: 'cyan', label: 'Cyan', hsl: '189.5 94.5% 42.7%' },
  ];

  // Font options
  const FONT_OPTIONS = [
    { name: 'Inter', value: 'inter', preview: 'Modern & Clean' },
    { name: 'Space Grotesk', value: 'space', preview: 'Geometric' },
    { name: 'Poppins', value: 'poppins', preview: 'Friendly' },
    { name: 'JetBrains Mono', value: 'mono', preview: 'Technical' },
    { name: 'Outfit', value: 'outfit', preview: 'Contemporary' },
    { name: 'Sora', value: 'sora', preview: 'Elegant' },
  ];

  // Background options
  const BACKGROUND_OPTIONS = [
    { name: 'Default', value: 'default', animated: false },
    { name: 'Gradient', value: 'gradient', animated: false },
    { name: 'Mesh', value: 'mesh', animated: false },
    { name: 'Dots', value: 'dots', animated: false },
    { name: 'Aurora', value: 'aurora', animated: true },
    { name: 'Sunset', value: 'sunset', animated: true },
    { name: 'Ocean', value: 'ocean', animated: true },
    { name: 'Custom Image', value: 'custom-image', animated: false },
  ];

  // Storage keys
  const SHORTCUTS_KEY = 'ridel-shortcuts';
  const THEME_KEY = 'ridel-theme';
  const ACCENT_KEY = 'ridel-accent';
  const FONT_KEY = 'ridel-font';
  const BACKGROUND_KEY = 'ridel-background';
  const CUSTOM_IMAGE_KEY = 'ridel-custom-bg-url';

  // State
  let state = {
    shortcuts: [],
    theme: 'system',
    accent: 'green',
    font: 'inter',
    background: 'default',
    customImageUrl: '',
    showCustomize: false,
    showApps: false,
    editingShortcut: null,
    showAddShortcut: false,
  };

  // Storage helpers
  function getStorage(key, defaultValue) {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : defaultValue;
    } catch (e) {
      return defaultValue;
    }
  }

  function setStorage(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error('Failed to save:', key, e);
    }
  }

  // Initialize state from storage
  function initState() {
    state.shortcuts = getStorage(SHORTCUTS_KEY, DEFAULT_SHORTCUTS);
    state.theme = getStorage(THEME_KEY, 'system');
    state.accent = getStorage(ACCENT_KEY, 'green');
    state.font = getStorage(FONT_KEY, 'inter');
    state.background = getStorage(BACKGROUND_KEY, 'default');
    state.customImageUrl = getStorage(CUSTOM_IMAGE_KEY, '');
  }

  // Get effective theme
  function getEffectiveTheme() {
    if (state.theme === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return state.theme;
  }

  // Apply theme and customizations
  function applyCustomizations() {
    const html = document.documentElement;
    const body = document.body;
    const effectiveTheme = getEffectiveTheme();

    // Apply theme
    html.classList.remove('dark');
    if (effectiveTheme === 'dark') {
      html.classList.add('dark');
    }

    // Apply accent color
    ACCENT_COLORS.forEach(c => {
      html.classList.remove(`accent-${c.name}`);
    });
    html.classList.add(`accent-${state.accent}`);

    // Apply font
    FONT_OPTIONS.forEach(f => {
      body.classList.remove(`font-${f.value}`);
    });
    body.classList.add(`font-${state.font}`);

    // Apply background
    BACKGROUND_OPTIONS.forEach(bg => {
      body.classList.remove(`bg-${bg.value}`);
    });
    if (state.background !== 'default') {
      body.classList.add(`bg-${state.background}`);
    }

    // Apply custom image
    if (state.background === 'custom-image' && state.customImageUrl) {
      body.style.backgroundImage = `url(${state.customImageUrl})`;
    } else {
      body.style.backgroundImage = '';
    }
  }

  // SVG Icons
  const ICONS = {
    search: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>`,
    sun: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>`,
    moon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>`,
    monitor: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/></svg>`,
    plus: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>`,
    globe: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>`,
    pencil: `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/></svg>`,
    x: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`,
    sparkles: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/><path d="M20 3v4"/><path d="M22 5h-4"/><path d="M4 17v2"/><path d="M5 18H3"/></svg>`,
    check: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>`,
    palette: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.555C21.965 6.012 17.461 2 12 2z"/></svg>`,
    grid: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>`,
    type: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" x2="15" y1="20" y2="20"/><line x1="12" x2="12" y1="4" y2="20"/></svg>`,
    image: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>`,
  };

  // Render the page
  function render() {
    const root = document.getElementById('root');
    applyCustomizations();

    root.innerHTML = `
      <!-- Header -->
      <header class="header">
        <div class="apps-wrapper">
          <button class="header-btn" id="appsBtn" title="Google Apps">
            ${ICONS.grid}
          </button>
          <div class="apps-dropdown ${state.showApps ? 'open' : ''}" id="appsDropdown">
            <div class="apps-grid">
              ${GOOGLE_APPS.map(app => `
                <a href="${app.url}" class="app-item" target="_blank">
                  <img src="${app.icon}" alt="${app.name}" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(app.name)}&background=random&size=64'"/>
                  <span>${app.name}</span>
                </a>
              `).join('')}
            </div>
          </div>
        </div>
      </header>
      
      <!-- Main Container -->
      <div class="container">
        <!-- Logo -->
        <div class="logo">
          <h1>RidelL</h1>
        </div>
        
        <!-- Search Box -->
        <div class="search-container">
          <form class="search-box" id="searchForm">
            <span class="search-icon">${ICONS.search}</span>
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
        
        <!-- Shortcuts Grid -->
        <div class="shortcuts-grid" id="shortcutsGrid">
          ${state.shortcuts.slice(0, 10).map(shortcut => `
            <div class="shortcut" data-id="${shortcut.id}" data-url="${shortcut.url}">
              <button class="shortcut-edit" data-edit-id="${shortcut.id}" title="Edit shortcut">
                ${ICONS.pencil}
              </button>
              <div class="shortcut-icon">
                <img src="${shortcut.favicon}" alt="${shortcut.name}" onerror="this.style.display='none'; this.parentElement.innerHTML='${ICONS.globe}';" />
              </div>
              <span class="shortcut-name">${shortcut.name}</span>
            </div>
          `).join('')}
          ${state.shortcuts.length < 10 ? `
            <button class="shortcut add-shortcut" id="addShortcutBtn">
              <div class="shortcut-icon">
                ${ICONS.plus}
              </div>
              <span class="shortcut-name">Add shortcut</span>
            </button>
          ` : ''}
        </div>
      </div>

      <!-- Customize Button -->
      <button class="customize-btn" id="customizeBtn">
        ${ICONS.palette}
        <span>Customize RidelL</span>
      </button>

      <!-- Customize Modal -->
      <div class="modal-overlay ${state.showCustomize ? 'open' : ''}" id="customizeModal">
        <div class="modal">
          <div class="modal-header">
            <h2>${ICONS.sparkles} Customize</h2>
            <button class="modal-close" id="closeCustomize">${ICONS.x}</button>
          </div>

          <!-- Theme Section -->
          <div class="customize-section">
            <div class="customize-section-title">Theme</div>
            <div class="theme-grid">
              <button class="theme-btn ${state.theme === 'light' ? 'active' : ''}" data-theme="light">
                ${ICONS.sun}
                <span>Light</span>
              </button>
              <button class="theme-btn ${state.theme === 'dark' ? 'active' : ''}" data-theme="dark">
                ${ICONS.moon}
                <span>Dark</span>
              </button>
              <button class="theme-btn ${state.theme === 'system' ? 'active' : ''}" data-theme="system">
                ${ICONS.monitor}
                <span>System</span>
              </button>
            </div>
          </div>

          <!-- Accent Color Section -->
          <div class="customize-section">
            <div class="customize-section-title">Accent Color</div>
            <div class="accent-grid">
              ${ACCENT_COLORS.map(color => `
                <button 
                  class="accent-btn ${state.accent === color.name ? 'active' : ''}" 
                  data-accent="${color.name}"
                  style="background-color: hsl(${color.hsl})"
                  title="${color.label}"
                >
                  ${state.accent === color.name ? `<span class="check">${ICONS.check}</span>` : ''}
                </button>
              `).join('')}
            </div>
          </div>

          <!-- Font Section -->
          <div class="customize-section">
            <div class="customize-section-title">${ICONS.type} Font</div>
            <div class="font-grid">
              ${FONT_OPTIONS.map(font => `
                <button class="font-btn font-${font.value} ${state.font === font.value ? 'active' : ''}" data-font="${font.value}">
                  <div class="font-name">${font.name}</div>
                  <div class="font-preview">${font.preview}</div>
                  ${state.font === font.value ? `<span class="check">${ICONS.check}</span>` : ''}
                </button>
              `).join('')}
            </div>
          </div>

          <!-- Background Section -->
          <div class="customize-section">
            <div class="customize-section-title">${ICONS.image} Background</div>
            <div class="bg-grid">
              ${BACKGROUND_OPTIONS.map(bg => `
                <button class="bg-btn ${state.background === bg.value ? 'active' : ''}" data-bg="${bg.value}">
                  <div class="bg-preview ${bg.value !== 'default' ? `bg-${bg.value}` : ''}" 
                    ${bg.value === 'custom-image' && state.customImageUrl ? `style="background-image: url(${state.customImageUrl}); background-size: cover;"` : ''}>
                  </div>
                  <span class="bg-label">
                    ${bg.name}
                    ${bg.animated ? '<span class="animated-dot"></span>' : ''}
                  </span>
                  ${state.background === bg.value ? `<span class="check">${ICONS.check}</span>` : ''}
                </button>
              `).join('')}
            </div>
            ${state.background === 'custom-image' ? `
              <div class="custom-image-input">
                <div class="input-row">
                  <input type="url" class="form-input" id="customImageUrl" placeholder="Paste image URL..." value="${state.customImageUrl}" />
                  <button class="btn btn-primary" id="applyCustomImage">Apply</button>
                </div>
                <p class="help-text">Enter a direct link to an image (e.g., from Unsplash)</p>
              </div>
            ` : ''}
          </div>
        </div>
      </div>

      <!-- Add/Edit Shortcut Modal -->
      <div class="modal-overlay ${state.showAddShortcut || state.editingShortcut ? 'open' : ''}" id="shortcutModal">
        <div class="modal">
          <div class="modal-header">
            <h2>${state.editingShortcut ? 'Edit shortcut' : 'Add shortcut'}</h2>
            <button class="modal-close" id="closeShortcut">${ICONS.x}</button>
          </div>
          <div class="form-group">
            <label class="form-label">Name</label>
            <input type="text" class="form-input" id="shortcutName" placeholder="e.g., YouTube" value="${state.editingShortcut ? state.editingShortcut.name : ''}" />
          </div>
          <div class="form-group">
            <label class="form-label">URL</label>
            <input type="text" class="form-input" id="shortcutUrl" placeholder="e.g., youtube.com" value="${state.editingShortcut ? state.editingShortcut.url : ''}" />
          </div>
          <div class="form-actions">
            ${state.editingShortcut ? `
              <button class="btn btn-danger" id="removeShortcut">Remove</button>
            ` : '<div></div>'}
            <div style="display: flex; gap: 0.5rem;">
              <button class="btn btn-secondary" id="cancelShortcut">Cancel</button>
              <button class="btn btn-primary" id="saveShortcut">${state.editingShortcut ? 'Save' : 'Add'}</button>
            </div>
          </div>
        </div>
      </div>
    `;

    attachEventListeners();
  }

  // Attach event listeners
  function attachEventListeners() {
    // Search form
    document.getElementById('searchForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const query = document.getElementById('searchInput').value.trim();
      if (query) {
        const urlPattern = /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/.*)?$/;
        if (urlPattern.test(query)) {
          window.location.href = query.startsWith('http') ? query : `https://${query}`;
        } else {
          window.location.href = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
        }
      }
    });

    // Apps button
    document.getElementById('appsBtn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      state.showApps = !state.showApps;
      render();
    });

    // Close apps dropdown on outside click
    document.addEventListener('click', (e) => {
      if (state.showApps && !e.target.closest('.apps-wrapper')) {
        state.showApps = false;
        render();
      }
    });

    // Shortcut clicks
    document.querySelectorAll('.shortcut[data-url]').forEach(shortcut => {
      shortcut.addEventListener('click', (e) => {
        if (!e.target.closest('.shortcut-edit')) {
          window.location.href = shortcut.dataset.url;
        }
      });
    });

    // Edit shortcut buttons
    document.querySelectorAll('.shortcut-edit').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.editId;
        state.editingShortcut = state.shortcuts.find(s => s.id === id);
        render();
      });
    });

    // Add shortcut button
    document.getElementById('addShortcutBtn')?.addEventListener('click', () => {
      state.showAddShortcut = true;
      render();
    });

    // Customize button
    document.getElementById('customizeBtn')?.addEventListener('click', () => {
      state.showCustomize = true;
      render();
    });

    // Close customize modal
    document.getElementById('closeCustomize')?.addEventListener('click', () => {
      state.showCustomize = false;
      render();
    });

    // Close on overlay click
    document.getElementById('customizeModal')?.addEventListener('click', (e) => {
      if (e.target.id === 'customizeModal') {
        state.showCustomize = false;
        render();
      }
    });

    // Theme buttons
    document.querySelectorAll('[data-theme]').forEach(btn => {
      btn.addEventListener('click', () => {
        state.theme = btn.dataset.theme;
        setStorage(THEME_KEY, state.theme);
        render();
      });
    });

    // Accent buttons
    document.querySelectorAll('[data-accent]').forEach(btn => {
      btn.addEventListener('click', () => {
        state.accent = btn.dataset.accent;
        setStorage(ACCENT_KEY, state.accent);
        render();
      });
    });

    // Font buttons
    document.querySelectorAll('[data-font]').forEach(btn => {
      btn.addEventListener('click', () => {
        state.font = btn.dataset.font;
        setStorage(FONT_KEY, state.font);
        render();
      });
    });

    // Background buttons
    document.querySelectorAll('[data-bg]').forEach(btn => {
      btn.addEventListener('click', () => {
        state.background = btn.dataset.bg;
        setStorage(BACKGROUND_KEY, state.background);
        render();
      });
    });

    // Custom image URL
    document.getElementById('applyCustomImage')?.addEventListener('click', () => {
      const url = document.getElementById('customImageUrl').value.trim();
      if (url) {
        state.customImageUrl = url;
        setStorage(CUSTOM_IMAGE_KEY, state.customImageUrl);
        render();
      }
    });

    // Shortcut modal
    document.getElementById('closeShortcut')?.addEventListener('click', () => {
      state.showAddShortcut = false;
      state.editingShortcut = null;
      render();
    });

    document.getElementById('shortcutModal')?.addEventListener('click', (e) => {
      if (e.target.id === 'shortcutModal') {
        state.showAddShortcut = false;
        state.editingShortcut = null;
        render();
      }
    });

    document.getElementById('cancelShortcut')?.addEventListener('click', () => {
      state.showAddShortcut = false;
      state.editingShortcut = null;
      render();
    });

    document.getElementById('saveShortcut')?.addEventListener('click', () => {
      const name = document.getElementById('shortcutName').value.trim();
      let url = document.getElementById('shortcutUrl').value.trim();
      
      if (!name || !url) return;
      
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }

      const favicon = `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=64`;

      if (state.editingShortcut) {
        state.shortcuts = state.shortcuts.map(s => 
          s.id === state.editingShortcut.id 
            ? { ...s, name, url, favicon }
            : s
        );
      } else {
        state.shortcuts.push({
          id: Date.now().toString(),
          name,
          url,
          favicon,
        });
      }

      setStorage(SHORTCUTS_KEY, state.shortcuts);
      state.showAddShortcut = false;
      state.editingShortcut = null;
      render();
    });

    document.getElementById('removeShortcut')?.addEventListener('click', () => {
      if (state.editingShortcut) {
        state.shortcuts = state.shortcuts.filter(s => s.id !== state.editingShortcut.id);
        setStorage(SHORTCUTS_KEY, state.shortcuts);
        state.editingShortcut = null;
        render();
      }
    });
  }

  // Initialize
  document.addEventListener('DOMContentLoaded', () => {
    initState();
    render();
  });
})();
