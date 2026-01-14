import { Loader2, Bookmark, BookmarkCheck } from "lucide-react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useToast } from "@/hooks/use-toast";

interface SearchResult {
  title: string;
  url: string;
  description: string;
}

interface BookmarkItem {
  id: string;
  title: string;
  url: string;
}

interface SearchResultsProps {
  results: SearchResult[];
  loading: boolean;
  error: string | null;
  onResultClick: (url: string) => void;
}

const SearchResults = ({ results, loading, error, onResultClick }: SearchResultsProps) => {
  const [bookmarks, setBookmarks] = useLocalStorage<BookmarkItem[]>("ridel-bookmarks", []);
  const { toast } = useToast();

  const isBookmarked = (url: string) => {
    return bookmarks.some((b) => b.url === url);
  };

  const toggleBookmark = (result: SearchResult, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (isBookmarked(result.url)) {
      setBookmarks((prev) => prev.filter((b) => b.url !== result.url));
      toast({
        title: "Bookmark removed",
        description: result.title,
      });
    } else {
      const newBookmark: BookmarkItem = {
        id: Date.now().toString(),
        title: result.title,
        url: result.url,
      };
      setBookmarks((prev) => [newBookmark, ...prev]);
      toast({
        title: "Bookmarked",
        description: result.title,
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">Searching...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8 text-center">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-muted-foreground">No results found. Try a different search.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-4">
      {results.map((result, index) => (
        <div key={index} className="w-full max-w-2xl group">
          <div className="flex items-start gap-3">
            <button
              onClick={() => onResultClick(result.url)}
              className="text-left flex-1"
            >
              <p className="text-sm text-muted-foreground truncate mb-1">
                {result.url}
              </p>
              <h3 className="text-xl text-blue-600 dark:text-blue-400 group-hover:underline font-normal mb-1">
                {result.title}
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {result.description}
              </p>
            </button>
            <button
              onClick={(e) => toggleBookmark(result, e)}
              className={`p-2 rounded-full transition-all hover:scale-110 ${
                isBookmarked(result.url)
                  ? "text-yellow-500 hover:bg-yellow-500/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
              title={isBookmarked(result.url) ? "Remove bookmark" : "Add bookmark"}
            >
              {isBookmarked(result.url) ? (
                <BookmarkCheck className="h-5 w-5" />
              ) : (
                <Bookmark className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SearchResults;
