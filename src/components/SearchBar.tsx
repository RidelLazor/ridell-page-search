import { useState, KeyboardEvent } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SearchBarProps {
  onSearch: (query: string) => void;
  onLucky: (query: string) => void;
  onNavigate: (url: string) => void;
  initialQuery?: string;
  compact?: boolean;
}

const SearchBar = ({ onSearch, onLucky, onNavigate, initialQuery = "", compact = false }: SearchBarProps) => {
  const [query, setQuery] = useState(initialQuery);

  const isUrl = (text: string) => {
    const urlPattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/i;
    return urlPattern.test(text.trim());
  };

  const handleSubmit = () => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return;

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
    onLucky(trimmedQuery);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  return (
    <div className={`w-full ${compact ? "max-w-2xl" : "max-w-xl"} mx-auto`}>
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-muted-foreground" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search RidelL or type a URL"
          className="w-full py-3 pl-12 pr-4 text-base bg-background border border-border rounded-full shadow-sm hover:shadow-md focus:shadow-md focus:outline-none focus:ring-1 focus:ring-primary/20 transition-shadow"
        />
      </div>
      
      {!compact && (
        <div className="flex items-center justify-center gap-3 mt-6">
          <Button
            variant="secondary"
            onClick={handleSubmit}
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
