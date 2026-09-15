import { FormEvent, useCallback, useEffect, useState } from "react";
import { Loader2, Search as SearchIcon } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import ViolytraLogo from "@/components/ViolytraLogo";
import { supabase } from "@/integrations/supabase/client";

interface SearchResult {
  title: string;
  url: string;
  description: string;
}

const getHostname = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
};

const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") ?? "";
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const performSearch = useCallback(async (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    setLoading(true);
    setError(null);
    document.title = `${trimmed} - Violytra Search`;
    try {
      const { data, error: searchError } = await supabase.functions.invoke("search", {
        body: { query: trimmed, safeSearch: true },
      });
      if (searchError) throw searchError;
      if (!data?.success) throw new Error(data?.error ?? "Search failed");
      setResults(data.results ?? []);
    } catch (searchError) {
      console.error(searchError);
      setResults([]);
      setError("Search is unavailable right now. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setQuery(initialQuery);
    if (initialQuery) performSearch(initialQuery);
    else document.title = "Violytra Search";
  }, [initialQuery, performSearch]);

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    if (trimmed === initialQuery) performSearch(trimmed);
    else setSearchParams({ q: trimmed });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-10 flex items-center gap-5 border-b border-border bg-background px-4 py-3 sm:gap-7 sm:px-6 sm:py-[18px]">
        <ViolytraLogo compact />
        <form onSubmit={submitSearch} role="search" className="w-full max-w-[584px]">
          <label className="flex h-11 items-center rounded-full border border-border bg-background px-4 transition-shadow hover:shadow-search focus-within:shadow-search">
            <SearchIcon aria-hidden="true" className="mr-3 h-5 w-5 shrink-0 text-muted-foreground" />
            <span className="sr-only">Search the web</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              autoComplete="off"
              autoFocus
              className="min-w-0 flex-1 bg-transparent text-base outline-none"
              aria-label="Search the web"
            />
          </label>
        </form>
      </header>

      <main className="mx-auto w-[min(652px,92vw)] py-5 pb-16">
        {loading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Searching for <strong className="font-semibold text-foreground">{initialQuery}</strong>…
          </div>
        )}

        {!loading && error && <p className="text-base text-destructive">{error}</p>}

        {!loading && !error && initialQuery && (
          <>
            <p className="mb-[22px] text-sm text-muted-foreground">About {results.length} results</p>
            {results.length > 0 ? (
              <div>
                {results.map((result, index) => (
                  <article key={`${result.url}-${index}`} className="mb-[26px]">
                    <div className="flex items-center gap-2 text-xs text-result-url">
                      <img
                        src={`https://www.google.com/s2/favicons?sz=64&domain=${getHostname(result.url)}`}
                        alt=""
                        loading="lazy"
                        width={16}
                        height={16}
                        className="h-4 w-4 shrink-0 rounded-sm bg-secondary"
                        onError={(e) => { e.currentTarget.style.visibility = "hidden"; }}
                      />
                      <span className="truncate">{getHostname(result.url)}</span>
                    </div>
                    <a
                      href={result.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xl font-normal leading-[1.3] text-primary hover:underline visited:text-result-visited"
                    >
                      {result.title}
                    </a>
                    {result.description && (
                      <p className="mt-1 text-sm leading-[1.58] text-result-url">{result.description}</p>
                    )}
                  </article>
                ))}
              </div>
            ) : (
              <p className="text-base">No results found for <strong>{initialQuery}</strong>.</p>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default Search;