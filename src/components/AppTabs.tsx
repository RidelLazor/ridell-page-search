import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Home, Search } from "lucide-react";
import { usePWA } from "@/hooks/usePWA";

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

  const closeTab = (id: string) => {
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
  if (currentQuery !== undefined) {
    const currentTab = tabs.find((t) => t.id === activeTabId);
    if (currentTab && currentTab.query !== currentQuery) {
      updateCurrentTab(currentQuery);
    }
  }

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
                          onClick={(e) => {
                            e.stopPropagation();
                            closeTab(tab.id);
                          }}
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
