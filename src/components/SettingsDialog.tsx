import { Settings, Moon, Sun, Shield, ShieldCheck, Volume2, VolumeX, History, Bell, Eye, EyeOff } from "lucide-react";
import { useTheme } from "next-themes";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useSoundSettings } from "@/hooks/useSoundSettings";
import { Separator } from "@/components/ui/separator";

interface SettingsDialogProps {
  onOpenSearchHistory?: () => void;
}

const SettingsDialog = ({ onOpenSearchHistory }: SettingsDialogProps) => {
  const { theme, setTheme } = useTheme();
  const [safeSearch, setSafeSearch] = useLocalStorage("ridel-safe-search", true);
  const { soundEnabled, setSoundEnabled } = useSoundSettings();
  const [showPreviews, setShowPreviews] = useLocalStorage("ridel-show-previews", true);
  const [notifications, setNotifications] = useLocalStorage("ridel-notifications", true);
  const [autoComplete, setAutoComplete] = useLocalStorage("ridel-autocomplete", true);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-secondary hover:bg-secondary/80 transition-all duration-300 hover:scale-105"
          aria-label="Settings"
          title="Settings"
        >
          <Settings className="h-5 w-5" />
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Settings
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Appearance */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground">Appearance</h3>
            <div className="flex items-center justify-between p-3 rounded-lg bg-accent/30 hover:bg-accent/50 transition-colors">
              <div className="flex items-center gap-3">
                {theme === "dark" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                <div>
                  <p className="font-medium text-sm">Dark Mode</p>
                  <p className="text-xs text-muted-foreground">Switch between light and dark themes</p>
                </div>
              </div>
              <Switch
                checked={theme === "dark"}
                onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
              />
            </div>
          </div>

          <Separator />

          {/* Search */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground">Search</h3>
            <div className="flex items-center justify-between p-3 rounded-lg bg-accent/30 hover:bg-accent/50 transition-colors">
              <div className="flex items-center gap-3">
                {safeSearch ? <ShieldCheck className="h-5 w-5 text-green-500" /> : <Shield className="h-5 w-5" />}
                <div>
                  <p className="font-medium text-sm">Safe Search</p>
                  <p className="text-xs text-muted-foreground">Filter explicit content from results</p>
                </div>
              </div>
              <Switch
                checked={safeSearch}
                onCheckedChange={setSafeSearch}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-accent/30 hover:bg-accent/50 transition-colors">
              <div className="flex items-center gap-3">
                {showPreviews ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
                <div>
                  <p className="font-medium text-sm">Show Previews</p>
                  <p className="text-xs text-muted-foreground">Display preview cards in results</p>
                </div>
              </div>
              <Switch
                checked={showPreviews}
                onCheckedChange={setShowPreviews}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-accent/30 hover:bg-accent/50 transition-colors">
              <div className="flex items-center gap-3">
                <History className="h-5 w-5" />
                <div>
                  <p className="font-medium text-sm">Autocomplete</p>
                  <p className="text-xs text-muted-foreground">Show search suggestions while typing</p>
                </div>
              </div>
              <Switch
                checked={autoComplete}
                onCheckedChange={setAutoComplete}
              />
            </div>
          </div>

          <Separator />

          {/* Sound & Notifications */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground">Sound & Notifications</h3>
            <div className="flex items-center justify-between p-3 rounded-lg bg-accent/30 hover:bg-accent/50 transition-colors">
              <div className="flex items-center gap-3">
                {soundEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
                <div>
                  <p className="font-medium text-sm">Sound Effects</p>
                  <p className="text-xs text-muted-foreground">Play sounds for transitions and actions</p>
                </div>
              </div>
              <Switch
                checked={soundEnabled}
                onCheckedChange={setSoundEnabled}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-accent/30 hover:bg-accent/50 transition-colors">
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5" />
                <div>
                  <p className="font-medium text-sm">Notifications</p>
                  <p className="text-xs text-muted-foreground">Show browser notifications</p>
                </div>
              </div>
              <Switch
                checked={notifications}
                onCheckedChange={setNotifications}
              />
            </div>
          </div>

          <Separator />

          {/* History */}
          {onOpenSearchHistory && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">History</h3>
              <button
                onClick={onOpenSearchHistory}
                className="w-full flex items-center gap-3 p-3 rounded-lg bg-accent/30 hover:bg-accent/50 transition-colors text-left"
              >
                <History className="h-5 w-5" />
                <div>
                  <p className="font-medium text-sm">View Search History</p>
                  <p className="text-xs text-muted-foreground">See your recent searches</p>
                </div>
              </button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsDialog;
