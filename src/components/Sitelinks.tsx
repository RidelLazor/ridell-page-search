import { motion } from "framer-motion";
import { ChevronRight, Clock } from "lucide-react";

interface Sitelink {
  title: string;
  url: string;
  description?: string;
}

interface SitelinksProps {
  sitelinks: Sitelink[];
  onNavigate: (url: string) => void;
}

const Sitelinks = ({ sitelinks, onNavigate }: SitelinksProps) => {
  if (!sitelinks || sitelinks.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.1 }}
      className="mt-3 border-l-2 border-border pl-4 space-y-1"
    >
      {sitelinks.slice(0, 6).map((link, index) => (
        <motion.button
          key={index}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
          onClick={() => onNavigate(link.url)}
          className="group flex items-center justify-between w-full py-2 px-3 rounded-lg hover:bg-accent/50 transition-colors text-left"
        >
          <div className="flex-1 min-w-0">
            <h4 className="text-blue-600 dark:text-blue-400 group-hover:underline font-medium text-sm">
              {link.title}
            </h4>
            {link.description && (
              <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                {link.description}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 ml-2 text-muted-foreground">
            <Clock className="h-3.5 w-3.5 opacity-50" />
            <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </motion.button>
      ))}
    </motion.div>
  );
};

export default Sitelinks;
