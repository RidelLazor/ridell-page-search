import { useState, useEffect } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function usePWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Ensure we're in a browser environment
    if (typeof window === "undefined") {
      setIsReady(true);
      return;
    }

    // Check if running in standalone mode (installed as PWA)
    const checkStandalone = () => {
      try {
        const standalone = window.matchMedia("(display-mode: standalone)").matches ||
          (window.navigator as any).standalone === true ||
          document.referrer.includes("android-app://");
        setIsStandalone(standalone);
        setIsInstalled(standalone);
      } catch (e) {
        console.error("Error checking standalone mode:", e);
      }
    };

    checkStandalone();
    setIsReady(true);

    // Listen for display mode changes
    let mediaQuery: MediaQueryList | null = null;
    try {
      mediaQuery = window.matchMedia("(display-mode: standalone)");
      const handleChange = (e: MediaQueryListEvent) => {
        setIsStandalone(e.matches);
        setIsInstalled(e.matches);
      };
      mediaQuery.addEventListener("change", handleChange);
    } catch (e) {
      console.error("Error setting up media query listener:", e);
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Listen for app installed event
    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setIsInstallable(false);
      setIsInstalled(true);
    };

    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      if (mediaQuery) {
        try {
          mediaQuery.removeEventListener("change", () => {});
        } catch (e) {
          // Ignore cleanup errors
        }
      }
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const promptInstall = async (): Promise<boolean> => {
    if (!deferredPrompt) {
      return false;
    }

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === "accepted") {
        setDeferredPrompt(null);
        setIsInstallable(false);
        return true;
      }
    } catch (e) {
      console.error("Error prompting install:", e);
    }
    
    return false;
  };

  return {
    isInstallable,
    isInstalled,
    isStandalone,
    isReady,
    promptInstall,
  };
}
