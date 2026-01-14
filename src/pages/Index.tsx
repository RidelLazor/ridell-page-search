import { useState, useRef, useCallback, useEffect } from "react";
import { Bookmark, ChevronLeft, ChevronRight, Loader2, History, Star, Palette } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import RidelLogo from "@/components/RidelLogo";
import SearchBar from "@/components/SearchBar";
import MobileSearchBar from "@/components/MobileSearchBar";
import MobileBottomNav from "@/components/MobileBottomNav";
import MobileAppsSheet from "@/components/MobileAppsSheet";
import AppTabs from "@/components/AppTabs";
import SearchResults from "@/components/SearchResults";
import MixedSearchResults from "@/components/MixedSearchResults";
import BookmarksPanel from "@/components/BookmarksPanel";
import FavoritesPanel from "@/components/FavoritesPanel";
import SettingsDialog from "@/components/SettingsDialog";
import QuickShortcuts from "@/components/QuickShortcuts";
import AISummary from "@/components/AISummary";
import TrendingSearches from "@/components/TrendingSearches";
import SearchTabs, { SearchTab } from "@/components/SearchTabs";
import DateFilter, { DateRange } from "@/components/DateFilter";
import ImageResults from "@/components/ImageResults";
import GoogleAppsGrid from "@/components/GoogleAppsGrid";
import { CustomizeButton, CustomizePanel } from "@/components/CustomizePanel";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useTransitionSound } from "@/hooks/useTransitionSound";
import { useSoundSettings } from "@/hooks/useSoundSettings";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

interface SearchResult {
  title: string;
  url: string;
  description: string;
}

interface ImageResult {
  title: string;
  url: string;
  thumbnail: string;
  source: string;
}

