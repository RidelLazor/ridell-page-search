import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import RidelLogo from "@/components/RidelLogo";
import SearchBar from "@/components/SearchBar";
import QuickShortcuts from "@/components/QuickShortcuts";
import TrendingSearches from "@/components/TrendingSearches";
import ThemeToggle from "@/components/ThemeToggle";
import { User } from "@supabase/supabase-js";

const NewTab = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
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

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-end p-4">
        <ThemeToggle />
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 -mt-20">
        {/* Time Display */}
        <div className="text-center mb-8">
          <h1 className="text-6xl md:text-8xl font-light text-foreground tracking-tight">
            {formatTime(currentTime)}
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mt-2">
            {getGreeting()}{user?.email ? `, ${user.email.split('@')[0]}` : ''}
          </p>
          <p className="text-sm text-muted-foreground/70 mt-1">
            {formatDate(currentTime)}
          </p>
        </div>

        {/* Logo */}
        <div className="mb-6 scale-75">
          <RidelLogo />
        </div>

        {/* Search Bar */}
        <div className="w-full max-w-2xl mb-8">
          <SearchBar
            onSearch={handleSearch}
            onLucky={handleLucky}
            onNavigate={(url) => window.open(url, '_blank')}
          />
        </div>

        {/* Quick Shortcuts */}
        <div className="w-full max-w-4xl">
          <QuickShortcuts onNavigate={(url) => window.open(url, '_blank')} />
        </div>
      </main>

      {/* Footer with Trending */}
      <footer className="p-4 pb-8">
        <div className="max-w-4xl mx-auto">
          <TrendingSearches onSearch={handleSearch} />
        </div>
      </footer>
    </div>
  );
};

export default NewTab;
