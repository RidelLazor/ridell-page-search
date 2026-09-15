import { FormEvent, useEffect, useRef, useState } from "react";
import { Search as SearchIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ViolytraLogo from "@/components/ViolytraLogo";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface SearchResult {
  title: string;
  url: string;
  description: string;
}

const Index = () => {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [luckyLoading, setLuckyLoading] = useState(false);
  const [region, setRegion] = useState("");

  useEffect(() => {
    document.title = "Violytra";
    try {
      const locale = new Intl.Locale(navigator.language);
      const code =
        locale.region ??
        (locale as unknown as { maximize?: () => { region?: string } }).maximize?.().region;
      if (code) {
        const name = new Intl.DisplayNames([navigator.language], { type: "region" }).of(code);
        if (name) setRegion(name);
      }
    } catch {
      setRegion("");
    }
  }, []);

  const openSearch = () => {
    const trimmed = query.trim();
    if (trimmed) navigate(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    openSearch();
  };

  const feelLucky = async () => {
    const trimmed = query.trim();
    if (!trimmed) {
      inputRef.current?.focus();
      return;
    }

    setLuckyLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("search", {
        body: { query: trimmed, safeSearch: true },
      });
      if (error) throw error;
      const firstResult = (data?.results as SearchResult[] | undefined)?.[0];
      if (firstResult?.url) {
        window.location.assign(firstResult.url);
        return;
      }
      openSearch();
    } catch {
      openSearch();
    } finally {
      setLuckyLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="flex h-14 items-center justify-end gap-5 px-5 text-[13px]">
        <a href="https://mail.google.com" target="_blank" rel="noreferrer" className="hover:underline">Mail</a>
        <button type="button" onClick={() => navigate("/search?tab=images&q=Violytra")} className="hover:underline">Images</button>
      </header>

      <main className="flex flex-1 flex-col items-center px-4 pt-[10vh] sm:pt-[14vh]">
        <h1 className="mb-7 leading-none"><ViolytraLogo /></h1>
        <form onSubmit={submitSearch} className="w-full max-w-[584px]" role="search">
          <label className="flex h-[46px] items-center rounded-full border border-border bg-background px-4 shadow-none transition-shadow hover:shadow-search focus-within:shadow-search">
            <SearchIcon aria-hidden="true" className="mr-3 h-5 w-5 shrink-0 text-muted-foreground" />
            <span className="sr-only">Search the web</span>
            <input
              ref={inputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              autoComplete="off"
              autoFocus
              className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
              aria-label="Search the web"
            />
          </label>
          <div className="mt-7 flex justify-center gap-3">
            <Button type="submit" variant="secondary" className="h-9 px-4 font-normal">Violytra Search</Button>
            <Button type="button" variant="secondary" className="h-9 px-4 font-normal" onClick={feelLucky} disabled={luckyLoading}>
              {luckyLoading ? "Searching…" : "I'm Feeling Lucky"}
            </Button>
          </div>
        </form>
      </main>

      <footer className="bg-secondary px-6 py-3 text-sm text-muted-foreground">Nigeria</footer>
    </div>
  );
};

export default Index;