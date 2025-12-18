import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Search, Bookmark, X, Clock, Trash2 } from "lucide-react";
import RidelLogo from "@/components/RidelLogo";
import ThemeToggle from "@/components/ThemeToggle";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useToast } from "@/hooks/use-toast";

interface SavedSearch {
  id: string;
  query: string;
  created_at: string;
}

interface BookmarkItem {
  title: string;
  url: string;
}

const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [bookmarks] = useLocalStorage<BookmarkItem[]>("ridel-bookmarks", []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        if (!session?.user) {
          navigate("/auth");
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate("/auth");
      } else {
        fetchSavedSearches();
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchSavedSearches = async () => {
    const { data, error } = await supabase
      .from("saved_searches")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setSavedSearches(data);
    }
  };

  const handleDeleteSearch = async (id: string) => {
    const { error } = await supabase
      .from("saved_searches")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete saved search",
        variant: "destructive",
      });
    } else {
      setSavedSearches(savedSearches.filter((s) => s.id !== id));
      toast({
        title: "Deleted",
        description: "Search removed from saved searches",
      });
    }
  };

  const handleSearchClick = (query: string) => {
    navigate(`/?q=${encodeURIComponent(query)}`);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/">
              <RidelLogo size="small" />
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button variant="outline" onClick={handleSignOut}>
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="flex items-center gap-6 mb-10">
          <img
            src={user?.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${user?.email}&size=96`}
            alt="Profile"
            className="w-24 h-24 rounded-full border-4 border-primary/20"
          />
          <div>
            <h1 className="text-2xl font-bold">
              {user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split("@")[0]}
            </h1>
            <p className="text-muted-foreground">{user?.email}</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Saved Searches */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Clock className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold">Saved Searches</h2>
            </div>
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              {savedSearches.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Search className="h-10 w-10 mx-auto mb-3 opacity-40" />
                  <p>No saved searches yet</p>
                  <p className="text-sm mt-1">Your search history will appear here</p>
                </div>
              ) : (
                <ul className="divide-y divide-border">
                  {savedSearches.map((search) => (
                    <li key={search.id} className="flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors">
                      <button
                        onClick={() => handleSearchClick(search.query)}
                        className="flex items-center gap-3 flex-1 text-left"
                      >
                        <Search className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{search.query}</span>
                      </button>
                      <button
                        onClick={() => handleDeleteSearch(search.id)}
                        className="p-2 hover:bg-destructive/10 rounded-full transition-colors text-muted-foreground hover:text-destructive"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          {/* Bookmarks */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Bookmark className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold">Bookmarks</h2>
            </div>
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              {bookmarks.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Bookmark className="h-10 w-10 mx-auto mb-3 opacity-40" />
                  <p>No bookmarks yet</p>
                  <p className="text-sm mt-1">Save your favorite websites while searching</p>
                </div>
              ) : (
                <ul className="divide-y divide-border">
                  {bookmarks.map((bookmark, index) => (
                    <li key={index} className="p-4 hover:bg-secondary/50 transition-colors">
                      <a
                        href={bookmark.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3"
                      >
                        <img
                          src={`https://www.google.com/s2/favicons?domain=${new URL(bookmark.url).hostname}&sz=32`}
                          alt=""
                          className="w-5 h-5"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{bookmark.title}</p>
                          <p className="text-sm text-muted-foreground truncate">{bookmark.url}</p>
                        </div>
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default Profile;
