import * as React from "react";

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  // Initialize with a safe default based on common mobile width
  const [isMobile, setIsMobile] = React.useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      return window.innerWidth < MOBILE_BREAKPOINT;
    } catch {
      return false;
    }
  });

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
      const onChange = () => {
        setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
      };
      mql.addEventListener("change", onChange);
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
      return () => mql.removeEventListener("change", onChange);
    } catch (e) {
      console.error("Error setting up mobile detection:", e);
    }
  }, []);

  return isMobile;
}
