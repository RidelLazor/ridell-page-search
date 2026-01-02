import { X, Star, Search, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

interface FavoriteSearch {
  id: string;
  query: string;
  createdAt: number;
}

interface FavoritesPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSearch: (query: string) => void;
}

export const useFavorites = () => {
  const [favorites, setFavorites] = useLocalStorage<FavoriteSearch[]>("ridel-favorites", []);

  const addFavorite = (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return false;
    
    const exists = favorites.some((f) => f.query.toLowerCase() === trimmed.toLowerCase());
    if (exists) return false;

    const newFavorite: FavoriteSearch = {
      id: Date.now().toString(),
      query: trimmed,
      createdAt: Date.now(),
    };
    setFavorites((prev) => [newFavorite, ...prev]);
    return true;
  };

  const removeFavorite = (id: string) => {
    setFavorites((prev) => prev.filter((f) => f.id !== id));
  };

  const isFavorite = (query: string) => {
    return favorites.some((f) => f.query.toLowerCase() === query.trim().toLowerCase());
  };

  const toggleFavorite = (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    
    const existing = favorites.find((f) => f.query.toLowerCase() === trimmed.toLowerCase());
    if (existing) {
      removeFavorite(existing.id);
      return false;
    } else {
      addFavorite(query);
      return true;
    }
  };

  return { favorites, addFavorite, removeFavorite, isFavorite, toggleFavorite };
};

const FavoritesPanel = ({ isOpen, onClose, onSearch }: FavoritesPanelProps) => {
  const { favorites, removeFavorite } = useFavorites();
  const { toast } = useToast();

  const handleSearch = (query: string) => {
    onSearch(query);
    onClose();
  };

  const handleRemove = (id: string, query: string) => {
    removeFavorite(id);
    toast({
      title: "Removed from favorites",
      description: query,
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-sm bg-background border-l border-border shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                <h2 className="text-lg font-semibold">Pinned Searches</h2>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {favorites.length === 0 ? (
                <div className="text-center py-12">
                  <Star className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground">No pinned searches yet</p>
                  <p className="text-sm text-muted-foreground/70 mt-1">
                    Click the star icon when searching to pin
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {favorites.map((favorite, index) => (
                    <motion.div
                      key={favorite.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="group flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors"
                    >
                      <button
                        onClick={() => handleSearch(favorite.query)}
                        className="flex-1 flex items-center gap-3 text-left"
                      >
                        <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="truncate">{favorite.query}</span>
                      </button>
                      <motion.button
                        onClick={() => handleRemove(favorite.id, favorite.query)}
                        className="p-2 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </motion.button>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {favorites.length > 0 && (
              <div className="p-4 border-t border-border">
                <p className="text-xs text-muted-foreground text-center">
                  {favorites.length} pinned {favorites.length === 1 ? "search" : "searches"}
                </p>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default FavoritesPanel;
