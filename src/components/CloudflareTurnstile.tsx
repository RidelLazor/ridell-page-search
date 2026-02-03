import { useEffect, useRef, useCallback, useState } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement | string,
        options: {
          sitekey: string;
          callback?: (token: string) => void;
          "error-callback"?: () => void;
          "expired-callback"?: () => void;
          theme?: "light" | "dark" | "auto";
          size?: "normal" | "compact";
        }
      ) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
    onloadTurnstileCallback?: () => void;
  }
}

interface CloudflareTurnstileProps {
  siteKey: string;
  onVerify: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
  theme?: "light" | "dark" | "auto";
  size?: "normal" | "compact";
  className?: string;
}

const CloudflareTurnstile = ({
  siteKey,
  onVerify,
  onError,
  onExpire,
  theme = "auto",
  size = "normal",
  className = "",
}: CloudflareTurnstileProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const renderWidget = useCallback(() => {
    if (!containerRef.current || !window.turnstile || widgetIdRef.current) return;

    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: siteKey,
      callback: onVerify,
      "error-callback": onError,
      "expired-callback": onExpire,
      theme,
      size,
    });
  }, [siteKey, onVerify, onError, onExpire, theme, size]);

  useEffect(() => {
    // Check if script is already loaded
    if (window.turnstile) {
      setIsLoaded(true);
      return;
    }

    // Check if script is already being loaded
    const existingScript = document.querySelector(
      'script[src*="turnstile"]'
    );
    
    if (existingScript) {
      window.onloadTurnstileCallback = () => setIsLoaded(true);
      return;
    }

    // Load the Turnstile script
    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onloadTurnstileCallback";
    script.async = true;
    script.defer = true;

    window.onloadTurnstileCallback = () => setIsLoaded(true);

    document.head.appendChild(script);

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isLoaded) {
      renderWidget();
    }
  }, [isLoaded, renderWidget]);

  return <div ref={containerRef} className={className} />;
};

export default CloudflareTurnstile;
