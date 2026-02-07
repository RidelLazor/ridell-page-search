import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Ember particle for background
interface Ember {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  opacity: number;
}

// Click spark effect
interface ClickSpark {
  id: number;
  x: number;
  y: number;
}

// Background ember particles floating upward
export const BlazeEmbers = ({ count = 20 }: { count?: number }) => {
  const [embers, setEmbers] = useState<Ember[]>([]);

  useEffect(() => {
    const generated: Ember[] = [];
    for (let i = 0; i < count; i++) {
      generated.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 4 + 2,
        duration: Math.random() * 8 + 6,
        delay: Math.random() * 5,
        opacity: Math.random() * 0.5 + 0.2,
      });
    }
    setEmbers(generated);
  }, [count]);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {embers.map((ember) => (
        <motion.div
          key={ember.id}
          className="absolute rounded-full"
          style={{
            left: `${ember.x}%`,
            bottom: "-20px",
            width: ember.size,
            height: ember.size,
            background: `radial-gradient(circle, hsl(24 95% 60%) 0%, hsl(15 90% 50%) 50%, transparent 100%)`,
            boxShadow: `0 0 ${ember.size * 2}px hsl(24 95% 55% / 0.6)`,
          }}
          animate={{
            y: [0, -window.innerHeight - 100],
            x: [0, Math.sin(ember.id) * 50, Math.cos(ember.id) * 30, 0],
            opacity: [0, ember.opacity, ember.opacity, 0],
            scale: [0.5, 1, 1, 0.3],
          }}
          transition={{
            duration: ember.duration,
            delay: ember.delay,
            repeat: Infinity,
            ease: "easeOut",
          }}
        />
      ))}
      
      {/* Subtle fire glow at bottom */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
        style={{
          background: "linear-gradient(to top, hsl(24 80% 50% / 0.08), transparent)",
        }}
      />
    </div>
  );
};

// Click spark effect hook and component
export const useBlazeClick = () => {
  const [sparks, setSparks] = useState<ClickSpark[]>([]);

  const createSpark = useCallback((e: MouseEvent) => {
    const newSpark: ClickSpark = {
      id: Date.now() + Math.random(),
      x: e.clientX,
      y: e.clientY,
    };
    setSparks((prev) => [...prev, newSpark]);

    // Remove spark after animation
    setTimeout(() => {
      setSparks((prev) => prev.filter((s) => s.id !== newSpark.id));
    }, 600);
  }, []);

  useEffect(() => {
    document.addEventListener("click", createSpark);
    return () => document.removeEventListener("click", createSpark);
  }, [createSpark]);

  return sparks;
};

export const BlazeClickEffect = () => {
  const sparks = useBlazeClick();

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999]">
      <AnimatePresence>
        {sparks.map((spark) => (
          <div key={spark.id} style={{ position: "absolute", left: spark.x, top: spark.y }}>
            {/* Central flash */}
            <motion.div
              className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{
                background: "radial-gradient(circle, hsl(45 100% 70%) 0%, hsl(24 95% 55%) 40%, transparent 70%)",
              }}
              initial={{ width: 0, height: 0, opacity: 1 }}
              animate={{ width: 40, height: 40, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />
            
            {/* Spark particles */}
            {[...Array(8)].map((_, i) => {
              const angle = (i / 8) * Math.PI * 2;
              const distance = 25 + Math.random() * 20;
              return (
                <motion.div
                  key={i}
                  className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full"
                  style={{
                    width: 4 + Math.random() * 3,
                    height: 4 + Math.random() * 3,
                    background: i % 2 === 0 
                      ? "hsl(24 95% 55%)" 
                      : i % 3 === 0 
                        ? "hsl(45 100% 60%)" 
                        : "hsl(15 90% 50%)",
                    boxShadow: "0 0 6px hsl(24 95% 55% / 0.8)",
                  }}
                  initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                  animate={{ 
                    x: Math.cos(angle) * distance,
                    y: Math.sin(angle) * distance - 10,
                    opacity: 0,
                    scale: 0.3,
                  }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              );
            })}
            
            {/* Ring expansion */}
            <motion.div
              className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2"
              style={{
                borderColor: "hsl(24 95% 55% / 0.6)",
              }}
              initial={{ width: 10, height: 10, opacity: 0.8 }}
              animate={{ width: 60, height: 60, opacity: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
};

// Combined export for easy usage
const BlazeEffects = ({ emberCount = 15 }: { emberCount?: number }) => {
  return (
    <>
      <BlazeEmbers count={emberCount} />
      <BlazeClickEffect />
    </>
  );
};

export default BlazeEffects;
