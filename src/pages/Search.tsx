import { useState, useRef, useCallback, useEffect } from "react";
import { Bookmark, ChevronLeft, ChevronRight, Loader2, History, Star } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import RidelLogo from "@/components/RidelLogo";
import SearchBar from "@/components/SearchBar";
import MobileSearchBar from "@/components/MobileSearchBar";
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

interface VideoResult {
  title: string;
  url: string;
  thumbnail: string;
  duration: string;
  source: string;
  embedUrl: string | null;
}

const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const initialTab = (searchParams.get("tab") as SearchTab) || "all";
  
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [imageResults, setImageResults] = useState<ImageResult[]>([]);
  const [videoResults, setVideoResults] = useState<VideoResult[]>([]);
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
        const [webResponse, imageResponse, videoResponse] = await Promise.all([
          supabase.functions.invoke("search", {
            body: { query, safeSearch, dateRange: date },
          }),
          supabase.functions.invoke("image-search", {
            body: { query, safeSearch },
          }),
          supabase.functions.invoke("video-search", {
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

        if (videoResponse.data?.success && videoResponse.data?.results) {
          setVideoResults(videoResponse.data.results);
        } else {
          setVideoResults([]);
        }
      } else if (tab === "videos") {
        const { data, error: fnError } = await supabase.functions.invoke("video-search", {
          body: { query, safeSearch },
        });

        if (fnError) throw new Error(fnError.message);

        if (data.success && data.results) {
          setVideoResults(data.results);
          setResults([]);
          setImageResults([]);
        } else {
          setError(data.error || "Video search failed");
          setVideoResults([]);
        }
      } else {
        const { data, error: fnError } = await supabase.functions.invoke("search", {
          body: { query, safeSearch, dateRange: date },
        });

        if (fnError) throw new Error(fnError.message);

        if (data.success && data.results) {
          setResults(data.results);
          setImageResults([]);
          setVideoResults([]);
          
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
      setVideoResults([]);
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
    <div className="min-h-screen bg-background overflow-x-hidden">
      <div className="flex min-h-screen">
        {/* Sidebar toggle - desktop only */}
        {!isMobile && (
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden md:flex fixed left-0 top-1/2 -translate-y-1/2 z-40 items-center justify-center w-6 h-12 bg-secondary hover:bg-secondary/80 rounded-r-lg border border-l-0 border-border transition-all duration-300"
            style={{ left: sidebarCollapsed ? 0 : '3.5rem' }}
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        )}

        {/* Sidebar - desktop only */}
        {!isMobile && (
          <aside className={`hidden md:flex flex-col gap-3 p-3 border-r border-border bg-background/50 transition-all duration-300 ${sidebarCollapsed ? 'w-0 p-0 overflow-hidden border-0' : 'w-14'}`}>
            {renderControls(true, true)}
          </aside>
        )}

        {/* Main content */}
        <div className={`flex-1 w-full ${isMobile ? 'px-3 py-3' : 'max-w-4xl px-4 py-6'} overflow-x-hidden`}>
          {/* Mobile header */}
          {isMobile ? (
            <div className="flex flex-col gap-3 mb-3">
              <div className="flex items-center justify-between">
                <button onClick={handleGoHome} className="flex-shrink-0">
                  <RidelLogo size="small" />
                </button>
                <div className="flex items-center gap-2">
                  <SettingsDialog />
                  <button
                    onClick={() => setShowBookmarks(true)}
                    className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-secondary"
                  >
                    <Bookmark className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <MobileSearchBar
                onSearch={handleSearch}
                onLucky={handleLucky}
                onNavigate={handleNavigate}
                initialQuery={searchQuery}
                compact
                inputRef={searchInputRef}
              />
            </div>
          ) : (
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
              {/* Desktop controls are in sidebar */}
            </div>
          )}
          
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
                videoResults={videoResults}
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
          
          {activeTab === "videos" && (
            <div className="py-4">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                  <span className="ml-3 text-muted-foreground">Searching videos...</span>
                </div>
              ) : error ? (
                <p className="text-destructive text-center py-8">{error}</p>
              ) : videoResults.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No video results found.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {videoResults.map((video, index) => (
                    <div
                      key={index}
                      className="group cursor-pointer rounded-lg overflow-hidden bg-card border border-border hover:border-primary/50 transition-colors"
                      onClick={() => window.open(video.url, '_blank')}
                    >
                      <div className="aspect-video relative">
                        <img
                          src={video.thumbnail}
                          alt={video.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors">
                          <div className="w-14 h-14 rounded-full bg-red-600 flex items-center justify-center shadow-lg">
                            <svg className="h-7 w-7 text-white ml-1" fill="white" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z"/>
                            </svg>
                          </div>
                        </div>
                        {video.duration && (
                          <span className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded">
                            {video.duration}
                          </span>
                        )}
                      </div>
                      <div className="p-3">
                        <p className="font-medium line-clamp-2">{video.title}</p>
                        <p className="text-sm text-muted-foreground mt-1">{video.source}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {activeTab === "news" && (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">News search coming soon!</p>
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
