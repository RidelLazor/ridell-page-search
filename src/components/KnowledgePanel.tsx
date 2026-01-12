import { motion } from "framer-motion";
import { ChevronRight, ExternalLink, Star } from "lucide-react";
import { useState } from "react";

interface AppRating {
  store: string;
  rating: string;
  url?: string;
}

interface KnowledgePanelData {
  title: string;
  subtitle?: string;
  description?: string;
  image?: string;
  images?: string[];
  source?: string;
  sourceUrl?: string;
  attributes?: { label: string; value: string }[];
  appRatings?: AppRating[];
  // Company-specific fields
  founded?: string;
  headquarters?: string;
  industry?: string;
  ceo?: string;
}

interface KnowledgePanelProps {
  data: KnowledgePanelData | null;
  onNavigate: (url: string) => void;
}

const KnowledgePanel = ({ data, onNavigate }: KnowledgePanelProps) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  if (!data) {
    return null;
  }

  const allImages = data.images?.length ? data.images : data.image ? [data.image] : [];

  return (
    <motion.aside
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full lg:w-80 xl:w-96 flex-shrink-0 bg-card border border-border rounded-xl p-4 lg:p-5 space-y-4 h-fit"
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold">{data.title}</h2>
          {data.subtitle && (
            <p className="text-sm text-muted-foreground">{data.subtitle}</p>
          )}
        </div>
        <button className="p-2 rounded-full hover:bg-accent transition-colors">
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </button>
      </div>

      {/* Company Logo */}
      {allImages.length > 0 && (
        <div className="space-y-2">
          <div className="relative flex items-center justify-center p-6 rounded-lg bg-muted/50">
            <motion.img
              key={selectedImageIndex}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
              src={allImages[selectedImageIndex]}
              alt={`${data.title} logo`}
              className="max-w-[180px] max-h-[120px] w-auto h-auto object-contain"
              onError={(e) => {
                // Hide the image container if logo fails to load
                (e.target as HTMLImageElement).parentElement!.style.display = 'none';
              }}
            />
          </div>
          {allImages.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {allImages.slice(0, 4).map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                    idx === selectedImageIndex
                      ? "border-primary"
                      : "border-transparent hover:border-muted-foreground/50"
                  }`}
                >
                  <img
                    src={img}
                    alt={`${data.title} ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* App Ratings */}
      {data.appRatings && data.appRatings.length > 0 && (
        <div className="grid grid-cols-3 gap-2 text-center">
          {data.appRatings.map((rating, idx) => (
            <button
              key={idx}
              onClick={() => rating.url && onNavigate(rating.url)}
              className="p-2 rounded-lg hover:bg-accent transition-colors"
            >
              <div className="flex items-center justify-center gap-1 text-sm font-medium">
                <Star className="h-3.5 w-3.5 fill-yellow-500 text-yellow-500" />
                {rating.rating}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                {rating.store}
              </p>
            </button>
          ))}
        </div>
      )}

      {/* Description */}
      {data.description && (
        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-4">
          {data.description}
        </p>
      )}

      {/* Company Info - Generated dynamically from company-specific fields */}
      {(data.founded || data.headquarters || data.industry || data.ceo) && (
        <div className="space-y-2 border-t border-border pt-3">
          {data.ceo && (
            <div className="flex items-start text-sm">
              <span className="text-muted-foreground w-24 flex-shrink-0">CEO</span>
              <span className="font-medium">{data.ceo}</span>
            </div>
          )}
          {data.founded && (
            <div className="flex items-start text-sm">
              <span className="text-muted-foreground w-24 flex-shrink-0">Founded</span>
              <span className="font-medium">{data.founded}</span>
            </div>
          )}
          {data.headquarters && (
            <div className="flex items-start text-sm">
              <span className="text-muted-foreground w-24 flex-shrink-0">Headquarters</span>
              <span className="font-medium">{data.headquarters}</span>
            </div>
          )}
          {data.industry && (
            <div className="flex items-start text-sm">
              <span className="text-muted-foreground w-24 flex-shrink-0">Industry</span>
              <span className="font-medium">{data.industry}</span>
            </div>
          )}
        </div>
      )}

      {/* Custom Attributes */}
      {data.attributes && data.attributes.length > 0 && (
        <div className="space-y-2 border-t border-border pt-3">
          {data.attributes.map((attr, idx) => (
            <div key={idx} className="flex items-start text-sm">
              <span className="text-muted-foreground w-24 flex-shrink-0">
                {attr.label}
              </span>
              <span className="font-medium">{attr.value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Source */}
      {data.source && (
        <div className="flex items-center gap-2 pt-2 border-t border-border">
          <span className="text-xs text-muted-foreground">Source:</span>
          {data.sourceUrl ? (
            <button
              onClick={() => onNavigate(data.sourceUrl!)}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              {data.source}
              <ExternalLink className="h-3 w-3" />
            </button>
          ) : (
            <span className="text-xs font-medium">{data.source}</span>
          )}
        </div>
      )}
    </motion.aside>
  );
};

export default KnowledgePanel;
