import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Globe, Grid3X3, Pencil, Image, History } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import RidelLogo from "@/components/RidelLogo";
import SearchBar from "@/components/SearchBar";
import GoogleAppsGrid from "@/components/GoogleAppsGrid";
import CustomizePanel from "@/components/CustomizePanel";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { User } from "@supabase/supabase-js";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Shortcut {
  id: string;
  name: string;
  url: string;
  favicon?: string;
}

const DEFAULT_SHORTCUTS: Shortcut[] = [];

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

const NewTab = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [shortcuts, setShortcuts] = useLocalStorage<Shortcut[]>("ridell-newtab-shortcuts", DEFAULT_SHORTCUTS);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showCustomize, setShowCustomize] = useState(false);
  const [showAppsGrid, setShowAppsGrid] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSearch = (query: string) => {
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleLucky = (query: string) => {
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}&lucky=true`);
    }
  };

  const handleNavigate = (url: string) => {
    let finalUrl = url;
    if (!/^https?:\/\//i.test(url)) {
      finalUrl = `https://${url}`;
    }
    window.location.href = finalUrl;
  };

  const getFaviconUrl = (url: string) => {
    try {
      const domain = new URL(url.startsWith('http') ? url : `https://${url}`).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
    } catch {
      return undefined;
    }
  };

  const handleAddShortcut = () => {
    if (!newName.trim() || !newUrl.trim()) return;
    
    const url = newUrl.startsWith('http') ? newUrl : `https://${newUrl}`;
    
    if (editingId) {
      setShortcuts(shortcuts.map(s => 
        s.id === editingId 
          ? { ...s, name: newName.trim(), url, favicon: getFaviconUrl(url) }
          : s
      ));
      setEditingId(null);
    } else {
      const newShortcut: Shortcut = {
        id: Date.now().toString(),
        name: newName.trim(),
        url,
        favicon: getFaviconUrl(url),
      };
      setShortcuts([...shortcuts, newShortcut]);
    }
    
    setNewName("");
    setNewUrl("");
    setIsAddOpen(false);
  };

  const handleEditShortcut = (shortcut: Shortcut) => {
    setEditingId(shortcut.id);
    setNewName(shortcut.name);
    setNewUrl(shortcut.url);
    setIsAddOpen(true);
  };

  const handleRemoveShortcut = (id: string) => {
    setShortcuts(shortcuts.filter(s => s.id !== id));
    setIsAddOpen(false);
    setEditingId(null);
    setNewName("");
    setNewUrl("");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-end gap-2 p-4">
        <button
          onClick={() => navigate('/search?tab=images')}
          className="p-2 hover:bg-muted rounded-full transition-colors"
          title="Images"
        >
          <Image className="w-5 h-5 text-muted-foreground" />
        </button>
        <button
          onClick={() => navigate('/history')}
          className="p-2 hover:bg-muted rounded-full transition-colors"
          title="History"
        >
          <History className="w-5 h-5 text-muted-foreground" />
        </button>
        <Popover open={showAppsGrid} onOpenChange={setShowAppsGrid}>
          <PopoverTrigger asChild>
            <button className="p-2 hover:bg-muted rounded-full transition-colors" title="Apps">
              <Grid3X3 className="w-5 h-5 text-muted-foreground" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-[320px] p-2" align="end">
            <GoogleAppsGrid />
          </PopoverContent>
        </Popover>
        {user ? (
          <Avatar 
            className="w-8 h-8 cursor-pointer"
            onClick={() => navigate('/profile')}
          >
            <AvatarImage src={user.user_metadata?.avatar_url} />
            <AvatarFallback className="bg-primary text-primary-foreground text-sm">
              {user.email?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/auth')}
            className="text-muted-foreground"
          >
            Sign in
          </Button>
        )}</header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-start pt-[8vh] px-4">
        {/* Logo */}
        <div className="mb-6">
          <RidelLogo />
        </div>

        {/* Search Bar */}
        <div className="w-full max-w-[584px] mb-6">
          <SearchBar
            onSearch={handleSearch}
            onLucky={handleLucky}
            onNavigate={handleNavigate}
            compact={false}
          />
        </div>

        {/* Shortcuts Grid */}
        <div className="flex flex-wrap justify-center gap-3 max-w-[584px]">
          {shortcuts.map((shortcut) => (
            <div
              key={shortcut.id}
              className="group relative flex flex-col items-center gap-2 w-[112px] p-4 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
              onClick={() => handleNavigate(shortcut.url)}
            >
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <ShortcutIcon favicon={shortcut.favicon} name={shortcut.name} />
              </div>
              <span className="text-xs text-muted-foreground truncate w-full text-center">
                {shortcut.name}
              </span>
              
              {/* Edit button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditShortcut(shortcut);
                }}
                className="absolute top-2 right-2 p-1 rounded-full bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-muted"
              >
                <Pencil className="w-3 h-3 text-muted-foreground" />
              </button>
            </div>
          ))}
          
          {/* Add Shortcut Button */}
          <Dialog open={isAddOpen} onOpenChange={(open) => {
            setIsAddOpen(open);
            if (!open) {
              setEditingId(null);
              setNewName("");
              setNewUrl("");
            }
          }}>
            <DialogTrigger asChild>
              <button className="flex flex-col items-center gap-2 w-[112px] p-4 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                  <Plus className="w-6 h-6 text-muted-foreground" />
                </div>
                <span className="text-xs text-muted-foreground">Add shortcut</span>
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>{editingId ? 'Edit shortcut' : 'Add shortcut'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Name</label>
                  <Input
                    placeholder="e.g., YouTube"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">URL</label>
                  <Input
                    placeholder="e.g., youtube.com"
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                  />
                </div>
                <div className="flex justify-between">
                  {editingId && (
                    <Button
                      variant="destructive"
                      onClick={() => handleRemoveShortcut(editingId)}
                    >
                      Remove
                    </Button>
                  )}
                  <div className="flex gap-2 ml-auto">
                    <Button variant="outline" onClick={() => setIsAddOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddShortcut}>
                      {editingId ? 'Save' : 'Add'}
                    </Button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </main>

      {/* Customize Button */}
      <div className="fixed bottom-4 right-4">
        <Button
          variant="secondary"
          size="sm"
          className="gap-2"
          onClick={() => setShowCustomize(true)}
        >
          <Pencil className="w-4 h-4" />
          Customize RidelL
        </Button>
      </div>

      {/* Customize Panel */}
      <CustomizePanel 
        isOpen={showCustomize} 
        onClose={() => setShowCustomize(false)} 
      />
    </div>
  );
};

export default NewTab;
