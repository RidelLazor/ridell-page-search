import { useState, useEffect, useRef, KeyboardEvent, useMemo } from "react";
import { Search, Clock, X, Mic, MicOff, Globe, Star, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useToast } from "@/hooks/use-toast";
import { useFavorites } from "./FavoritesPanel";
import { motion } from "framer-motion";

interface SearchBarProps {
  onSearch: (query: string) => void;
  onLucky: (query: string) => void;
  onNavigate: (url: string) => void;
  initialQuery?: string;
  compact?: boolean;
  inputRef?: React.RefObject<HTMLInputElement>;
  onAskAI?: () => void;
}

const MAX_HISTORY = 10;

// Check if Web Speech API is available
const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

const SearchBar = ({ onSearch, onLucky, onNavigate, initialQuery = "", compact = false, inputRef: externalRef, onAskAI }: SearchBarProps) => {
  const [query, setQuery] = useState(initialQuery);
  const internalRef = useRef<HTMLInputElement>(null);
  const inputRef = externalRef || internalRef;
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [searchHistory, setSearchHistory] = useLocalStorage<string[]>("ridel-search-history", []);
  const [isListening, setIsListening] = useState(false);
  const [loadingAiSuggestions, setLoadingAiSuggestions] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const { toast } = useToast();
  const { isFavorite, toggleFavorite } = useFavorites();

  const isUrl = (text: string) => {
    const trimmed = text.trim();
    // Match URLs with protocol, or domain patterns with paths
    const urlPattern = /^(https?:\/\/)?([a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}(\/[^\s]*)?$/i;
    // Also match if starts with http:// or https://
    const hasProtocol = /^https?:\/\//i.test(trimmed);
    // Match localhost with port
    const isLocalhost = /^(https?:\/\/)?(localhost|127\.0\.0\.1)(:\d+)?(\/[^\s]*)?$/i.test(trimmed);
    return urlPattern.test(trimmed) || hasProtocol || isLocalhost;
  };

  // Check if current query looks like a URL for visual feedback
  const queryIsUrl = useMemo(() => isUrl(query), [query]);

  // Initialize Speech Recognition
  useEffect(() => {
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = "en-US";

      recognitionRef.current.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join("");
        setQuery(transcript);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
        if (event.error === "not-allowed") {
          toast({
            title: "Microphone Access Denied",
            description: "Please allow microphone access to use voice search.",
            variant: "destructive",
          });
        }
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [toast]);

  const toggleVoiceSearch = () => {
    if (!SpeechRecognition) {
      toast({
        title: "Not Supported",
        description: "Voice search is not supported in your browser.",
        variant: "destructive",
      });
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      recognitionRef.current?.start();
      setIsListening(true);
      setShowDropdown(false);
    }
  };

  // Combined list: favorites first, then history, then AI suggestions, then regular suggestions
  const dropdownItems = query.trim().length < 2
    ? searchHistory.slice(0, 5).map((h) => ({ text: h, type: "history" as const }))
    : [
        ...searchHistory
          .filter((h) => h.toLowerCase().includes(query.toLowerCase()))
          .slice(0, 3)
          .map((h) => ({ text: h, type: "history" as const })),
        ...aiSuggestions
          .filter((s) => !searchHistory.some((h) => h.toLowerCase() === s.toLowerCase()))
          .map((s) => ({ text: s, type: "ai" as const })),
        ...suggestions
          .filter((s) => !searchHistory.some((h) => h.toLowerCase() === s.toLowerCase()))
          .filter((s) => !aiSuggestions.some((ai) => ai.toLowerCase() === s.toLowerCase()))
          .map((s) => ({ text: s, type: "suggestion" as const })),
      ];

  // Fetch regular autocomplete suggestions
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

  // Fetch AI-powered suggestions
  useEffect(() => {
    const fetchAiSuggestions = async () => {
      if (query.trim().length < 3 || isUrl(query)) {
        setAiSuggestions([]);
        return;
      }

      setLoadingAiSuggestions(true);
      try {
        const { data, error } = await supabase.functions.invoke("ai-autocomplete", {
          body: { query: query.trim() },
        });

        if (!error && data?.success && data.suggestions) {
          setAiSuggestions(data.suggestions);
        }
      } catch (err) {
        console.error("AI Autocomplete error:", err);
      } finally {
        setLoadingAiSuggestions(false);
      }
    };

    const debounce = setTimeout(fetchAiSuggestions, 300);
    return () => clearTimeout(debounce);
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const addToHistory = (searchQuery: string) => {
    const trimmed = searchQuery.trim();
    if (!trimmed || isUrl(trimmed)) return;

    setSearchHistory((prev) => {
      const filtered = prev.filter((h) => h.toLowerCase() !== trimmed.toLowerCase());
      return [trimmed, ...filtered].slice(0, MAX_HISTORY);
    });
  };

  const removeFromHistory = (item: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSearchHistory((prev) => prev.filter((h) => h !== item));
  };

  const clearHistory = () => {
    setSearchHistory([]);
  };

  const handleSubmit = (searchQuery?: string) => {
    const trimmedQuery = (searchQuery || query).trim();
    if (!trimmedQuery) return;

    setShowDropdown(false);
    setSuggestions([]);

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    }

    if (isUrl(trimmedQuery)) {
      const url = trimmedQuery.startsWith("http") ? trimmedQuery : `https://${trimmedQuery}`;
      onNavigate(url);
    } else {
      addToHistory(trimmedQuery);
      onSearch(trimmedQuery);
    }
  };

  const handleLucky = () => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return;
    setShowDropdown(false);
    addToHistory(trimmedQuery);
    onLucky(trimmedQuery);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      if (selectedIndex >= 0 && dropdownItems[selectedIndex]) {
        setQuery(dropdownItems[selectedIndex].text);
        handleSubmit(dropdownItems[selectedIndex].text);
      } else {
        handleSubmit();
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < dropdownItems.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === "Escape") {
      setShowDropdown(false);
      setSelectedIndex(-1);
    }
  };

  const handleItemClick = (text: string) => {
    setQuery(text);
    handleSubmit(text);
  };

  const handleToggleFavorite = () => {
    const wasFavorite = isFavorite(query);
    toggleFavorite(query);
    toast({
      title: wasFavorite ? "Removed from favorites" : "Added to favorites",
      description: query,
    });
  };

  return (
    <div className={`w-full ${compact ? "max-w-3xl" : "max-w-6xl"} mx-auto`}>
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
          {queryIsUrl ? (
            <Globe className="h-5 w-5 text-blue-500" />
          ) : (
            <Search className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowDropdown(true);
            setSelectedIndex(-1);
          }}
          onFocus={() => setShowDropdown(true)}
          onKeyDown={handleKeyDown}
          placeholder={isListening ? "Listening..." : "Search or enter URL (https://...)"}
          className={`w-full py-3 pl-12 ${onAskAI ? 'pr-32' : 'pr-12'} text-base bg-background border border-border rounded-full shadow-sm hover:shadow-md focus:shadow-md focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all ${
            isListening ? "ring-2 ring-red-500/50" : ""
          } ${queryIsUrl ? "border-blue-500/50" : ""}`}
        />
        
        {/* Right side buttons container */}
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center gap-2">
          {/* Ask AI Button */}
          {onAskAI && query.trim().length > 0 && (
            <motion.button
              onClick={onAskAI}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all bg-gradient-to-r from-primary/10 to-primary/5 hover:from-primary/20 hover:to-primary/10 text-primary border border-primary/20"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="Ask Ridel AI"
            >
              <Sparkles className="h-3 w-3" />
              <span className="hidden sm:inline">Ask AI</span>
            </motion.button>
          )}
          
          {/* Favorite Star Button */}
          {query.trim().length > 0 && !queryIsUrl && (
            <motion.button
              onClick={handleToggleFavorite}
              className={`p-1.5 rounded-full transition-colors ${
                isFavorite(query) 
                  ? "text-yellow-500" 
                  : "text-muted-foreground hover:text-yellow-500"
              }`}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              title={isFavorite(query) ? "Remove from favorites" : "Add to favorites"}
            >
              <Star className={`h-4 w-4 ${isFavorite(query) ? "fill-current" : ""}`} />
            </motion.button>
          )}
          
          {/* Voice Search Button */}
          <button
            onClick={toggleVoiceSearch}
            className={`p-1.5 transition-colors ${
              isListening ? "text-red-500" : "text-muted-foreground hover:text-foreground"
            }`}
            aria-label={isListening ? "Stop listening" : "Start voice search"}
          >
            {isListening ? (
              <MicOff className="h-5 w-5 animate-pulse" />
            ) : (
              <Mic className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Dropdown with history, AI suggestions, and regular suggestions */}
        {showDropdown && dropdownItems.length > 0 && !isListening && (
          <div
            ref={dropdownRef}
            className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-2xl shadow-lg overflow-hidden z-50"
          >
            {searchHistory.length > 0 && query.trim().length < 2 && (
              <div className="flex items-center justify-between px-4 py-2 border-b border-border">
                <span className="text-xs text-muted-foreground font-medium">Recent searches</span>
                <button
                  onClick={clearHistory}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Clear all
                </button>
              </div>
            )}
            {loadingAiSuggestions && query.trim().length >= 3 && (
              <div className="flex items-center gap-2 px-4 py-2 border-b border-border">
                <Sparkles className="h-3 w-3 text-primary animate-pulse" />
                <span className="text-xs text-muted-foreground">AI is thinking...</span>
              </div>
            )}
            {dropdownItems.map((item, index) => (
              <button
                key={`${item.text}-${index}`}
                onClick={() => handleItemClick(item.text)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left text-sm transition-colors group/item ${
                  index === selectedIndex
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-accent/50"
                }`}
              >
                {item.type === "history" ? (
                  <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                ) : item.type === "ai" ? (
                  <Sparkles className="h-4 w-4 text-primary flex-shrink-0" />
                ) : (
                  <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                )}
                <span className="flex-1 truncate">{item.text}</span>
                {item.type === "ai" && (
                  <span className="text-[10px] text-primary/70 font-medium px-1.5 py-0.5 rounded bg-primary/10">AI</span>
                )}
                {item.type === "history" && (
                  <button
                    onClick={(e) => removeFromHistory(item.text, e)}
                    className="p-1 rounded-full hover:bg-destructive/20 opacity-0 group-hover/item:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3 text-muted-foreground" />
                  </button>
                )}
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
