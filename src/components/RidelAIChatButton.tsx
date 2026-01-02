import { MessageCircle, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

interface RidelAIChatButtonProps {
  onClick: () => void;
}

const RidelAIChatButton = ({ onClick }: RidelAIChatButtonProps) => {
  return (
    <motion.button
      onClick={onClick}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all bg-gradient-to-r from-primary/10 to-primary/5 hover:from-primary/20 hover:to-primary/10 text-primary border border-primary/20"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      title="Chat with Ridel AI"
    >
      <Sparkles className="h-3.5 w-3.5" />
      <span className="hidden sm:inline">Ask AI</span>
    </motion.button>
  );
};

export default RidelAIChatButton;
