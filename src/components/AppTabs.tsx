import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { Plus, X, Layers, Home, Search as SearchIcon, Globe } from "lucide-react";
import { usePWA } from "@/hooks/usePWA";
import { useIsMobile } from "@/hooks/use-mobile";

export interface Tab {
  id: string;
  title: string;
  type: "home" | "search" | "webview";
  query?: string;
  url?: string;
}

interface AppTabsProps {
  onTabChange?: (tab: Tab) => void;
  onNewTab?: () => void;
  currentQuery?: string;
  currentUrl?: string;
}

// Persist tabs in sessionStorage so they survive page navigations
const TABS_STORAGE_KEY = "ridel-app-tabs";
const ACTIVE_TAB_KEY = "ridel-active-tab";

const getStoredTabs = (): Tab[] => {
  try {
    const stored = sessionStorage.getItem(TABS_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error("Error reading tabs from storage:", e);
  }
  return [{ id: "1", title: "Home", type: "home", query: "" }];
};

const getStoredActiveTab = (): string => {
  try {
    return sessionStorage.getItem(ACTIVE_TAB_KEY) || "1";
  } catch (e) {
    return "1";
  }
};

const AppTabs = ({ onTabChange, onNewTab, currentQuery, currentUrl }: AppTabsProps) => {
  const { isStandalone, isReady } = usePWA();
  const isMobile = useIsMobile();
  const [tabs, setTabs] = useState<Tab[]>(getStoredTabs);
  const [activeTabId, setActiveTabId] = useState(getStoredActiveTab);
  const [showTabs, setShowTabs] = useState(false);
  const lastQueryRef = useRef<string | undefined>(undefined);
  const lastUrlRef = useRef<string | undefined>(undefined);
  const initializedRef = useRef(false);

  // Initialize refs on mount
  useEffect(() => {
    if (!initializedRef.current) {
      const activeTab = tabs.find(t => t.id === activeTabId);
      if (activeTab) {
        lastQueryRef.current = activeTab.query;
        lastUrlRef.current = activeTab.url;
      }
      initializedRef.current = true;
    }
  }, []);

  // Persist tabs to sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem(TABS_STORAGE_KEY, JSON.stringify(tabs));
    } catch (e) {
      console.error("Error saving tabs:", e);
    }
  }, [tabs]);

  // Persist active tab
  useEffect(() => {
    try {
      sessionStorage.setItem(ACTIVE_TAB_KEY, activeTabId);
    } catch (e) {
      console.error("Error saving active tab:", e);
    }
  }, [activeTabId]);

  // Update current tab when query changes - only if it actually changed
  useEffect(() => {
    if (currentQuery !== undefined && currentQuery !== lastQueryRef.current) {
      lastQueryRef.current = currentQuery;
      setTabs(prevTabs => 
        prevTabs.map(t =>
          t.id === activeTabId
            ? {
                ...t,
                query: currentQuery,
                title: currentQuery || "Home",
                type: currentQuery ? "search" : "home",
                url: undefined,
              }
            : t
        )
      );
    }
  }, [currentQuery, activeTabId]);

  // Update current tab when URL changes (for webview)
  useEffect(() => {
    if (currentUrl !== undefined && currentUrl !== lastUrlRef.current) {
      lastUrlRef.current = currentUrl;
      try {
        const hostname = new URL(currentUrl).hostname;
        setTabs(prevTabs =>
          prevTabs.map(t =>
            t.id === activeTabId
              ? {
                  ...t,
                  url: currentUrl,
                  title: hostname,
                  type: "webview",
                  query: undefined,
                }
              : t
          )
        );
      } catch {
        // Invalid URL, ignore
      }
    }
  }, [currentUrl, activeTabId]);

  const addTab = useCallback(() => {
    const newTab: Tab = {
      id: Date.now().toString(),
      title: "New Tab",
      type: "home",
      query: "",
    };
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newTab.id);
    lastQueryRef.current = "";
    lastUrlRef.current = undefined;
    onNewTab?.();
    onTabChange?.(newTab);
  }, [onNewTab, onTabChange]);

  const closeTab = useCallback((id: string) => {
    setTabs(prevTabs => {
      if (prevTabs.length === 1) return prevTabs;
      const newTabs = prevTabs.filter(t => t.id !== id);
      
      if (activeTabId === id) {
        const newActive = newTabs[newTabs.length - 1];
        setActiveTabId(newActive.id);
        lastQueryRef.current = newActive.query;
        lastUrlRef.current = newActive.url;
        onTabChange?.(newActive);
      }
      
      return newTabs;
    });
  }, [activeTabId, onTabChange]);

  const selectTab = useCallback((tab: Tab) => {
    setActiveTabId(tab.id);
    lastQueryRef.current = tab.query;
    lastUrlRef.current = tab.url;
    onTabChange?.(tab);
    setShowTabs(false);
  }, [onTabChange]);

  // Switch to next/previous tab
  const switchTab = useCallback((direction: "next" | "prev") => {
    const currentIndex = tabs.findIndex(t => t.id === activeTabId);
    if (currentIndex === -1) return;
    
    let newIndex: number;
    if (direction === "next") {
      newIndex = currentIndex < tabs.length - 1 ? currentIndex + 1 : 0;
    } else {
      newIndex = currentIndex > 0 ? currentIndex - 1 : tabs.length - 1;
    }
    
    const newTab = tabs[newIndex];
    selectTab(newTab);
  }, [tabs, activeTabId, selectTab]);

  // Handle swipe on tab card in mobile view
  const handleTabDrag = useCallback((tabId: string, info: PanInfo) => {
    // Swipe up to close
    if (info.offset.y < -100 && tabs.length > 1) {
      closeTab(tabId);
    }
  }, [tabs.length, closeTab]);

  // Don't render until PWA state is ready, and only show in standalone mode
  if (!isReady || !isStandalone) {
    return null;
  }

  const activeTab = tabs.find(t => t.id === activeTabId);
  const currentTabIndex = tabs.findIndex(t => t.id === activeTabId);

  // Desktop: Chrome-like tabs
  if (!isMobile) {
    return (
      <div className="fixed top-0 left-0 right-0 h-10 bg-background/95 backdrop-blur-sm border-b border-border z-50 flex items-center px-2 gap-1">
        <AnimatePresence mode="popLayout">
          {tabs.map((tab) => (
            <motion.div
              key={tab.id}
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className={`relative flex items-center gap-2 px-3 py-1.5 rounded-t-lg cursor-pointer transition-colors max-w-[200px] min-w-[120px] ${
                activeTabId === tab.id
                  ? "bg-card border border-b-0 border-border"
                  : "hover:bg-muted/50"
              }`}
              onClick={() => selectTab(tab)}
            >
              {tab.type === "home" ? (
                <Home className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
              ) : tab.type === "webview" ? (
                <Globe className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
              ) : (
                <SearchIcon className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
              )}
              <span className="text-sm truncate flex-1">{tab.title}</span>
              {tabs.length > 1 && (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    closeTab(tab.id);
                  }}
                  className="p-0.5 rounded hover:bg-muted"
                >
                  <X className="h-3 w-3 text-muted-foreground" />
                </motion.button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={addTab}
          className="p-1.5 rounded hover:bg-muted ml-1"
        >
          <Plus className="h-4 w-4 text-muted-foreground" />
        </motion.button>
      </div>
    );
  }

  // Mobile: Tab counter + fullscreen tab switcher with swipe gestures
  return (
    <>
      {/* Floating tab counter button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowTabs(true)}
        className="fixed bottom-20 right-4 z-40 w-10 h-10 rounded-xl bg-primary text-primary-foreground shadow-lg flex items-center justify-center"
      >
        <div className="relative">
          <Layers className="h-5 w-5" />
          <span className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-accent text-[10px] font-bold flex items-center justify-center">
            {tabs.length}
          </span>
        </div>
      </motion.button>

      {/* Tab indicator dots for swipe navigation hint */}
      {tabs.length > 1 && (
        <div className="fixed bottom-[88px] left-1/2 -translate-x-1/2 z-40 flex gap-1.5">
          {tabs.map((tab, index) => (
            <motion.div
              key={tab.id}
              className={`w-1.5 h-1.5 rounded-full transition-colors ${
                index === currentTabIndex ? "bg-primary" : "bg-muted-foreground/30"
              }`}
              animate={{ scale: index === currentTabIndex ? 1.2 : 1 }}
            />
          ))}
        </div>
      )}

      {/* Fullscreen tab view */}
      <AnimatePresence>
        {showTabs && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-lg font-semibold">
                {tabs.length} {tabs.length === 1 ? "Tab" : "Tabs"}
              </h2>
              <div className="flex items-center gap-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={addTab}
                  className="p-2 rounded-full hover:bg-muted"
                >
                  <Plus className="h-5 w-5" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowTabs(false)}
                  className="p-2 rounded-full hover:bg-muted"
                >
                  <X className="h-5 w-5" />
                </motion.button>
              </div>
            </div>

            {/* Swipe hint */}
            <p className="text-center text-xs text-muted-foreground py-2">
              Swipe up on a tab to close it
            </p>

            {/* Tab grid with swipe-to-close */}
            <div className="flex-1 overflow-auto p-4">
              <div className="grid grid-cols-2 gap-3">
                <AnimatePresence mode="popLayout">
                  {tabs.map((tab) => (
                    <motion.div
                      key={tab.id}
                      layout
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.8, y: -100 }}
                      drag="y"
                      dragConstraints={{ top: 0, bottom: 0 }}
                      dragElastic={0.5}
                      onDragEnd={(_, info) => handleTabDrag(tab.id, info)}
                      className={`relative aspect-[3/4] rounded-xl overflow-hidden cursor-pointer transition-all touch-none ${
                        activeTabId === tab.id
                          ? "ring-2 ring-primary"
                          : "ring-1 ring-border"
                      }`}
                      onClick={() => selectTab(tab)}
                      whileTap={{ scale: 0.98 }}
                    >
                      {/* Tab preview */}
                      <div className="absolute inset-0 bg-card flex flex-col">
                        <div className="h-8 bg-muted/50 flex items-center px-2 gap-1.5">
                          {tab.type === "home" ? (
                            <Home className="h-3 w-3 text-muted-foreground" />
                          ) : tab.type === "webview" ? (
                            <Globe className="h-3 w-3 text-muted-foreground" />
                          ) : (
                            <SearchIcon className="h-3 w-3 text-muted-foreground" />
                          )}
                          <span className="text-[10px] truncate flex-1">
                            {tab.title}
                          </span>
                        </div>
                        <div className="flex-1 flex items-center justify-center text-muted-foreground/30">
                          {tab.type === "home" ? (
                            <Home className="h-12 w-12" />
                          ) : tab.type === "webview" ? (
                            <Globe className="h-12 w-12" />
                          ) : (
                            <SearchIcon className="h-12 w-12" />
                          )}
                        </div>
                      </div>

                      {/* Close button */}
                      {tabs.length > 1 && (
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            closeTab(tab.id);
                          }}
                          className="absolute top-1 right-1 p-1.5 rounded-full bg-background/80 backdrop-blur-sm"
                        >
                          <X className="h-3.5 w-3.5" />
                        </motion.button>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AppTabs;
export { getStoredTabs, getStoredActiveTab };
