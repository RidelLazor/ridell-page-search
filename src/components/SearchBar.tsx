import { useState, useEffect, useRef, KeyboardEvent } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface SearchBarProps {
  onSearch: (query: string) => void;
  onLucky: (query: string) => void;
  onNavigate: (url: string) => void;
  initialQuery?: string;
  compact?: boolean;
}

const SearchBar = ({ onSearch, onLucky, onNavigate, initialQuery = "", compact = false }: SearchBarProps) => {
  const [query, setQuery] = useState(initialQuery);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const isUrl = (text: string) => {
    const urlPattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/i;
    return urlPattern.test(text.trim());
  };

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (query.trim().length < 2 || isUrl(query)) {
        setSuggestions([]);
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke("autocomplete", {
          body: { query: query.trim() },
        });

        if (!error && data?.success && data.suggestions) {
          setSuggestions(data.suggestions);
        }
      } catch (err) {
        console.error("Autocomplete error:", err);
      }
    };

    const debounce = setTimeout(fetchSuggestions, 150);
    return () => clearTimeout(debounce);
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = (searchQuery?: string) => {
    const trimmedQuery = (searchQuery || query).trim();
    if (!trimmedQuery) return;

    setShowSuggestions(false);
    setSuggestions([]);

    if (isUrl(trimmedQuery)) {
      const url = trimmedQuery.startsWith("http") ? trimmedQuery : `https://${trimmedQuery}`;
      onNavigate(url);
    } else {
      onSearch(trimmedQuery);
    }
  };

  const handleLucky = () => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return;
    setShowSuggestions(false);
    onLucky(trimmedQuery);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      if (selectedIndex >= 0 && suggestions[selectedIndex]) {
        setQuery(suggestions[selectedIndex]);
        handleSubmit(suggestions[selectedIndex]);
      } else {
        handleSubmit();
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    handleSubmit(suggestion);
  };

  return (
    <div className={`w-full ${compact ? "max-w-2xl" : "max-w-xl"} mx-auto`}>
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
          <Search className="h-5 w-5 text-muted-foreground" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowSuggestions(true);
            setSelectedIndex(-1);
          }}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search RidelL or type a URL"
          className="w-full py-3 pl-12 pr-4 text-base bg-background border border-border rounded-full shadow-sm hover:shadow-md focus:shadow-md focus:outline-none focus:ring-1 focus:ring-primary/20 transition-shadow"
        />

        {/* Suggestions dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div
            ref={suggestionsRef}
            className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-2xl shadow-lg overflow-hidden z-50"
          >
            {suggestions.map((suggestion, index) => (
              <button
                key={suggestion}
                onClick={() => handleSuggestionClick(suggestion)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left text-sm transition-colors ${
                  index === selectedIndex
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-accent/50"
                }`}
              >
                <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span>{suggestion}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      
      {!compact && (
        <div className="flex items-center justify-center gap-3 mt-6">
          <Button
            variant="secondary"
            onClick={() => handleSubmit()}
            className="px-6 py-2 text-sm font-medium"
          >
            RidelL Search
          </Button>
          <Button
            variant="secondary"
            onClick={handleLucky}
            className="px-6 py-2 text-sm font-medium"
          >
            I'm Feeling Lucky
          </Button>
        </div>
      )}
    </div>
  );
};

export default SearchBar;
