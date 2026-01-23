import { WifiOff, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

const Offline = () => {
  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-md"
      >
        {/* Dinosaur-inspired icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="mb-8"
        >
          <div className="w-32 h-32 mx-auto relative">
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="w-full h-full rounded-full bg-muted flex items-center justify-center"
            >
              <WifiOff className="w-16 h-16 text-muted-foreground" />
            </motion.div>
          </div>
        </motion.div>

        {/* RidelL Logo Text */}
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-4xl font-bold mb-4"
        >
          <span className="text-primary">Ridel</span>
          <span className="text-foreground">L</span>
        </motion.h1>

        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-2xl font-semibold text-foreground mb-2"
        >
          No internet connection
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-muted-foreground mb-8"
        >
          Check your connection and try again. RidelL needs internet to search the web for you.
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <Button
            onClick={handleRetry}
            size="lg"
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Try again
          </Button>
        </motion.div>

        {/* Fun decorative elements */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.1 }}
          transition={{ delay: 0.8 }}
          className="absolute inset-0 pointer-events-none overflow-hidden"
        >
          <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-foreground rounded-full" />
          <div className="absolute top-1/3 right-1/3 w-3 h-3 bg-foreground rounded-full" />
          <div className="absolute bottom-1/4 left-1/3 w-1 h-1 bg-foreground rounded-full" />
          <div className="absolute bottom-1/3 right-1/4 w-2 h-2 bg-foreground rounded-full" />
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Offline;
