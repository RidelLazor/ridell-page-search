import { Bookmark, Star, History, Settings, Grid3X3, User } from "lucide-react";
import { motion } from "framer-motion";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { useNavigate } from "react-router-dom";

interface MobileBottomNavProps {
  user: SupabaseUser | null;
  onOpenBookmarks: () => void;
  onOpenFavorites: () => void;
  onOpenSettings: () => void;
  onOpenApps: () => void;
}

const MobileBottomNav = ({ 
  user, 
  onOpenBookmarks, 
  onOpenFavorites, 
  onOpenSettings,
  onOpenApps 
}: MobileBottomNavProps) => {
  const navigate = useNavigate();

  const handleProfileClick = () => {
    if (navigator.vibrate) {
      navigator.vibrate(30);
    }
    if (user) {
      navigate("/profile");
    } else {
      navigate("/auth");
    }
  };

  const handleNavClick = (action: () => void) => {
    if (navigator.vibrate) {
      navigator.vibrate(30);
    }
    action();
  };

  return (
    <motion.nav 
      className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-lg border-t border-border safe-area-bottom"
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <div className="flex items-center justify-around px-2 py-2 pb-safe">
        {/* Bookmarks */}
        <motion.button
          onClick={() => handleNavClick(onOpenBookmarks)}
          className="flex flex-col items-center justify-center gap-1 p-3 rounded-xl min-w-[60px] active:bg-accent transition-colors"
          whileTap={{ scale: 0.9 }}
        >
          <Bookmark className="h-6 w-6 text-muted-foreground" />
          <span className="text-[10px] text-muted-foreground font-medium">Bookmarks</span>
        </motion.button>

        {/* Favorites */}
        <motion.button
          onClick={() => handleNavClick(onOpenFavorites)}
          className="flex flex-col items-center justify-center gap-1 p-3 rounded-xl min-w-[60px] active:bg-accent transition-colors"
          whileTap={{ scale: 0.9 }}
        >
          <Star className="h-6 w-6 text-muted-foreground" />
          <span className="text-[10px] text-muted-foreground font-medium">Favorites</span>
        </motion.button>

        {/* Apps Grid */}
        <motion.button
          onClick={() => handleNavClick(onOpenApps)}
          className="flex flex-col items-center justify-center gap-1 p-3 rounded-xl min-w-[60px] active:bg-accent transition-colors"
          whileTap={{ scale: 0.9 }}
        >
          <Grid3X3 className="h-6 w-6 text-muted-foreground" />
          <span className="text-[10px] text-muted-foreground font-medium">Apps</span>
        </motion.button>

        {/* History - only for logged in users */}
        {user && (
          <motion.button
            onClick={() => {
              if (navigator.vibrate) navigator.vibrate(30);
              navigate("/history");
            }}
            className="flex flex-col items-center justify-center gap-1 p-3 rounded-xl min-w-[60px] active:bg-accent transition-colors"
            whileTap={{ scale: 0.9 }}
          >
            <History className="h-6 w-6 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground font-medium">History</span>
          </motion.button>
        )}

        {/* Profile / Settings */}
        <motion.button
          onClick={handleProfileClick}
          className="flex flex-col items-center justify-center gap-1 p-3 rounded-xl min-w-[60px] active:bg-accent transition-colors"
          whileTap={{ scale: 0.9 }}
        >
          {user ? (
            <>
              <div className="w-6 h-6 rounded-full overflow-hidden ring-2 ring-primary/30">
                <img 
                  src={user.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${user.email}&size=24`} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-[10px] text-muted-foreground font-medium">Profile</span>
            </>
          ) : (
            <>
              <User className="h-6 w-6 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground font-medium">Sign in</span>
            </>
          )}
        </motion.button>
      </div>
    </motion.nav>
  );
};

export default MobileBottomNav;
