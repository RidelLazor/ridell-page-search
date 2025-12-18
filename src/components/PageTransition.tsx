import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from "framer-motion";
import { ReactNode, useEffect, useState } from "react";

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

export const PageTransition = ({ children, className = "" }: PageTransitionProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export const FadeIn = ({ children, delay = 0, className = "" }: PageTransitionProps & { delay?: number }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export const FloatingBlob = ({ 
  className, 
  delay = 0 
}: { 
  className: string; 
  delay?: number;
}) => {
  return (
    <motion.div
      className={className}
      animate={{
        y: [0, -20, 0],
        x: [0, 10, 0],
        scale: [1, 1.05, 1],
      }}
      transition={{
        duration: 8,
        delay,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
};

// Hook to track mouse position
export const useMouseParallax = (strength: number = 0.02) => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX - window.innerWidth / 2) * strength;
      const y = (e.clientY - window.innerHeight / 2) * strength;
      setMousePosition({ x, y });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [strength]);

  return mousePosition;
};

export const ParallaxBlob = ({ 
  className, 
  delay = 0,
  parallaxStrength = 1,
  mouseX = 0,
  mouseY = 0,
}: { 
  className: string; 
  delay?: number;
  parallaxStrength?: number;
  mouseX?: number;
  mouseY?: number;
}) => {
  const springConfig = { damping: 25, stiffness: 100 };
  const x = useSpring(mouseX * parallaxStrength, springConfig);
  const y = useSpring(mouseY * parallaxStrength, springConfig);

  useEffect(() => {
    x.set(mouseX * parallaxStrength);
    y.set(mouseY * parallaxStrength);
  }, [mouseX, mouseY, parallaxStrength, x, y]);

  return (
    <motion.div
      className={className}
      style={{ x, y }}
      animate={{
        scale: [1, 1.05, 1],
      }}
      transition={{
        duration: 8,
        delay,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
};

export default PageTransition;
