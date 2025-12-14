import { useState } from "react";
import RidelLogo from "@/components/RidelLogo";
import SearchBar from "@/components/SearchBar";
import SearchResults from "@/components/SearchResults";
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

  const performSearch = async (query: string, goToFirst = false) => {
    setSearchQuery(query);
    setLoading(true);
    setError(null);
    setViewState("results");

    try {
      const { data, error: fnError } = await supabase.functions.invoke("search", {
        body: { query },
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (data.success && data.results) {
        setResults(data.results);
        
        if (goToFirst && data.results.length > 0) {
          // Redirect directly to first result
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
    // Redirect directly to the URL on the same page
    window.location.href = url;
  };

  const handleResultClick = (url: string) => {
    // Redirect directly to the URL on the same page
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
          />
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
              />
            </div>
          </div>
          
          <div className="border-b mb-4" />
          
          <SearchResults
            results={results}
            loading={loading}
            error={error}
            onResultClick={handleResultClick}
          />
        </div>
      )}
    </div>
  );
};

export default Index;
