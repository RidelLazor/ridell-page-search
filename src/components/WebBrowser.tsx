import { useState, useEffect, KeyboardEvent } from "react";
import { ArrowLeft, ArrowRight, Home, RefreshCw, ExternalLink, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

interface WebBrowserProps {
  url: string;
  onClose: () => void;
  onNavigate: (url: string) => void;
}

const WebBrowser = ({ url, onClose, onNavigate }: WebBrowserProps) => {
  const [currentUrl, setCurrentUrl] = useState(url);
  const [inputUrl, setInputUrl] = useState(url);
  const [loading, setLoading] = useState(true);
  const [iframeError, setIframeError] = useState(false);
  const [history, setHistory] = useState<string[]>([url]);
  const [historyIndex, setHistoryIndex] = useState(0);

  useEffect(() => {
    setCurrentUrl(url);
    setInputUrl(url);
    setLoading(true);
    setIframeError(false);
    if (!history.includes(url)) {
      setHistory(prev => [...prev.slice(0, historyIndex + 1), url]);
      setHistoryIndex(prev => prev + 1);
    }
  }, [url]);

  const handleNavigate = () => {
    let newUrl = inputUrl.trim();
    if (!newUrl) return;
    
    if (!newUrl.startsWith("http://") && !newUrl.startsWith("https://")) {
      newUrl = `https://${newUrl}`;
    }
    
    setCurrentUrl(newUrl);
    setInputUrl(newUrl);
    setLoading(true);
    setIframeError(false);
    setHistory(prev => [...prev.slice(0, historyIndex + 1), newUrl]);
    setHistoryIndex(prev => prev + 1);
    onNavigate(newUrl);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleNavigate();
    }
  };

  const goBack = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      const newUrl = history[newIndex];
      setCurrentUrl(newUrl);
      setInputUrl(newUrl);
      setLoading(true);
      setIframeError(false);
    }
  };

  const goForward = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      const newUrl = history[newIndex];
      setCurrentUrl(newUrl);
      setInputUrl(newUrl);
      setLoading(true);
      setIframeError(false);
    }
  };

  const refresh = () => {
    setLoading(true);
    setIframeError(false);
    // Force iframe reload by setting a new key
    const iframe = document.querySelector('iframe');
    if (iframe) {
      iframe.src = currentUrl;
    }
  };

  const handleIframeLoad = () => {
    setLoading(false);
  };

  const handleIframeError = () => {
    setLoading(false);
    setIframeError(true);
  };

  const openInNewTab = () => {
    window.location.href = currentUrl;
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Browser toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b bg-muted/30">
        <Button
          variant="ghost"
          size="icon"
          onClick={goBack}
          disabled={historyIndex === 0}
          className="h-8 w-8"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={goForward}
          disabled={historyIndex >= history.length - 1}
          className="h-8 w-8"
        >
          <ArrowRight className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={refresh}
          className="h-8 w-8"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-8 w-8"
        >
          <Home className="h-4 w-4" />
        </Button>
        
        {/* URL bar */}
        <div className="flex-1 mx-2">
          <input
            type="text"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full py-1.5 px-3 text-sm bg-background border border-border rounded-full focus:outline-none focus:ring-1 focus:ring-primary/20"
          />
        </div>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={openInNewTab}
          className="h-8 w-8"
          title="Open in current tab"
        >
          <ExternalLink className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-8 w-8"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content area */}
      <div className="flex-1 relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background z-10">
            <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
        
        {iframeError ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <p className="text-lg font-medium mb-2">This website cannot be displayed in the embedded browser</p>
            <p className="text-muted-foreground mb-4">Some websites block iframe embedding for security reasons.</p>
            <Button onClick={openInNewTab}>
              Open in current tab
            </Button>
          </div>
        ) : (
          <iframe
            src={currentUrl}
            className="w-full h-full border-0"
            onLoad={handleIframeLoad}
            onError={handleIframeError}
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
          />
        )}
      </div>
    </div>
  );
};

export default WebBrowser;
