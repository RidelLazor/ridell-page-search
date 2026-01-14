import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, RotateCw, X, ExternalLink, Share2, Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface InAppBrowserProps {
  url: string;
  onClose: () => void;
  onNavigate?: (url: string) => void;
}

const InAppBrowser = ({ url, onClose, onNavigate }: InAppBrowserProps) => {
  const [currentUrl, setCurrentUrl] = useState(url);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const historyRef = useRef<string[]>([url]);
  const historyIndexRef = useRef(0);
  const { toast } = useToast();

  useEffect(() => {
    setCurrentUrl(url);
    setLoading(true);
    setError(null);
  }, [url]);

  const handleLoad = () => {
    setLoading(false);
    setError(null);
  };

  const handleError = () => {
    setLoading(false);
    // Many sites block iframes - offer to open externally
    setError("This site cannot be displayed in-app due to security restrictions.");
  };

  const goBack = () => {
    if (historyIndexRef.current > 0) {
      historyIndexRef.current--;
      const newUrl = historyRef.current[historyIndexRef.current];
      setCurrentUrl(newUrl);
      setCanGoBack(historyIndexRef.current > 0);
      setCanGoForward(true);
      onNavigate?.(newUrl);
    }
  };

  const goForward = () => {
    if (historyIndexRef.current < historyRef.current.length - 1) {
      historyIndexRef.current++;
      const newUrl = historyRef.current[historyIndexRef.current];
      setCurrentUrl(newUrl);
      setCanGoForward(historyIndexRef.current < historyRef.current.length - 1);
      setCanGoBack(true);
      onNavigate?.(newUrl);
    }
  };

  const refresh = () => {
    setLoading(true);
    setError(null);
    if (iframeRef.current) {
      iframeRef.current.src = currentUrl;
    }
  };

  const openExternal = () => {
    window.open(currentUrl, "_blank", "noopener,noreferrer");
  };

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      toast({ title: "URL copied to clipboard" });
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      toast({ title: "Failed to copy URL", variant: "destructive" });
    }
  };

  const shareUrl = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: document.title,
          url: currentUrl,
        });
      } catch (e) {
        // User cancelled or error
      }
    } else {
      copyUrl();
    }
  };

  const hostname = (() => {
    try {
      return new URL(currentUrl).hostname;
    } catch {
      return currentUrl;
    }
  })();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed inset-0 z-[100] bg-background flex flex-col"
    >
      {/* Navigation bar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-card">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={goBack}
          disabled={!canGoBack}
          className="p-2 rounded-full hover:bg-muted disabled:opacity-30"
        >
          <ArrowLeft className="h-5 w-5" />
        </motion.button>
        
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={goForward}
          disabled={!canGoForward}
          className="p-2 rounded-full hover:bg-muted disabled:opacity-30"
        >
          <ArrowRight className="h-5 w-5" />
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.9, rotate: 360 }}
          onClick={refresh}
          className="p-2 rounded-full hover:bg-muted"
        >
          <RotateCw className={`h-5 w-5 ${loading ? "animate-spin" : ""}`} />
        </motion.button>

        {/* URL bar */}
        <div className="flex-1 flex items-center gap-2 px-3 py-1.5 bg-muted rounded-full text-sm truncate">
          <span className="text-muted-foreground truncate">{hostname}</span>
        </div>

        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={shareUrl}
          className="p-2 rounded-full hover:bg-muted"
        >
          <Share2 className="h-5 w-5" />
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={copyUrl}
          className="p-2 rounded-full hover:bg-muted"
        >
          {copied ? <Check className="h-5 w-5 text-green-500" /> : <Copy className="h-5 w-5" />}
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={openExternal}
          className="p-2 rounded-full hover:bg-muted"
        >
          <ExternalLink className="h-5 w-5" />
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onClose}
          className="p-2 rounded-full hover:bg-muted"
        >
          <X className="h-5 w-5" />
        </motion.button>
      </div>

      {/* Loading bar */}
      {loading && (
        <div className="h-0.5 bg-primary/20 overflow-hidden">
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            className="h-full w-1/3 bg-primary"
          />
        </div>
      )}

      {/* Content */}
      <div className="flex-1 relative">
        {error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <ExternalLink className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground max-w-sm">{error}</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={openExternal}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-full font-medium"
            >
              Open in Browser
            </motion.button>
          </div>
        ) : (
          <iframe
            ref={iframeRef}
            src={currentUrl}
            className="w-full h-full border-0"
            onLoad={handleLoad}
            onError={handleError}
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
            title="In-app browser"
          />
        )}
      </div>
    </motion.div>
  );
};

export default InAppBrowser;
