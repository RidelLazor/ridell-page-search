import { useState } from "react";
import { Plus, X, Globe } from "lucide-react";
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
  { id: "1", name: "YouTube", url: "https://youtube.com", favicon: "https://www.youtube.com/favicon.ico" },
  { id: "2", name: "Gmail", url: "https://gmail.com", favicon: "https://ssl.gstatic.com/ui/v1/icons/mail/rfr/gmail.ico" },
  { id: "3", name: "GitHub", url: "https://github.com", favicon: "https://github.githubassets.com/favicons/favicon.svg" },
];

const ShortcutIcon = ({ favicon, name }: { favicon?: string; name: string }) => {
  const [hasError, setHasError] = useState(false);

  if (!favicon || hasError) {
    return <Globe className="w-6 h-6 text-muted-foreground" />;
  }

  return (
    <img
      src={favicon}
      alt={name}
      className="w-6 h-6 rounded"
      onError={() => setHasError(true)}
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
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleAddShortcut = () => {
    if (!newName.trim() || !newUrl.trim()) return;

    const url = newUrl.startsWith("http") ? newUrl : `https://${newUrl}`;
    
    const newShortcut: Shortcut = {
      id: Date.now().toString(),
      name: newName.trim(),
      url,
      favicon: `${url}/favicon.ico`,
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
    <div className="flex items-center justify-center gap-4 mt-8 flex-wrap">
      {shortcuts.slice(0, 8).map((shortcut) => (
        <div
          key={shortcut.id}
          className="group relative flex flex-col items-center gap-2 cursor-pointer"
          onClick={() => onNavigate(shortcut.url)}
        >
          <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center transition-all hover:bg-secondary/80 hover:scale-105">
            <ShortcutIcon favicon={shortcut.favicon} name={shortcut.name} />
          </div>
          <span className="text-xs text-muted-foreground max-w-16 truncate">{shortcut.name}</span>
          <button
            onClick={(e) => handleRemoveShortcut(shortcut.id, e)}
            className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ))}

      {shortcuts.length < 8 && (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <button className="flex flex-col items-center gap-2 cursor-pointer">
              <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center transition-all hover:bg-secondary/80 hover:scale-105">
                <Plus className="w-6 h-6 text-muted-foreground" />
              </div>
              <span className="text-xs text-muted-foreground">Add shortcut</span>
            </button>
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
                  placeholder="URL"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddShortcut()}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddShortcut}>Done</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default QuickShortcuts;
