import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search as SearchIcon, X, Mic, Settings, SlidersHorizontal, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import KnowledgePanel from "@/components/KnowledgePanel";
import AISummary from "@/components/AISummary";

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

interface KnowledgePanelData {
  title: string;
  subtitle?: string;
  description?: string;
  image?: string;
  images?: string[];
  source?: string;
  sourceUrl?: string;
  attributes?: { label: string; value: string }[];
}

type Tab = "ask" | "all" | "images" | "news" | "videos" | "goggles";

const TABS: { id: Tab; label: string }[] = [
  { id: "ask", label: "Ask" },
  { id: "all", label: "All" },
  { id: "images", label: "Images" },
  { id: "news", label: "News" },
  { id: "videos", label: "Videos" },
  { id: "goggles", label: "Goggles" },
];

const getHostname = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
};

const getFavicon = (url: string) => {
  try {
    const host = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${host}&sz=64`;
  } catch {
    return "";
  }
};

const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialQuery = searchParams.get("q") || "";
  const initialTab = (searchParams.get("tab") as Tab) || "all";

  const [query, setQuery] = useState(initialQuery);
  const [inputValue, setInputValue] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [imageResults, setImageResults] = useState<ImageResult[]>([]);
  const [knowledge, setKnowledge] = useState<KnowledgePanelData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const performSearch = useCallback(async (q: string, tab: Tab) => {
    if (!q.trim()) return;
    setLoading(true);
    setError(null);
    setKnowledge(null);
    try {
      if (tab === "images") {
        const { data, error: fnError } = await supabase.functions.invoke("image-search", {
          body: { query: q, safeSearch: true },
        });
        if (fnError) throw new Error(fnError.message);
        setImageResults(data?.results || []);
        setResults([]);
      } else {
        const [webRes, imgRes] = await Promise.all([
          supabase.functions.invoke("search", { body: { query: q, safeSearch: true } }),
          tab === "all"
            ? supabase.functions.invoke("image-search", { body: { query: q, safeSearch: true } })
            : Promise.resolve({ data: null }),
        ]);
        if (webRes.error) throw new Error(webRes.error.message);
        if (webRes.data?.success) {
          setResults(webRes.data.results || []);
          if (webRes.data.knowledgePanel) setKnowledge(webRes.data.knowledgePanel);
        } else {
          setError(webRes.data?.error || "Search failed");
          setResults([]);
        }
        setImageResults(imgRes?.data?.results || []);
      }
    } catch (e) {
      console.error(e);
      setError("Failed to perform search.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
      setInputValue(initialQuery);
      performSearch(initialQuery, activeTab);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    setQuery(inputValue);
    setSearchParams({ q: inputValue, tab: activeTab });
    performSearch(inputValue, activeTab);
  };

  const handleTab = (tab: Tab) => {
    setActiveTab(tab);
    if (query) {
      setSearchParams({ q: query, tab });
      performSearch(query, tab);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top bar */}
      <header className="px-6 py-4 flex items-center gap-6 border-b border-border/40">
        {/* Logo */}
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 shrink-0 hover:opacity-80 transition-opacity"
        >
          <img src="/favicon.ico" alt="RidelL" className="w-9 h-9 rounded-lg" />
          <span className="text-2xl font-semibold tracking-tight hidden sm:inline">ridel</span>
        </button>

        {/* Search bar */}
        <form onSubmit={handleSubmit} className="flex-1 max-w-3xl">
          <div className="flex items-center gap-2 bg-secondary/60 hover:bg-secondary rounded-full px-5 py-3 transition-colors focus-within:bg-secondary focus-within:ring-2 focus-within:ring-primary/40">
            <input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
              placeholder="Search the web"
              autoFocus
            />
            {inputValue && (
              <button
                type="button"
                onClick={() => setInputValue("")}
                className="p-1 rounded-full hover:bg-background/40 text-muted-foreground"
                aria-label="Clear"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              type="submit"
              className="p-1 rounded-full hover:bg-background/40 text-muted-foreground"
              aria-label="Search"
            >
              <SearchIcon className="w-5 h-5" />
            </button>
            <button
              type="button"
              className="p-1.5 rounded-full bg-background/60 text-muted-foreground hover:text-foreground"
              aria-label="Voice search"
            >
              <Mic className="w-4 h-4" />
            </button>
          </div>
        </form>

        {/* Right controls */}
        <div className="flex items-center gap-2 ml-auto shrink-0">
          <button
            className="p-2 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Filters"
          >
            <SlidersHorizontal className="w-5 h-5" />
          </button>
          <button
            className="p-2 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="px-6 border-b border-border/40">
        <div className="max-w-3xl ml-[calc(2.5rem+1rem)] flex items-center gap-1 overflow-x-auto scrollbar-hide">
          {TABS.map((t) => {
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => handleTab(t.id)}
                className={`px-4 py-3 text-sm font-medium rounded-full transition-colors whitespace-nowrap ${
                  active
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                }`}
              >
                {t.label}
              </button>
            );
          })}
          <button
            className="ml-auto p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
            aria-label="More filters"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Body */}
      <main className="px-6 py-6">
        <div className="flex gap-8 max-w-7xl mx-auto">
          {/* Left column: results */}
          <div className="flex-1 max-w-2xl">
            {!loading && !error && activeTab === "ask" && query && results.length > 0 && (
              <AISummary query={query} results={results} />
            )}

            {loading && (
              <div className="flex items-center gap-2 text-muted-foreground py-8">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Searching…</span>
              </div>
            )}

            {error && !loading && (
              <p className="text-destructive py-4">{error}</p>
            )}

            {!loading && !error && activeTab === "images" && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {imageResults.map((img, i) => (
                  <a
                    key={i}
                    href={img.url}
                    target="_blank"
                    rel="noreferrer"
                    className="group block rounded-lg overflow-hidden bg-card aspect-square"
                  >
                    <img
                      src={img.thumbnail}
                      alt={img.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </a>
                ))}
                {imageResults.length === 0 && (
                  <p className="text-muted-foreground col-span-full">No images found.</p>
                )}
              </div>
            )}

            {!loading && !error && activeTab !== "images" && (
              <div className="space-y-7">
                {results.map((r, i) => (
                  <article key={i}>
                    <div className="flex items-center gap-2.5 mb-1.5">
                      <img
                        src={getFavicon(r.url)}
                        alt=""
                        className="w-6 h-6 rounded-full bg-card p-0.5"
                        onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
                      />
                      <div className="text-sm leading-tight">
                        <div className="text-foreground font-medium">{getHostname(r.url)}</div>
                        <div className="text-xs text-muted-foreground truncate max-w-md">
                          {getHostname(r.url)} › {r.url.split("/").slice(3, 5).join(" › ")}
                        </div>
                      </div>
                    </div>
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noreferrer"
                      className="block text-xl text-primary hover:underline leading-snug mb-1"
                    >
                      {r.title}
                    </a>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {r.description}
                    </p>
                  </article>
                ))}
                {results.length === 0 && query && (
                  <p className="text-muted-foreground">No results found.</p>
                )}
              </div>
            )}
          </div>

          {/* Right column: knowledge panel */}
          {knowledge && !loading && (
            <aside className="hidden lg:block w-[360px] shrink-0">
              <div className="bg-card border border-border/60 rounded-2xl p-6 sticky top-6">
                <KnowledgePanel data={knowledge} onNavigate={(u) => (window.location.href = u)} />
              </div>
            </aside>
          )}
        </div>
      </main>
    </div>
  );
};

export default Search;
