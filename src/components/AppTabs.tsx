import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Layers, Home, Search as SearchIcon } from "lucide-react";
import { usePWA } from "@/hooks/usePWA";
import { useIsMobile } from "@/hooks/use-mobile";

interface Tab {
  id: string;
  title: string;
  query: string;
  type: "home" | "search";
}

interface AppTabsProps {
  onTabChange?: (query: string) => void;
  onNewTab?: () => void;
  currentQuery?: string;
}

const AppTabs = ({ onTabChange, onNewTab, currentQuery }: AppTabsProps) => {
  const { isStandalone, isReady } = usePWA();
  const isMobile = useIsMobile();
  const [tabs, setTabs] = useState<Tab[]>([
    { id: "1", title: "Home", query: "", type: "home" },
  ]);
  const [activeTabId, setActiveTabId] = useState("1");
  const [showTabs, setShowTabs] = useState(false);

  // Update tab when query changes - MUST be called unconditionally
  useEffect(() => {
    if (currentQuery !== undefined) {
      const currentTab = tabs.find((t) => t.id === activeTabId);
      if (currentTab && currentTab.query !== currentQuery) {
        updateCurrentTab(currentQuery);
      }
    }
  }, [currentQuery, activeTabId, tabs]);

  const addTab = () => {
    const newTab: Tab = {
      id: Date.now().toString(),
      title: "New Tab",
      query: "",
      type: "home",
    };
    setTabs([...tabs, newTab]);
    setActiveTabId(newTab.id);
    onNewTab?.();
  };

  const closeTab = (id: string) => {
    if (tabs.length === 1) return;
    const newTabs = tabs.filter((t) => t.id !== id);
    setTabs(newTabs);
    if (activeTabId === id) {
      const newActive = newTabs[newTabs.length - 1];
      setActiveTabId(newActive.id);
      onTabChange?.(newActive.query);
    }
  };

  const selectTab = (tab: Tab) => {
    setActiveTabId(tab.id);
    onTabChange?.(tab.query);
    setShowTabs(false);
  };

  const updateCurrentTab = (query: string) => {
    setTabs(
      tabs.map((t) =>
        t.id === activeTabId
          ? {
              ...t,
              query,
              title: query || "Home",
              type: query ? "search" : "home",
            }
          : t
      )
    );
  };

  // Don't render until PWA state is ready, and only show in standalone mode
  // CRITICAL: This early return MUST come AFTER all hooks
  if (!isReady || !isStandalone) {
    return null;
  }

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

  // Mobile: Tab counter + fullscreen tab switcher
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

            {/* Tab grid */}
            <div className="flex-1 overflow-auto p-4">
              <div className="grid grid-cols-2 gap-3">
                <AnimatePresence mode="popLayout">
                  {tabs.map((tab) => (
                    <motion.div
                      key={tab.id}
                      layout
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className={`relative aspect-[3/4] rounded-xl overflow-hidden cursor-pointer transition-all ${
                        activeTabId === tab.id
                          ? "ring-2 ring-primary"
                          : "ring-1 ring-border"
                      }`}
                      onClick={() => selectTab(tab)}
                    >
                      {/* Tab preview */}
                      <div className="absolute inset-0 bg-card flex flex-col">
                        <div className="h-8 bg-muted/50 flex items-center px-2 gap-1.5">
                          {tab.type === "home" ? (
                            <Home className="h-3 w-3 text-muted-foreground" />
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
