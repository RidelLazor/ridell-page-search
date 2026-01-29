import { TrendingUp, Sparkles, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

interface TrendingSearchesProps {
  onSearch: (query: string) => void;
}

const DEFAULT_SEARCHES = [
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
  const [searches, setSearches] = useState<string[]>(DEFAULT_SEARCHES);
  const [isAI, setIsAI] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchTrending = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('trending-searches');
      
      if (error) {
        console.error('Error fetching trending:', error);
        return;
      }

      if (data?.searches && Array.isArray(data.searches)) {
        setSearches(data.searches);
        setIsAI(data.isAI || false);
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrending();
  }, []);

  return (
    <div className="mt-8 w-full max-w-4xl">
      <div className="flex items-center gap-2 mb-4">
        {isAI ? (
          <Sparkles className="h-4 w-4 text-primary" />
        ) : (
          <TrendingUp className="h-4 w-4 text-primary" />
        )}
        <span className="text-sm font-medium text-muted-foreground">
          {isAI ? "Trending" : "Trending searches"}
        </span>
        {loading && (
          <RefreshCw className="h-3 w-3 text-muted-foreground animate-spin" />
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {searches.map((term, index) => (
          <motion.button
            key={`${term}-${index}`}
            onClick={() => onSearch(term)}
            className="px-3 py-1.5 text-sm rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05, duration: 0.2 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {term}
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default TrendingSearches;
