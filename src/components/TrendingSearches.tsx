import { TrendingUp } from "lucide-react";

interface TrendingSearchesProps {
  onSearch: (query: string) => void;
}

// These would ideally come from an API, but for now we'll use static trending topics
const TRENDING_SEARCHES = [
  "AI news today",
  "World Cup 2026",
  "Climate change solutions",
  "SpaceX launch",
  "New iPhone release",
  "Stock market today",
  "Taylor Swift tour",
  "Olympics 2024",
];

const TrendingSearches = ({ onSearch }: TrendingSearchesProps) => {
  return (
    <div className="mt-8 w-full max-w-xl">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium text-muted-foreground">Trending searches</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {TRENDING_SEARCHES.map((term, index) => (
          <button
            key={index}
            onClick={() => onSearch(term)}
            className="px-3 py-1.5 text-sm rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
          >
            {term}
          </button>
        ))}
      </div>
    </div>
  );
};

export default TrendingSearches;
