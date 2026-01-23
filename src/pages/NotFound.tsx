import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-md"
      >
        {/* Animated 404 */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="mb-6"
        >
          <div className="relative inline-block">
            <motion.span
              animate={{ 
                rotateY: [0, 360],
              }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="text-8xl font-bold text-primary inline-block"
              style={{ transformStyle: "preserve-3d" }}
            >
              4
            </motion.span>
            <motion.span
              animate={{ 
                scale: [1, 1.2, 1],
              }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="text-8xl font-bold text-muted-foreground inline-block mx-2"
            >
              0
            </motion.span>
            <motion.span
              animate={{ 
                rotateY: [360, 0],
              }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="text-8xl font-bold text-primary inline-block"
              style={{ transformStyle: "preserve-3d" }}
            >
              4
            </motion.span>
          </div>
        </motion.div>

        {/* RidelL Logo Text */}
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-3xl font-bold mb-4"
        >
          <span className="text-primary">Ridel</span>
          <span className="text-foreground">L</span>
        </motion.h1>

        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-xl font-semibold text-foreground mb-2"
        >
          Page not found
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-muted-foreground mb-8"
        >
          The page you're looking for doesn't exist or has been moved. 
          Let's get you back on track!
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-3 justify-center"
        >
          <Button
            asChild
            size="lg"
            className="gap-2"
          >
            <Link to="/">
              <Home className="w-4 h-4" />
              Go to Home
            </Link>
          </Button>
          
          <Button
            asChild
            variant="outline"
            size="lg"
            className="gap-2"
          >
            <Link to="/search">
              <Search className="w-4 h-4" />
              Search RidelL
            </Link>
          </Button>
        </motion.div>

        {/* Back button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-6"
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.history.back()}
            className="gap-2 text-muted-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
            Go back
          </Button>
        </motion.div>

        {/* Path display */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-8 p-3 bg-muted rounded-lg"
        >
          <p className="text-xs text-muted-foreground">
            Requested path: <code className="text-foreground">{location.pathname}</code>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default NotFound;
