import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ExternalLink, RotateCw } from "lucide-react";

interface RidelAIOverlayProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  originRect?: { x: number; y: number } | null;
}

const RIDEL_AI_URL = "https://ridelai.vercel.app/";

const RidelAIOverlay = ({ open, onOpenChange, originRect }: RidelAIOverlayProps) => {
  const [loading, setLoading] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const originX = originRect?.x ?? window.innerWidth / 2;
  const originY = originRect?.y ?? window.innerHeight / 2;

  const handleClose = useCallback(() => {
    onOpenChange(false);
    setLoading(true);
  }, [onOpenChange]);

  const handleRefresh = useCallback(() => {
    setLoading(true);
    if (iframeRef.current) {
      iframeRef.current.src = RIDEL_AI_URL;
    }
  }, []);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] bg-background flex flex-col"
          initial={{
            clipPath: `circle(0px at ${originX}px ${originY}px)`,
            opacity: 0.8,
          }}
          animate={{
            clipPath: `circle(150vmax at ${originX}px ${originY}px)`,
            opacity: 1,
          }}
          exit={{
            clipPath: `circle(0px at ${originX}px ${originY}px)`,
            opacity: 0,
          }}
          transition={{
            duration: 0.5,
            ease: [0.4, 0, 0.2, 1],
          }}
        >
          {/* Header bar */}
          <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-card">
            <div className="flex-1 flex items-center gap-2 px-3 py-1.5 bg-muted rounded-full text-sm">
              <span className="text-primary font-medium">Ridel AI</span>
              <span className="text-muted-foreground text-xs truncate">ridelai.vercel.app</span>
            </div>

            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleRefresh}
              className="p-2 rounded-full hover:bg-muted"
              title="Refresh"
            >
              <RotateCw className={`h-5 w-5 ${loading ? "animate-spin" : ""}`} />
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => window.open(RIDEL_AI_URL, "_blank", "noopener,noreferrer")}
              className="p-2 rounded-full hover:bg-muted"
              title="Open in new tab"
            >
              <ExternalLink className="h-5 w-5" />
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleClose}
              className="p-2 rounded-full hover:bg-muted"
              title="Close"
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

          {/* Iframe */}
          <div className="flex-1 relative">
            <iframe
              ref={iframeRef}
              src={RIDEL_AI_URL}
              className="w-full h-full border-0"
              onLoad={() => setLoading(false)}
              allow="microphone; camera"
              title="Ridel AI"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default RidelAIOverlay;
