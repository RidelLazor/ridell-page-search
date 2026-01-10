import { useState, useEffect, useRef, KeyboardEvent, useMemo } from "react";
import { Search, Clock, X, Mic, MicOff, Globe, Star, Sparkles, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useToast } from "@/hooks/use-toast";
import { useFavorites } from "./FavoritesPanel";
import { motion, AnimatePresence } from "framer-motion";

interface MobileSearchBarProps {
  onSearch: (query: string) => void;
  onLucky: (query: string) => void;
  onNavigate: (url: string) => void;
  initialQuery?: string;
  compact?: boolean;
  inputRef?: React.RefObject<HTMLInputElement>;
  onAskAI?: () => void;
}

const MAX_HISTORY = 10;

const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

const MobileSearchBar = ({ onSearch, onLucky, onNavigate, initialQuery = "", compact = false, inputRef: externalRef, onAskAI }: MobileSearchBarProps) => {
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
    const urlPattern = /^(https?:\/\/)?([a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}(\/[^\s]*)?$/i;
    const hasProtocol = /^https?:\/\//i.test(trimmed);
    const isLocalhost = /^(https?:\/\/)?(localhost|127\.0\.0\.1)(:\d+)?(\/[^\s]*)?$/i.test(trimmed);
    return urlPattern.test(trimmed) || hasProtocol || isLocalhost;
  };

  const queryIsUrl = useMemo(() => isUrl(query), [query]);

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

    // Trigger haptic feedback on mobile
    if (navigator.vibrate) {
      navigator.vibrate(50);
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

    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(30);
    }

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
    if (navigator.vibrate) {
      navigator.vibrate(30);
    }
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
    if (navigator.vibrate) {
      navigator.vibrate(20);
    }
    setQuery(text);
    handleSubmit(text);
  };

  const handleToggleFavorite = () => {
    if (navigator.vibrate) {
      navigator.vibrate(40);
    }
    const wasFavorite = isFavorite(query);
    toggleFavorite(query);
    toast({
      title: wasFavorite ? "Removed from favorites" : "Added to favorites",
      description: query,
    });
  };

  return (
    <div className={`w-full ${compact ? "max-w-full" : "max-w-full"} mx-auto px-2`}>
      <div className="relative group">
        {/* Mobile-optimized search input */}
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
          placeholder={isListening ? "Listening..." : "Search or enter URL"}
          className={`w-full py-4 pl-12 pr-28 text-base bg-background border border-border rounded-2xl shadow-sm focus:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all ${
            isListening ? "ring-2 ring-red-500/50" : ""
          } ${queryIsUrl ? "border-blue-500/50" : ""}`}
        />
        
        {/* Right side action buttons - mobile optimized with larger touch targets */}
        <div className="absolute inset-y-0 right-0 pr-2 flex items-center gap-1">
          {/* Favorite Star Button - larger touch target */}
          {query.trim().length > 0 && !queryIsUrl && (
            <motion.button
              onClick={handleToggleFavorite}
              className={`p-3 rounded-full transition-colors active:scale-90 ${
                isFavorite(query) 
                  ? "text-yellow-500" 
                  : "text-muted-foreground"
              }`}
              whileTap={{ scale: 0.85 }}
              title={isFavorite(query) ? "Remove from favorites" : "Add to favorites"}
            >
              <Star className={`h-5 w-5 ${isFavorite(query) ? "fill-current" : ""}`} />
            </motion.button>
          )}
          
          {/* Voice Search Button - larger for mobile */}
          <motion.button
            onClick={toggleVoiceSearch}
            className={`p-3 rounded-full transition-colors active:scale-90 ${
              isListening ? "text-red-500 bg-red-500/10" : "text-muted-foreground"
            }`}
            whileTap={{ scale: 0.85 }}
            aria-label={isListening ? "Stop listening" : "Start voice search"}
          >
            {isListening ? (
              <MicOff className="h-6 w-6 animate-pulse" />
            ) : (
              <Mic className="h-6 w-6" />
            )}
          </motion.button>
        </div>

        {/* Mobile-optimized dropdown */}
        <AnimatePresence>
          {showDropdown && dropdownItems.length > 0 && !isListening && (
            <motion.div
              ref={dropdownRef}
              className="absolute top-full left-0 right-0 mt-2 bg-popover border border-border rounded-2xl shadow-xl overflow-hidden z-50 max-h-[60vh] overflow-y-auto"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {searchHistory.length > 0 && query.trim().length < 2 && (
                <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
                  <span className="text-sm text-muted-foreground font-medium">Recent searches</span>
                  <button
                    onClick={clearHistory}
                    className="text-sm text-primary font-medium active:opacity-70"
                  >
                    Clear all
                  </button>
                </div>
              )}
              {loadingAiSuggestions && query.trim().length >= 3 && (
                <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-primary/5">
                  <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                  <span className="text-sm text-muted-foreground">AI is thinking...</span>
                </div>
              )}
              {dropdownItems.map((item, index) => (
                <motion.button
                  key={`${item.text}-${index}`}
                  onClick={() => handleItemClick(item.text)}
                  className={`w-full flex items-center gap-4 px-4 py-4 text-left text-base transition-colors active:bg-accent ${
                    index === selectedIndex
                      ? "bg-accent text-accent-foreground"
                      : ""
                  }`}
                  whileTap={{ backgroundColor: "var(--accent)" }}
                >
                  {item.type === "history" ? (
                    <Clock className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  ) : item.type === "ai" ? (
                    <Sparkles className="h-5 w-5 text-primary flex-shrink-0" />
                  ) : (
                    <Search className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  )}
                  <span className="flex-1 truncate">{item.text}</span>
                  {item.type === "ai" && (
                    <span className="text-xs text-primary font-medium px-2 py-1 rounded-full bg-primary/10">AI</span>
                  )}
                  {item.type === "history" && (
                    <button
                      onClick={(e) => removeFromHistory(item.text, e)}
                      className="p-2 rounded-full hover:bg-destructive/20 active:bg-destructive/30"
                    >
                      <X className="h-4 w-4 text-muted-foreground" />
                    </button>
                  )}
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Mobile-optimized action buttons */}
      {!compact && (
        <div className="flex items-center justify-center gap-3 mt-5">
          <Button
            variant="secondary"
            onClick={() => handleSubmit()}
            className="flex-1 max-w-[160px] h-12 text-base font-medium rounded-xl active:scale-95 transition-transform"
          >
            Search
          </Button>
          <Button
            variant="secondary"
            onClick={handleLucky}
            className="flex-1 max-w-[160px] h-12 text-base font-medium rounded-xl active:scale-95 transition-transform"
          >
            Feeling Lucky
          </Button>
        </div>
      )}
      
      {/* Mobile quick action row */}
      {!compact && onAskAI && (
        <motion.div 
          className="flex justify-center mt-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Button
            onClick={onAskAI}
            className="h-11 px-6 rounded-xl font-medium text-white shadow-lg active:scale-95 transition-transform"
            style={{
              background: "linear-gradient(135deg, #4285F4 0%, #EA4335 33%, #FBBC05 66%, #34A853 100%)",
            }}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Ask Ridel AI
          </Button>
        </motion.div>
      )}
    </div>
  );
};

export default MobileSearchBar;
