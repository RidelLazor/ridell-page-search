import { useState } from "react";
import { Plus, X, Globe } from "lucide-react";
import { motion } from "framer-motion";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Shortcut {
  id: string;
  name: string;
  url: string;
  favicon?: string;
}

const DEFAULT_SHORTCUTS: Shortcut[] = [
  { id: "1", name: "YouTube", url: "https://youtube.com", favicon: "https://www.youtube.com/s/desktop/12d6b690/img/favicon_144x144.png" },
  { id: "2", name: "Gmail", url: "https://gmail.com", favicon: "https://ssl.gstatic.com/ui/v1/icons/mail/rfr/gmail.ico" },
  { id: "3", name: "GitHub", url: "https://github.com", favicon: "https://github.githubassets.com/favicons/favicon.svg" },
  { id: "4", name: "Google", url: "https://google.com", favicon: "https://www.google.com/favicon.ico" },
];

// Generate favicon URL with fallbacks
const getFaviconUrl = (url: string): string => {
  try {
    const urlObj = new URL(url.startsWith("http") ? url : `https://${url}`);
    // Use Google's favicon service as it's more reliable
    return `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=128`;
  } catch {
    return "";
  }
};

const ShortcutIcon = ({ favicon, url, name }: { favicon?: string; url: string; name: string }) => {
  const [currentSrc, setCurrentSrc] = useState(favicon || getFaviconUrl(url));
  const [hasError, setHasError] = useState(false);

  if (hasError || !currentSrc) {
    // Fallback to first letter icon
    return (
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
        <span className="text-lg font-semibold text-primary">
          {name.charAt(0).toUpperCase()}
        </span>
      </div>
    );
  }

  return (
    <img
      src={currentSrc}
      alt={name}
      className="w-10 h-10 rounded-xl object-contain"
      onError={() => {
        // Try Google's favicon service as fallback
        const googleFavicon = getFaviconUrl(url);
        if (currentSrc !== googleFavicon) {
          setCurrentSrc(googleFavicon);
        } else {
          setHasError(true);
        }
      }}
    />
  );
};

interface QuickShortcutsProps {
  onNavigate: (url: string) => void;
}

const QuickShortcuts = ({ onNavigate }: QuickShortcutsProps) => {
  const [shortcuts, setShortcuts] = useLocalStorage<Shortcut[]>("ridel-shortcuts", DEFAULT_SHORTCUTS);
  const [isOpen, setIsOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newUrl, setNewUrl] = useState("");

  const handleAddShortcut = () => {
    if (!newName.trim() || !newUrl.trim()) return;

    const url = newUrl.startsWith("http") ? newUrl : `https://${newUrl}`;
    
    const newShortcut: Shortcut = {
      id: Date.now().toString(),
      name: newName.trim(),
      url,
      favicon: getFaviconUrl(url),
    };

    setShortcuts((prev) => [...prev, newShortcut]);
    setNewName("");
    setNewUrl("");
    setIsOpen(false);
  };

  const handleRemoveShortcut = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setShortcuts((prev) => prev.filter((s) => s.id !== id));
  };

  return (
    <div className="flex items-center justify-center gap-6 mt-8 flex-wrap max-w-xl">
      {shortcuts.slice(0, 8).map((shortcut, index) => (
        <motion.div
          key={shortcut.id}
          className="group relative flex flex-col items-center gap-2 cursor-pointer"
          onClick={() => onNavigate(shortcut.url)}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <div className="w-14 h-14 rounded-2xl bg-secondary/80 backdrop-blur-sm flex items-center justify-center transition-all hover:bg-secondary shadow-sm hover:shadow-md">
            <ShortcutIcon favicon={shortcut.favicon} url={shortcut.url} name={shortcut.name} />
          </div>
          <span className="text-xs text-muted-foreground max-w-16 truncate font-medium">{shortcut.name}</span>
          <motion.button
            onClick={(e) => handleRemoveShortcut(shortcut.id, e)}
            className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
            whileTap={{ scale: 0.8 }}
          >
            <X className="w-3 h-3" />
          </motion.button>
        </motion.div>
      ))}

      {shortcuts.length < 8 && (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <motion.button 
              className="flex flex-col items-center gap-2 cursor-pointer"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: shortcuts.length * 0.05 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="w-14 h-14 rounded-2xl bg-secondary/50 border-2 border-dashed border-muted-foreground/30 flex items-center justify-center transition-all hover:bg-secondary/80 hover:border-muted-foreground/50">
                <Plus className="w-6 h-6 text-muted-foreground" />
              </div>
              <span className="text-xs text-muted-foreground font-medium">Add shortcut</span>
            </motion.button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add shortcut</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Input
                  placeholder="Name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>
              <div>
                <Input
                  placeholder="URL (e.g., example.com)"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddShortcut()}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddShortcut}>Add</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default QuickShortcuts;