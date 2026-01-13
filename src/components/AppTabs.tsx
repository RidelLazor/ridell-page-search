import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Home, Search, Layers } from "lucide-react";
import { usePWA } from "@/hooks/usePWA";
import { useIsMobile } from "@/hooks/use-mobile";

interface Tab {
  id: string;
  title: string;
  query: string;
  type: "home" | "search";
}

interface AppTabsProps {
  onTabChange: (tab: Tab) => void;
  onNewTab: () => void;
  currentQuery?: string;
}

const AppTabs = ({ onTabChange, onNewTab, currentQuery }: AppTabsProps) => {
  const { isStandalone } = usePWA();
  const isMobile = useIsMobile();
  const [tabs, setTabs] = useState<Tab[]>([
    { id: "1", title: "Home", query: "", type: "home" },
  ]);
  const [activeTabId, setActiveTabId] = useState("1");
  const [showTabs, setShowTabs] = useState(false);

  // Only show in standalone (installed) mode
  if (!isStandalone) {
    return null;
  }

  const addTab = () => {
    const newTab: Tab = {
      id: Date.now().toString(),
      title: "New Tab",
      query: "",
      type: "home",
    };
    setTabs([...tabs, newTab]);
    setActiveTabId(newTab.id);
    onNewTab();
  };

  const closeTab = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (tabs.length === 1) return;
    
    const newTabs = tabs.filter((t) => t.id !== id);
    setTabs(newTabs);
    
    if (activeTabId === id) {
      const lastTab = newTabs[newTabs.length - 1];
      setActiveTabId(lastTab.id);
      onTabChange(lastTab);
    }
  };

  const selectTab = (tab: Tab) => {
    setActiveTabId(tab.id);
    onTabChange(tab);
    setShowTabs(false);
  };

  const updateCurrentTab = (query: string) => {
    setTabs(tabs.map((t) => 
      t.id === activeTabId 
        ? { ...t, query, title: query || "Home", type: query ? "search" : "home" }
        : t
    ));
  };

  // Update tab when query changes
  useEffect(() => {
    if (currentQuery !== undefined) {
      const currentTab = tabs.find((t) => t.id === activeTabId);
      if (currentTab && currentTab.query !== currentQuery) {
        updateCurrentTab(currentQuery);
      }
    }
  }, [currentQuery, activeTabId]);

  // Desktop: Browser-style tab bar at the top
  if (!isMobile) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="flex items-center h-10">
          {/* Tabs */}
          <div className="flex-1 flex items-center overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => (
              <motion.div
                key={tab.id}
                layoutId={`tab-${tab.id}`}
                onClick={() => selectTab(tab)}
                className={`group relative flex items-center gap-2 px-4 h-10 min-w-[140px] max-w-[200px] cursor-pointer border-r border-border ${
                  activeTabId === tab.id
                    ? "bg-card"
                    : "bg-muted/50 hover:bg-muted"
                }`}
                whileHover={{ backgroundColor: activeTabId === tab.id ? undefined : "hsl(var(--muted))" }}
              >
                {/* Active indicator */}
                {activeTabId === tab.id && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                  />
                )}
                
                {/* Icon */}
                <div className="flex-shrink-0">
                  {tab.type === "home" ? (
                    <Home className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Search className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                
                {/* Title */}
                <span className="flex-1 text-sm truncate">
                  {tab.title}
                </span>
                
                {/* Close button */}
                {tabs.length > 1 && (
                  <motion.button
                    onClick={(e) => closeTab(tab.id, e)}
                    className="flex-shrink-0 p-1 rounded-full opacity-0 group-hover:opacity-100 hover:bg-secondary transition-opacity"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <X className="h-3 w-3" />
                  </motion.button>
                )}
              </motion.div>
            ))}
          </div>
          
          {/* New Tab Button */}
          <motion.button
            onClick={addTab}
            className="flex-shrink-0 p-2 hover:bg-muted rounded-md mx-1"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="New Tab (Ctrl+T)"
          >
            <Plus className="h-4 w-4" />
          </motion.button>
        </div>
      </div>
    );
  }

  // Mobile: Floating button + fullscreen grid
  return (
    <>
      {/* Tab Counter Button */}
      <motion.button
        onClick={() => setShowTabs(true)}
        className="fixed bottom-20 right-4 z-40 w-12 h-12 rounded-xl bg-primary text-primary-foreground shadow-lg flex items-center justify-center"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <span className="text-lg font-bold">{tabs.length}</span>
      </motion.button>

      {/* Tab Switcher Modal */}
      <AnimatePresence>
        {showTabs && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-md z-50"
              onClick={() => setShowTabs(false)}
            />
            
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="fixed inset-4 z-50 flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4">
                <h2 className="text-xl font-bold text-white">{tabs.length} Tabs</h2>
                <div className="flex gap-2">
                  <motion.button
                    onClick={addTab}
                    className="p-3 rounded-full bg-white/10 text-white"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Plus className="h-5 w-5" />
                  </motion.button>
                  <motion.button
                    onClick={() => setShowTabs(false)}
                    className="p-3 rounded-full bg-white/10 text-white"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <X className="h-5 w-5" />
                  </motion.button>
                </div>
              </div>

              {/* Tab Grid */}
              <div className="flex-1 overflow-auto p-4">
                <div className="grid grid-cols-2 gap-4">
                  {tabs.map((tab) => (
                    <motion.div
                      key={tab.id}
                      layoutId={tab.id}
                      onClick={() => selectTab(tab)}
                      className={`relative aspect-[3/4] rounded-2xl overflow-hidden cursor-pointer border-2 ${
                        activeTabId === tab.id
                          ? "border-primary"
                          : "border-transparent"
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {/* Tab Preview */}
                      <div className="absolute inset-0 bg-card">
                        <div className="h-full flex flex-col items-center justify-center gap-2 p-4">
                          <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                            {tab.type === "home" ? (
                              <Home className="h-6 w-6 text-muted-foreground" />
                            ) : (
                              <Search className="h-6 w-6 text-muted-foreground" />
                            )}
                          </div>
                          <p className="text-sm font-medium text-center line-clamp-2">
                            {tab.title}
                          </p>
                        </div>
                      </div>

                      {/* Close Button */}
                      {tabs.length > 1 && (
                        <motion.button
                          onClick={(e) => closeTab(tab.id, e)}
                          className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <X className="h-4 w-4" />
                        </motion.button>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default AppTabs;
