import { useState, useEffect } from "react";
import { Sparkles, ChevronDown, ChevronUp, Volume2, VolumeX, Loader2, X, Flame } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { motion } from "framer-motion";

interface AISummaryProps {
  query: string;
  results: Array<{ title: string; url: string; description: string }>;
}

const AISummary = ({ query, results }: AISummaryProps) => {
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [aiSummaryEnabled] = useLocalStorage("ridel-ai-summary", true);

  useEffect(() => {
    // Reset dismissed state when query changes
    setDismissed(false);
  }, [query]);

  useEffect(() => {
    const generateSummary = async () => {
      if (!query || results.length === 0 || !aiSummaryEnabled) {
        setSummary(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const { data, error: fnError } = await supabase.functions.invoke("ai-summary", {
          body: { query, results: results.slice(0, 5) },
        });

        if (fnError) {
          throw new Error(fnError.message);
        }

        if (data?.summary) {
          setSummary(data.summary);
        } else {
          setError("Could not generate summary");
        }
      } catch (err) {
        console.error("AI summary error:", err);
        setError("AI summary unavailable");
      } finally {
        setLoading(false);
      }
    };

    generateSummary();
  }, [query, results, aiSummaryEnabled]);

  const toggleSpeech = () => {
    if (isSpeaking) {
      speechSynthesis.cancel();
      setIsSpeaking(false);
    } else if (summary) {
      const utterance = new SpeechSynthesisUtterance(summary);
      utterance.onend = () => setIsSpeaking(false);
      speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  const handleDismiss = () => {
    if (isSpeaking) {
      speechSynthesis.cancel();
      setIsSpeaking(false);
    }
    setDismissed(true);
  };

  if (!aiSummaryEnabled || !query || results.length === 0 || dismissed) return null;

  if (loading) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 p-4 rounded-xl relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, hsl(24 95% 15% / 0.9), hsl(0 70% 20% / 0.8), hsl(30 90% 20% / 0.85))",
          border: "1px solid hsl(24 80% 35% / 0.5)",
        }}
      >
        {/* Animated fire glow effect */}
        <div className="absolute inset-0 opacity-30">
          <div 
            className="absolute inset-0 animate-pulse"
            style={{
              background: "radial-gradient(ellipse at 30% 100%, hsl(30 100% 50% / 0.3) 0%, transparent 50%), radial-gradient(ellipse at 70% 100%, hsl(15 100% 45% / 0.25) 0%, transparent 50%)",
            }}
          />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Flame className="h-5 w-5 text-orange-400" />
                <motion.div
                  className="absolute inset-0"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <Flame className="h-5 w-5 text-yellow-400" />
                </motion.div>
              </div>
              <span className="font-semibold text-orange-200">Blaze Summary</span>
              <Loader2 className="h-4 w-4 animate-spin ml-2 text-orange-300" />
            </div>
            <button
              onClick={handleDismiss}
              className="p-1.5 rounded-full hover:bg-orange-500/20 transition-colors"
              title="Dismiss"
            >
              <X className="h-4 w-4 text-orange-300/70" />
            </button>
          </div>
          <div className="mt-3 space-y-2">
            <div className="h-4 bg-orange-500/20 rounded animate-pulse w-full" />
            <div className="h-4 bg-orange-500/20 rounded animate-pulse w-4/5" />
            <div className="h-4 bg-orange-500/20 rounded animate-pulse w-3/5" />
          </div>
        </div>
      </motion.div>
    );
  }

  if (error || !summary) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6 p-4 rounded-xl relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, hsl(24 95% 15% / 0.9), hsl(0 70% 20% / 0.8), hsl(30 90% 20% / 0.85))",
        border: "1px solid hsl(24 80% 35% / 0.5)",
        boxShadow: "0 4px 24px -4px hsl(20 100% 40% / 0.3), inset 0 1px 0 hsl(40 100% 60% / 0.1)",
      }}
    >
      {/* Animated fire glow effect */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <motion.div 
          className="absolute inset-0"
          animate={{ 
            background: [
              "radial-gradient(ellipse at 20% 100%, hsl(30 100% 50% / 0.4) 0%, transparent 50%), radial-gradient(ellipse at 80% 100%, hsl(15 100% 45% / 0.3) 0%, transparent 50%)",
              "radial-gradient(ellipse at 40% 100%, hsl(25 100% 55% / 0.45) 0%, transparent 55%), radial-gradient(ellipse at 60% 100%, hsl(10 100% 40% / 0.35) 0%, transparent 45%)",
              "radial-gradient(ellipse at 20% 100%, hsl(30 100% 50% / 0.4) 0%, transparent 50%), radial-gradient(ellipse at 80% 100%, hsl(15 100% 45% / 0.3) 0%, transparent 50%)",
            ]
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* Ember particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-orange-400/60"
            style={{ left: `${15 + i * 15}%`, bottom: 0 }}
            animate={{
              y: [-10, -60, -100],
              x: [0, (i % 2 === 0 ? 10 : -10), (i % 2 === 0 ? -5 : 5)],
              opacity: [0, 0.8, 0],
              scale: [0.5, 1, 0.3],
            }}
            transition={{
              duration: 2 + i * 0.3,
              repeat: Infinity,
              delay: i * 0.4,
              ease: "easeOut",
            }}
          />
        ))}
      </div>

      <div className="relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Flame className="h-5 w-5 text-orange-400" />
              <motion.div
                className="absolute inset-0"
                animate={{ opacity: [0.3, 0.8, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <Flame className="h-5 w-5 text-yellow-400" />
              </motion.div>
            </div>
            <span className="font-semibold text-orange-200 tracking-wide">Blaze Summary</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={toggleSpeech}
              className="p-1.5 rounded-full hover:bg-orange-500/20 transition-colors"
              title={isSpeaking ? "Stop speaking" : "Listen"}
            >
              {isSpeaking ? (
                <VolumeX className="h-4 w-4 text-orange-300/70" />
              ) : (
                <Volume2 className="h-4 w-4 text-orange-300/70" />
              )}
            </button>
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-1.5 rounded-full hover:bg-orange-500/20 transition-colors"
              title={expanded ? "Collapse" : "Expand"}
            >
              {expanded ? (
                <ChevronUp className="h-4 w-4 text-orange-300/70" />
              ) : (
                <ChevronDown className="h-4 w-4 text-orange-300/70" />
              )}
            </button>
            <button
              onClick={handleDismiss}
              className="p-1.5 rounded-full hover:bg-orange-500/20 transition-colors"
              title="Dismiss"
            >
              <X className="h-4 w-4 text-orange-300/70" />
            </button>
          </div>
        </div>
        {expanded && (
          <ScrollArea className="mt-3 max-h-48">
            <p className="text-sm text-orange-100/90 leading-relaxed whitespace-pre-wrap pr-3">
              {summary}
            </p>
          </ScrollArea>
        )}
      </div>
    </motion.div>
  );
};

export default AISummary;
