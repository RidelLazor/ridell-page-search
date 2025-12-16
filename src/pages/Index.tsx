import { useState, useRef, useCallback } from "react";
import { Bookmark } from "lucide-react";
import RidelLogo from "@/components/RidelLogo";
import SearchBar from "@/components/SearchBar";
import SearchResults from "@/components/SearchResults";
import ThemeToggle from "@/components/ThemeToggle";
import BookmarksPanel from "@/components/BookmarksPanel";
import SafeSearchToggle from "@/components/SafeSearchToggle";
import QuickShortcuts from "@/components/QuickShortcuts";
import AISummary from "@/components/AISummary";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { supabase } from "@/integrations/supabase/client";

interface SearchResult {
  title: string;
  url: string;
  description: string;
}

const Index = () => {
  const [viewState, setViewState] = useState<"home" | "results">("home");
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [safeSearch] = useLocalStorage("ridel-safe-search", true);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcuts
  const focusSearch = useCallback(() => {
    searchInputRef.current?.focus();
  }, []);

  const toggleBookmarks = useCallback(() => {
    setShowBookmarks((prev) => !prev);
  }, []);

  useKeyboardShortcuts({
    onFocusSearch: focusSearch,
    onToggleBookmarks: toggleBookmarks,
  });

  const performSearch = async (query: string, goToFirst = false) => {
    setSearchQuery(query);
    setLoading(true);
    setError(null);
    setViewState("results");

    try {
      const { data, error: fnError } = await supabase.functions.invoke("search", {
        body: { query, safeSearch },
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (data.success && data.results) {
        setResults(data.results);
        
        if (goToFirst && data.results.length > 0) {
          window.location.href = data.results[0].url;
        }
      } else {
        setError(data.error || "Search failed");
        setResults([]);
      }
    } catch (err) {
      console.error("Search error:", err);
      setError("Failed to perform search. Please try again.");
      setResults([]);
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
    setError(null);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar with Safe Search, Bookmarks, Theme toggle, and Chat button */}
      <div className="absolute top-4 right-4 flex items-center gap-3">
        <SafeSearchToggle />
        <button
          onClick={() => setShowBookmarks(true)}
          className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-secondary hover:bg-secondary/80 transition-all duration-300 hover:scale-105"
          aria-label="Bookmarks (Ctrl+B)"
          title="Bookmarks (Ctrl+B)"
        >
          <Bookmark className="h-5 w-5" />
        </button>
        <ThemeToggle />
        <a
          href="https://ridelai.lovable.app/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-white font-medium text-sm shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
          style={{
            background: "linear-gradient(135deg, #4285F4 0%, #EA4335 33%, #FBBC05 66%, #34A853 100%)",
          }}
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
          </svg>
          Chat with Ridel AI
        </a>
      </div>

      {/* Keyboard shortcuts hint */}
      <div className="absolute bottom-4 left-4 text-xs text-muted-foreground hidden md:block">
        <span className="opacity-60">Press</span> <kbd className="px-1.5 py-0.5 rounded bg-secondary text-foreground">/</kbd> <span className="opacity-60">to search,</span> <kbd className="px-1.5 py-0.5 rounded bg-secondary text-foreground">Ctrl+B</kbd> <span className="opacity-60">for bookmarks</span>
      </div>

      {viewState === "home" && (
        <div className="flex flex-col items-center justify-center min-h-screen px-4">
          <div className="mb-8">
            <RidelLogo size="large" />
          </div>
          <p className="text-lg text-muted-foreground mb-8">Search the web</p>
          <SearchBar
            onSearch={handleSearch}
            onLucky={handleLucky}
            onNavigate={handleNavigate}
            inputRef={searchInputRef}
          />
          <QuickShortcuts onNavigate={handleNavigate} />
        </div>
      )}

      {viewState === "results" && (
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-6 mb-6">
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
          </div>
          
          <div className="border-b mb-4" />
          
          <AISummary query={searchQuery} results={results} />
          
          <SearchResults
            results={results}
            loading={loading}
            error={error}
            onResultClick={handleResultClick}
          />
        </div>
      )}

      <BookmarksPanel
        isOpen={showBookmarks}
        onClose={() => setShowBookmarks(false)}
        onNavigate={handleNavigate}
      />
    </div>
  );
};

export default Index;
