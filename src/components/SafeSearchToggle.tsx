import { Shield, ShieldCheck } from "lucide-react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SafeSearchToggleProps {
  value?: boolean;
  onChange?: (value: boolean) => void;
}

const SafeSearchToggle = ({ value, onChange }: SafeSearchToggleProps) => {
  const [safeSearch, setSafeSearch] = useLocalStorage("ridel-safe-search", true);
  
  const isEnabled = value !== undefined ? value : safeSearch;
  
  const handleToggle = () => {
    const newValue = !isEnabled;
    setSafeSearch(newValue);
    onChange?.(newValue);
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={handleToggle}
            className={`inline-flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 hover:scale-105 ${
              isEnabled
                ? "bg-green-500/20 text-green-500 hover:bg-green-500/30"
                : "bg-secondary text-muted-foreground hover:bg-secondary/80"
            }`}
            aria-label={isEnabled ? "Safe Search On" : "Safe Search Off"}
          >
            {isEnabled ? (
              <ShieldCheck className="h-5 w-5" />
            ) : (
              <Shield className="h-5 w-5" />
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Safe Search: {isEnabled ? "On" : "Off"}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default SafeSearchToggle;

export const useSafeSearch = () => {
  const [safeSearch] = useLocalStorage("ridel-safe-search", true);
  return safeSearch;
};
