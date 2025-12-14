import { Loader2 } from "lucide-react";

interface SearchResult {
  title: string;
  url: string;
  description: string;
}

interface SearchResultsProps {
  results: SearchResult[];
  loading: boolean;
  error: string | null;
  onResultClick: (url: string) => void;
}

const SearchResults = ({ results, loading, error, onResultClick }: SearchResultsProps) => {
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
        <div key={index} className="max-w-2xl">
          <button
            onClick={() => onResultClick(result.url)}
            className="text-left w-full group"
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
        </div>
      ))}
    </div>
  );
};

export default SearchResults;
