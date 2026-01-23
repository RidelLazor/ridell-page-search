import { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import Offline from "@/pages/Offline";

interface OfflineDetectorProps {
  children: React.ReactNode;
}

const OfflineDetector = ({ children }: OfflineDetectorProps) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <AnimatePresence mode="wait">
      {isOnline ? children : <Offline />}
    </AnimatePresence>
  );
};

export default OfflineDetector;
