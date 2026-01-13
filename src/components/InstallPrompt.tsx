import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download, Monitor, Smartphone, Sparkles, Zap, Layers } from "lucide-react";
import { usePWA } from "@/hooks/usePWA";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";

const InstallPrompt = () => {
  const { isInstallable, isInstalled, isStandalone, promptInstall } = usePWA();
  const isMobile = useIsMobile();
  const [showPrompt, setShowPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Show on both mobile and desktop when installable
    const hasSeenPrompt = localStorage.getItem("ridel-install-prompt-dismissed");
    const lastDismissed = hasSeenPrompt ? parseInt(hasSeenPrompt) : 0;
    const daysSinceDismissed = (Date.now() - lastDismissed) / (1000 * 60 * 60 * 24);
    
    // Show again after 3 days
    if (isInstallable && !isInstalled && !isStandalone && daysSinceDismissed > 3) {
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isInstallable, isInstalled, isStandalone]);

  const handleInstall = async () => {
    const installed = await promptInstall();
    if (installed) {
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setDismissed(true);
    localStorage.setItem("ridel-install-prompt-dismissed", Date.now().toString());
  };

  if (!showPrompt || dismissed) {
    return null;
  }

  return (
    <AnimatePresence>
      {showPrompt && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={handleDismiss}
          />
          
          {/* Modal - Desktop: centered, Mobile: bottom sheet */}
          <motion.div
            initial={{ opacity: 0, y: isMobile ? 100 : 0, scale: isMobile ? 0.9 : 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: isMobile ? 100 : 0, scale: isMobile ? 0.9 : 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={`fixed z-50 ${
              isMobile 
                ? "bottom-0 left-0 right-0 p-4" 
                : "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-4"
            }`}
          >
            <div className="bg-card border border-border rounded-3xl shadow-2xl overflow-hidden max-w-md mx-auto">
              {/* Header with gradient */}
              <div 
                className="p-6 pb-4 relative"
                style={{
                  background: "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary)/0.7) 100%)",
                }}
              >
                <button
                  onClick={handleDismiss}
                  className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                >
                  <X className="h-5 w-5 text-white" />
                </button>
                
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-white shadow-lg flex items-center justify-center">
                    {isMobile ? (
                      <Smartphone className="h-8 w-8 text-primary" />
                    ) : (
                      <Monitor className="h-8 w-8 text-primary" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Install Ridel App</h2>
                    <p className="text-white/80 text-sm">
                      {isMobile ? "Get the best mobile experience" : "Get the full desktop experience"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Features */}
              <div className="p-6 space-y-4">
                <p className="text-muted-foreground text-sm">
                  Install Ridel for exclusive app-only features:
                </p>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Layers className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Tab Navigation</p>
                      <p className="text-xs text-muted-foreground">
                        {isMobile ? "Switch between searches easily" : "Browser-like tabs for multiple searches"}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Zap className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Faster Performance</p>
                      <p className="text-xs text-muted-foreground">Native-like speed and offline support</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Sparkles className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Exclusive Features</p>
                      <p className="text-xs text-muted-foreground">
                        {isMobile ? "Quick actions, gestures & more" : "Keyboard shortcuts, quick actions & more"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={handleDismiss}
                  >
                    Not Now
                  </Button>
                  <Button
                    className="flex-1 gap-2"
                    onClick={handleInstall}
                  >
                    <Download className="h-4 w-4" />
                    Install
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default InstallPrompt;
