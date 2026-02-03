import { useState, useCallback } from "react";

// Demo site key for testing - replace with your actual site key
// Get your site key from: https://dash.cloudflare.com/turnstile
export const TURNSTILE_SITE_KEY = "1x00000000000000000000AA"; // Demo visible pass key

interface UseTurnstileOptions {
  onSuccess?: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
}

export function useTurnstile(options: UseTurnstileOptions = {}) {
  const [token, setToken] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [isError, setIsError] = useState(false);

  const handleVerify = useCallback((newToken: string) => {
    setToken(newToken);
    setIsVerified(true);
    setIsError(false);
    options.onSuccess?.(newToken);
  }, [options]);

  const handleError = useCallback(() => {
    setToken(null);
    setIsVerified(false);
    setIsError(true);
    options.onError?.();
  }, [options]);

  const handleExpire = useCallback(() => {
    setToken(null);
    setIsVerified(false);
    options.onExpire?.();
  }, [options]);

  const reset = useCallback(() => {
    setToken(null);
    setIsVerified(false);
    setIsError(false);
  }, []);

  return {
    token,
    isVerified,
    isError,
    handleVerify,
    handleError,
    handleExpire,
    reset,
  };
}
