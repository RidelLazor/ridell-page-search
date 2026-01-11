import { motion } from "framer-motion";
import { Search } from "lucide-react";

interface SpellCorrectionProps {
  originalQuery: string;
  correctedQuery: string;
  onSearchCorrected: (query: string) => void;
  onSearchOriginal: (query: string) => void;
}

const SpellCorrection = ({
  originalQuery,
  correctedQuery,
  onSearchCorrected,
  onSearchOriginal,
}: SpellCorrectionProps) => {
  if (!correctedQuery || correctedQuery.toLowerCase() === originalQuery.toLowerCase()) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-4 text-sm"
    >
      <p className="text-muted-foreground">
        Showing results for{" "}
        <button
          onClick={() => onSearchCorrected(correctedQuery)}
          className="text-blue-600 dark:text-blue-400 hover:underline font-medium italic"
        >
          {correctedQuery}
        </button>
      </p>
      <p className="text-muted-foreground mt-1">
        Search instead for{" "}
        <button
          onClick={() => onSearchOriginal(originalQuery)}
          className="text-blue-600 dark:text-blue-400 hover:underline"
        >
          {originalQuery}
        </button>
      </p>
    </motion.div>
  );
};

export default SpellCorrection;
