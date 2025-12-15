import { useState } from "react";
import { Bookmark, Plus, Trash2, X, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocalStorage } from "@/hooks/useLocalStorage";

interface BookmarkItem {
  id: string;
  title: string;
  url: string;
}

interface BookmarksPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (url: string) => void;
}

const BookmarksPanel = ({ isOpen, onClose, onNavigate }: BookmarksPanelProps) => {
  const [bookmarks, setBookmarks] = useLocalStorage<BookmarkItem[]>("ridel-bookmarks", []);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newUrl, setNewUrl] = useState("");

  const handleAddBookmark = () => {
    if (!newTitle.trim() || !newUrl.trim()) return;

    const url = newUrl.startsWith("http") ? newUrl : `https://${newUrl}`;
    const newBookmark: BookmarkItem = {
      id: Date.now().toString(),
      title: newTitle.trim(),
      url: url.trim(),
    };

    setBookmarks((prev) => [newBookmark, ...prev]);
    setNewTitle("");
    setNewUrl("");
    setShowAddForm(false);
  };

  const handleDeleteBookmark = (id: string) => {
    setBookmarks((prev) => prev.filter((b) => b.id !== id));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Bookmark className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Bookmarks</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-accent transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4">
          {!showAddForm ? (
            <Button
              variant="outline"
              onClick={() => setShowAddForm(true)}
              className="w-full mb-4"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Bookmark
            </Button>
          ) : (
            <div className="space-y-3 mb-4 p-3 bg-accent/50 rounded-lg">
              <Input
                placeholder="Title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
              />
              <Input
                placeholder="URL (e.g., google.com)"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
              />
              <div className="flex gap-2">
                <Button onClick={handleAddBookmark} size="sm" className="flex-1">
                  Save
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowAddForm(false);
                    setNewTitle("");
                    setNewUrl("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-2 max-h-[50vh] overflow-y-auto">
            {bookmarks.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No bookmarks yet. Add your favorite sites!
              </p>
            ) : (
              bookmarks.map((bookmark) => (
                <div
                  key={bookmark.id}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 group transition-colors"
                >
                  <button
                    onClick={() => onNavigate(bookmark.url)}
                    className="flex-1 text-left"
                  >
                    <p className="font-medium text-sm truncate">{bookmark.title}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {bookmark.url}
                    </p>
                  </button>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => onNavigate(bookmark.url)}
                      className="p-1.5 rounded-full hover:bg-accent"
                      title="Open"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteBookmark(bookmark.id)}
                      className="p-1.5 rounded-full hover:bg-destructive/20 text-destructive"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookmarksPanel;
