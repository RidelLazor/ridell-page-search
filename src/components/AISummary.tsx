import { useState, useEffect } from "react";
import { Sparkles, ChevronDown, ChevronUp, Volume2, VolumeX, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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

  useEffect(() => {
    const generateSummary = async () => {
      if (!query || results.length === 0) {
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
  }, [query, results]);

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

  if (!query || results.length === 0) return null;

  if (loading) {
    return (
      <div className="mb-6 p-4 rounded-xl bg-secondary/50 border border-border">
        <div className="flex items-center gap-2 text-primary">
          <Sparkles className="h-5 w-5" />
          <span className="font-medium">AI Summary</span>
          <Loader2 className="h-4 w-4 animate-spin ml-2" />
        </div>
        <div className="mt-3 space-y-2">
          <div className="h-4 bg-muted rounded animate-pulse w-full" />
          <div className="h-4 bg-muted rounded animate-pulse w-4/5" />
          <div className="h-4 bg-muted rounded animate-pulse w-3/5" />
        </div>
      </div>
    );
  }

  if (error || !summary) return null;

  return (
    <div className="mb-6 p-4 rounded-xl bg-secondary/50 border border-border">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-primary">
          <Sparkles className="h-5 w-5" />
          <span className="font-medium">AI Summary</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleSpeech}
            className="p-1.5 rounded-full hover:bg-accent transition-colors"
            title={isSpeaking ? "Stop speaking" : "Listen"}
          >
            {isSpeaking ? (
              <VolumeX className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Volume2 className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 rounded-full hover:bg-accent transition-colors"
          >
            {expanded ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        </div>
      </div>
      {expanded && (
        <p className="mt-3 text-sm text-foreground leading-relaxed whitespace-pre-wrap">
          {summary}
        </p>
      )}
    </div>
  );
};

export default AISummary;