const Index = () => {
  const [viewState, setViewState] = useState<"home" | "results">("home");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [imageResults, setImageResults] = useState<ImageResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const [safeSearch] = useLocalStorage("ridel-safe-search", true);
  const [activeTab, setActiveTab] = useState<SearchTab>("all");
  const [dateRange, setDateRange] = useState<DateRange>("any");
  const [user, setUser] = useState<User | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [showCustomize, setShowCustomize] = useState(false);
  const [showTransitionOverlay, setShowTransitionOverlay] = useState(false);
  const [showRidelTransition, setShowRidelTransition] = useState(false);
  const [showMobileApps, setShowMobileApps] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const signInButtonRef = useRef<HTMLButtonElement>(null);
  const [buttonPosition, setButtonPosition] = useState({ x: 0, y: 0 });
  const [ridelButtonPosition, setRidelButtonPosition] = useState({ x: 0, y: 0 });
  const navigate = useNavigate();
  const { playWhooshSound, playClickSound } = useTransitionSound();
  const { soundEnabled } = useSoundSettings();
  const isMobile = useIsMobile();

  // Check auth state
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Keyboard shortcuts
  const focusSearch = useCallback(() => {
    searchInputRef.current?.focus();
  }, []);

  const toggleBookmarks = useCallback(() => {
    setShowBookmarks((prev) => !prev);
  }, []);

  const toggleFavorites = useCallback(() => {
    setShowFavorites((prev) => !prev);
  }, []);

  const handleAskAI = useCallback(() => {
    window.location.href = "https://ridelai.lovable.app/";
  }, []);

  useKeyboardShortcuts({
    onFocusSearch: focusSearch,
    onToggleBookmarks: toggleBookmarks,
  });

  const saveSearchHistory = async (query: string) => {
    if (!user) return;
    try {
      await supabase.from("search_history").insert({
        user_id: user.id,
        query: query.trim(),
      });
    } catch (error) {
      console.error("Error saving search history:", error);
    }
  };

  const performSearch = async (query: string, goToFirst = false, tab: SearchTab = activeTab, date: DateRange = dateRange) => {
    // Navigate to search page with query params
    if (soundEnabled) playWhooshSound();
    setIsTransitioning(true);
    
    setTimeout(() => {
      navigate(`/search?q=${encodeURIComponent(query)}&tab=${tab}`);
    }, 600);
  };

  const performSearchDirect = async (query: string, goToFirst = false, tab: SearchTab = activeTab, date: DateRange = dateRange) => {
    setSearchQuery(query);
    setLoading(true);
    setError(null);

    // Save to search history for signed-in users
    saveSearchHistory(query);

    try {
      if (tab === "images") {
        // Only image search
        const { data, error: fnError } = await supabase.functions.invoke("image-search", {
          body: { query, safeSearch },
        });

        if (fnError) throw new Error(fnError.message);

        if (data.success && data.results) {
          setImageResults(data.results);
          setResults([]);
        } else {
          setError(data.error || "Image search failed");
          setImageResults([]);
        }
      } else if (tab === "all") {
        // Fetch both web and image results in parallel for mixed view
        const [webResponse, imageResponse] = await Promise.all([
          supabase.functions.invoke("search", {
            body: { query, safeSearch, dateRange: date },
          }),
          supabase.functions.invoke("image-search", {
            body: { query, safeSearch },
          }),
        ]);

        if (webResponse.error) throw new Error(webResponse.error.message);

        if (webResponse.data.success && webResponse.data.results) {
          setResults(webResponse.data.results);
          
          if (goToFirst && webResponse.data.results.length > 0) {
            window.location.href = webResponse.data.results[0].url;
          }
        } else {
          setError(webResponse.data.error || "Search failed");
          setResults([]);
        }

        // Set image results (non-blocking)
        if (imageResponse.data?.success && imageResponse.data?.results) {
          setImageResults(imageResponse.data.results);
        } else {
          setImageResults([]);
        }
      } else {
        // Other tabs - just web search
        const { data, error: fnError } = await supabase.functions.invoke("search", {
          body: { query, safeSearch, dateRange: date },
        });

        if (fnError) throw new Error(fnError.message);

        if (data.success && data.results) {
          setResults(data.results);
          setImageResults([]);
          
          if (goToFirst && data.results.length > 0) {
            window.location.href = data.results[0].url;
          }
        } else {
          setError(data.error || "Search failed");
          setResults([]);
        }
      }
    } catch (err) {
      console.error("Search error:", err);
      setError("Failed to perform search. Please try again.");
      setResults([]);
      setImageResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    performSearch(query, false);
  };

  const handleLucky = (query: string) => {
    performSearch(query, true);
  };

  const handleNavigate = (url: string) => {
    window.location.href = url;
  };

  const handleResultClick = (url: string) => {
    window.location.href = url;
  };

  const handleGoHome = () => {
    setViewState("home");
    setSearchQuery("");
    setResults([]);
    setImageResults([]);
    setError(null);
    setActiveTab("all");
    setDateRange("any");
  };

  const handleTabChange = (tab: SearchTab) => {
    setActiveTab(tab);
    if (searchQuery) {
      performSearch(searchQuery, false, tab);
    }
  };

  const handleDateChange = (date: DateRange) => {
    setDateRange(date);
    if (searchQuery && activeTab === "all") {
      performSearch(searchQuery, false, activeTab, date);
    }
  };

  const handleAuthNavigate = (e: React.MouseEvent<HTMLButtonElement>) => {
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    setButtonPosition({
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    });
    if (soundEnabled) playClickSound();
    setIsExiting(true);
    setShowTransitionOverlay(true);
    
    setTimeout(() => {
      if (soundEnabled) playWhooshSound();
    }, 100);
    
    setTimeout(() => {
      navigate("/auth");
    }, 800);
  };

  const handleRidelNavigate = (e: React.MouseEvent<HTMLButtonElement>) => {
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    setRidelButtonPosition({
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    });
    if (soundEnabled) playClickSound();
    setIsExiting(true);
    setShowRidelTransition(true);
    
    setTimeout(() => {
      if (soundEnabled) playWhooshSound();
    }, 100);
    
    setTimeout(() => {
      window.location.href = "https://ridelai.lovable.app/";
    }, 800);
  };

  const renderControls = (vertical = false, iconsOnly = false) => (
    <div className={`flex ${vertical ? 'flex-col' : ''} items-center gap-3`}>
      <SettingsDialog onOpenSearchHistory={user ? () => navigate("/history") : undefined} />
      <motion.button
        onClick={() => setShowBookmarks(true)}
        className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
        aria-label="Bookmarks (Ctrl+B)"
        title="Bookmarks (Ctrl+B)"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
      >
        <Bookmark className="h-5 w-5" />
      </motion.button>
      <motion.button
        onClick={() => setShowFavorites(true)}
        className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
        aria-label="Pinned Searches"
        title="Pinned Searches"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
      >
        <Star className="h-5 w-5" />
      </motion.button>
      {user && (
        <motion.button
          onClick={() => navigate("/history")}
          className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
          aria-label="Search History"
          title="Search History"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          <History className="h-5 w-5" />
        </motion.button>
      )}
      <GoogleAppsGrid openDirection={vertical ? "right" : "left"} />
      {user ? (
        <motion.div
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          <Link
            to="/profile"
            className="inline-flex items-center justify-center w-10 h-10 rounded-full overflow-hidden hover:ring-2 ring-primary transition-colors"
            title="View profile"
          >
            <img 
              src={user.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${user.email}`} 
              alt="Profile" 
              className="w-10 h-10 rounded-full"
            />
          </Link>
        </motion.div>
      ) : iconsOnly ? (
        <motion.button
          onClick={handleAuthNavigate}
          className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-card hover:bg-secondary border border-border transition-colors"
          title="Sign in with Google"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
        </motion.button>
      ) : (
        <motion.button
          onClick={handleAuthNavigate}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-card hover:bg-secondary text-foreground border border-border font-medium text-sm shadow-sm hover:shadow transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Sign in
        </motion.button>
      )}
      {iconsOnly ? (
        <motion.button
          onClick={handleRidelNavigate}
          className="inline-flex items-center justify-center w-10 h-10 rounded-full text-white shadow-lg hover:shadow-xl transition-shadow"
          style={{
            background: "linear-gradient(135deg, #4285F4 0%, #EA4335 33%, #FBBC05 66%, #34A853 100%)",
          }}
          title="Chat with Ridel AI"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
          </svg>
        </motion.button>
      ) : (
        <motion.button
          onClick={handleRidelNavigate}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-white font-medium text-sm shadow-lg hover:shadow-xl transition-shadow"
          style={{
            background: "linear-gradient(135deg, #4285F4 0%, #EA4335 33%, #FBBC05 66%, #34A853 100%)",
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
          </svg>
          Chat with Ridel AI
        </motion.button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-transparent overflow-x-hidden">
      {/* App-only Tab Navigation - Both Mobile and Desktop */}
      <AppTabs 
        currentQuery={searchQuery}
        onTabChange={(tab) => {
          if (tab.query) {
            setSearchQuery(tab.query);
          } else {
            handleGoHome();
          }
        }}
        onNewTab={handleGoHome}
      />
      <AnimatePresence mode="wait">
        {viewState === "home" && !isTransitioning && (
          <motion.div
            key="home"
            className={`min-h-screen ${isMobile ? 'pb-24' : ''}`}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Desktop top bar - hidden on mobile */}
            {!isMobile && (
              <motion.div 
                className="absolute top-4 right-4 flex items-center gap-3 z-20"
                initial={{ opacity: 0, y: -20 }}
                animate={isExiting ? { scale: 1.5, opacity: 0 } : { scale: 1, opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              >
                {renderControls()}
              </motion.div>
            )}

            {/* Mobile top bar with customize and settings */}
            {isMobile && (
              <motion.div 
                className="absolute top-4 right-4 flex items-center gap-2 z-20"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <motion.button
                  onClick={() => setShowCustomize(true)}
                  className="p-3 rounded-full bg-secondary/80 backdrop-blur-sm"
                  whileTap={{ scale: 0.9 }}
                >
                  <Palette className="h-5 w-5 text-muted-foreground" />
                </motion.button>
                <SettingsDialog onOpenSearchHistory={user ? () => navigate("/history") : undefined} />
              </motion.div>
            )}

            {/* Keyboard shortcuts hint - desktop only */}
            {!isMobile && (
              <motion.div 
                className="absolute bottom-4 left-4 text-xs text-muted-foreground hidden md:block"
                initial={{ opacity: 0, y: 20 }}
                animate={isExiting ? { opacity: 0, y: 20 } : { opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
              >
                <span className="opacity-60">Press</span> <kbd className="px-1.5 py-0.5 rounded bg-secondary text-foreground">/</kbd> <span className="opacity-60">to search,</span> <kbd className="px-1.5 py-0.5 rounded bg-secondary text-foreground">Ctrl+B</kbd> <span className="opacity-60">for bookmarks</span>
              </motion.div>
            )}

            <motion.div 
              className={`flex flex-col items-center justify-center min-h-screen ${isMobile ? 'px-4 pt-16' : 'px-4'}`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={isExiting ? { scale: 1.1, opacity: 0 } : { scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <motion.div 
                className={isMobile ? "mb-6" : "mb-8"}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.4 }}
              >
                <RidelLogo size={isMobile ? "medium" : "large"} />
              </motion.div>
              <motion.p 
                className={`text-muted-foreground ${isMobile ? 'text-base mb-6' : 'text-lg mb-8'}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.4 }}
              >
                Search the web
              </motion.p>
              <motion.div
                className="w-full"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.4 }}
              >
                {isMobile ? (
                  <MobileSearchBar
                    onSearch={handleSearch}
                    onLucky={handleLucky}
                    onNavigate={handleNavigate}
                    inputRef={searchInputRef}
                    onAskAI={handleAskAI}
                  />
                ) : (
                  <SearchBar
                    onSearch={handleSearch}
                    onLucky={handleLucky}
                    onNavigate={handleNavigate}
                    inputRef={searchInputRef}
                    onAskAI={handleAskAI}
                  />
                )}
              </motion.div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.4 }}
              >
                <QuickShortcuts onNavigate={handleNavigate} />
              </motion.div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.4 }}
              >
                <TrendingSearches onSearch={handleSearch} />
              </motion.div>
            </motion.div>
          </motion.div>
        )}

        {/* Transition animation overlay */}
        {isTransitioning && (
          <motion.div
            key="transition"
            className="fixed inset-0 z-50 flex flex-col items-center justify-center px-4"
          >
            {/* Logo animating to corner */}
            <motion.div
              className="absolute"
              initial={{ 
                top: "50%", 
                left: "50%", 
                x: "-50%", 
                y: "-50%",
                scale: 1 
              }}
              animate={{ 
                top: "1.5rem", 
                left: "5rem", 
                x: "0%", 
                y: "0%",
                scale: 0.35
              }}
              transition={{ 
                duration: 0.5, 
                ease: [0.32, 0.72, 0, 1]
              }}
            >
              <RidelLogo size="large" />
            </motion.div>

            {/* Search bar animating to top */}
            <motion.div
              className="w-full max-w-2xl"
              initial={{ 
                y: 0,
                scale: 1
              }}
              animate={{ 
                y: "-40vh",
                scale: 0.9
              }}
              transition={{ 
                duration: 0.5, 
                ease: [0.32, 0.72, 0, 1]
              }}
            >
              <SearchBar
                onSearch={handleSearch}
                onLucky={handleLucky}
                onNavigate={handleNavigate}
                initialQuery={searchQuery}
                compact
                inputRef={searchInputRef}
              />
            </motion.div>

            {/* Fade out other elements */}
            <motion.div
              className="absolute inset-0 bg-background"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              style={{ zIndex: -1 }}
            />
          </motion.div>
        )}

        {viewState === "results" && !isTransitioning && (
          <motion.div 
            key="results"
            className="flex min-h-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {/* Sidebar toggle button (always visible) */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden md:flex fixed left-0 top-1/2 -translate-y-1/2 z-40 items-center justify-center w-6 h-12 bg-secondary hover:bg-secondary/80 rounded-r-lg border border-l-0 border-border transition-all duration-300"
            style={{ left: sidebarCollapsed ? 0 : '3.5rem' }}
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>

          {/* Sidebar with controls */}
          <aside className={`hidden md:flex flex-col gap-3 p-3 border-r border-border bg-background/50 transition-all duration-300 ${sidebarCollapsed ? 'w-0 p-0 overflow-hidden border-0' : 'w-14'}`}>
            {renderControls(true, true)}
          </aside>

          {/* Main content */}
          <div className="flex-1 max-w-4xl px-4 py-6">
            <div className="flex items-center gap-6 mb-4">
              <button onClick={handleGoHome}>
                <RidelLogo size="small" />
              </button>
              <div className="flex-1">
                <SearchBar
                  onSearch={handleSearch}
                  onLucky={handleLucky}
                  onNavigate={handleNavigate}
                  initialQuery={searchQuery}
                  compact
                  inputRef={searchInputRef}
                />
              </div>
              {/* Mobile controls */}
              <div className="flex md:hidden items-center gap-2">
                <SettingsDialog />
                <button
                  onClick={() => setShowBookmarks(true)}
                  className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-secondary"
                >
                  <Bookmark className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <SearchTabs activeTab={activeTab} onTabChange={handleTabChange} />
            
            {activeTab === "all" && (
              <div className="flex items-center gap-4 py-3 border-b border-border">
                <DateFilter value={dateRange} onChange={handleDateChange} />
              </div>
            )}
            
            {activeTab === "all" && (
              <>
                <AISummary query={searchQuery} results={results} />
                <MixedSearchResults
                  webResults={results}
                  imageResults={imageResults}
                  loading={loading}
                  error={error}
                  onResultClick={handleResultClick}
                />
              </>
            )}
            
            {activeTab === "images" && (
              <ImageResults
                results={imageResults}
                loading={loading}
                error={error}
              />
            )}
            
            {(activeTab === "news" || activeTab === "videos") && (
              <div className="py-12 text-center">
                <p className="text-muted-foreground">
                  {activeTab === "news" ? "News" : "Video"} search coming soon!
                </p>
              </div>
            )}
          </div>
          </motion.div>
        )}
      </AnimatePresence>

      <BookmarksPanel
        isOpen={showBookmarks}
        onClose={() => setShowBookmarks(false)}
        onNavigate={handleNavigate}
      />

      <FavoritesPanel
        isOpen={showFavorites}
        onClose={() => setShowFavorites(false)}
        onSearch={handleSearch}
      />

      {/* Sign-in transition overlay */}
      <AnimatePresence>
        {showTransitionOverlay && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-card rounded-full flex items-center justify-center"
              initial={{ 
                width: 40, 
                height: 40,
                x: buttonPosition.x - window.innerWidth / 2,
                y: buttonPosition.y - window.innerHeight / 2,
              }}
              animate={{ 
                width: Math.max(window.innerWidth, window.innerHeight) * 2.5,
                height: Math.max(window.innerWidth, window.innerHeight) * 2.5,
                x: 0,
                y: 0,
              }}
              transition={{ 
                duration: 0.6, 
                ease: [0.4, 0, 0.2, 1],
              }}
            >
              <motion.div
                className="relative"
                initial={{ opacity: 1, scale: 1 }}
                animate={{ opacity: 0, scale: 0.5 }}
                transition={{ delay: 0.3, duration: 0.3 }}
              >
                <svg className="w-8 h-8" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              </motion.div>
              <motion.div
                className="absolute"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.2 }}
              >
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ridel AI transition overlay */}
      <AnimatePresence>
        {showRidelTransition && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="rounded-full flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, #4285F4 0%, #EA4335 33%, #FBBC05 66%, #34A853 100%)",
              }}
              initial={{ 
                width: 40, 
                height: 40,
                x: ridelButtonPosition.x - window.innerWidth / 2,
                y: ridelButtonPosition.y - window.innerHeight / 2,
              }}
              animate={{ 
                width: Math.max(window.innerWidth, window.innerHeight) * 2.5,
                height: Math.max(window.innerWidth, window.innerHeight) * 2.5,
                x: 0,
                y: 0,
              }}
              transition={{ 
                duration: 0.6, 
                ease: [0.4, 0, 0.2, 1],
              }}
            >
              <motion.div
                className="relative"
                initial={{ opacity: 1, scale: 1 }}
                animate={{ opacity: 0, scale: 0.5 }}
                transition={{ delay: 0.3, duration: 0.3 }}
              >
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
                </svg>
              </motion.div>
              <motion.div
                className="absolute"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.2 }}
              >
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop customize button - hidden on mobile */}
      {!isMobile && <CustomizeButton onClick={() => setShowCustomize(true)} />}
      <CustomizePanel isOpen={showCustomize} onClose={() => setShowCustomize(false)} />

      {/* Mobile bottom navigation */}
      {isMobile && viewState === "home" && !isTransitioning && (
        <MobileBottomNav
          user={user}
          onOpenBookmarks={() => setShowBookmarks(true)}
          onOpenFavorites={() => setShowFavorites(true)}
          onOpenSettings={() => {}}
          onOpenApps={() => setShowMobileApps(true)}
        />
      )}

      {/* Mobile apps sheet */}
      <MobileAppsSheet
        isOpen={showMobileApps}
        onClose={() => setShowMobileApps(false)}
        onNavigate={handleNavigate}
      />
    </div>
  );
};

export default Index;
