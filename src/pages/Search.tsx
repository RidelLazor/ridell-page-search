import { useState, useRef, useCallback, useEffect } from "react";
import { Bookmark, ChevronLeft, ChevronRight, Loader2, History, Star } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import RidelLogo from "@/components/RidelLogo";
import SearchBar from "@/components/SearchBar";
import MixedSearchResults from "@/components/MixedSearchResults";
import BookmarksPanel from "@/components/BookmarksPanel";
import FavoritesPanel from "@/components/FavoritesPanel";
import SettingsDialog from "@/components/SettingsDialog";
import AISummary from "@/components/AISummary";
import SearchTabs, { SearchTab } from "@/components/SearchTabs";
import DateFilter, { DateRange } from "@/components/DateFilter";
import ImageResults from "@/components/ImageResults";
import GoogleAppsGrid from "@/components/GoogleAppsGrid";
import { CustomizeButton, CustomizePanel } from "@/components/CustomizePanel";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useTransitionSound } from "@/hooks/useTransitionSound";
import { useSoundSettings } from "@/hooks/useSoundSettings";
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

const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const initialTab = (searchParams.get("tab") as SearchTab) || "all";
  
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [imageResults, setImageResults] = useState<ImageResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const [safeSearch] = useLocalStorage("ridel-safe-search", true);
  const [activeTab, setActiveTab] = useState<SearchTab>(initialTab);
  const [dateRange, setDateRange] = useState<DateRange>("any");
  const [user, setUser] = useState<User | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showCustomize, setShowCustomize] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { playWhooshSound } = useTransitionSound();
  const { soundEnabled } = useSoundSettings();

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

  // Perform search on mount or when query changes
  useEffect(() => {
    if (initialQuery) {
      performSearch(initialQuery, false, activeTab);
    }
  }, []);

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
    setSearchQuery(query);
    setLoading(true);
    setError(null);
    
    // Update URL
    setSearchParams({ q: query, tab });

    // Save to search history for signed-in users
    saveSearchHistory(query);

    try {
      if (tab === "images") {
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

        if (imageResponse.data?.success && imageResponse.data?.results) {
          setImageResults(imageResponse.data.results);
        } else {
          setImageResults([]);
        }
      } else {
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
    navigate("/");
  };

  const handleTabChange = (tab: SearchTab) => {
    setActiveTab(tab);
    setSearchParams({ q: searchQuery, tab });
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

  const renderControls = (vertical = false, iconsOnly = false) => (
    <div className={`flex ${vertical ? 'flex-col' : ''} items-center gap-3`}>
      <SettingsDialog onOpenSearchHistory={user ? () => navigate("/history") : undefined} />
      <motion.button
        onClick={() => setShowBookmarks(true)}
        className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
        aria-label="Bookmarks"
        title="Bookmarks"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
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
        >
          <History className="h-5 w-5" />
        </motion.button>
      )}
      <GoogleAppsGrid openDirection={vertical ? "right" : "left"} />
      {user ? (
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
      ) : (
        <motion.button
          onClick={() => navigate("/auth")}
          className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white hover:bg-gray-50 border border-gray-300 transition-colors"
          title="Sign in"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
        </motion.button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="flex min-h-screen">
        {/* Sidebar toggle */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="hidden md:flex fixed left-0 top-1/2 -translate-y-1/2 z-40 items-center justify-center w-6 h-12 bg-secondary hover:bg-secondary/80 rounded-r-lg border border-l-0 border-border transition-all duration-300"
          style={{ left: sidebarCollapsed ? 0 : '3.5rem' }}
          title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>

        {/* Sidebar */}
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
      </div>

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

      <CustomizeButton onClick={() => setShowCustomize(true)} />
      <CustomizePanel isOpen={showCustomize} onClose={() => setShowCustomize(false)} />
    </div>
  );
};

export default Search;
