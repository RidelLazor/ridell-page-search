import { Loader2, ExternalLink } from "lucide-react";
import { useState } from "react";

interface ImageResult {
  title: string;
  url: string;
  thumbnail: string;
  source: string;
}

interface ImageResultsProps {
  results: ImageResult[];
  loading: boolean;
  error: string | null;
}

const ImageResults = ({ results, loading, error }: ImageResultsProps) => {
  const [selectedImage, setSelectedImage] = useState<ImageResult | null>(null);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">Searching images...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8 text-center">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-muted-foreground">No images found. Try a different search.</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 py-4">
        {results.map((image, index) => (
          <div
            key={index}
            className="group relative aspect-square rounded-lg overflow-hidden bg-secondary cursor-pointer"
            onClick={() => setSelectedImage(image)}
          >
            <img
              src={image.thumbnail}
              alt={image.title}
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
              loading="lazy"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/placeholder.svg";
              }}
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors" />
            <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
              <p className="text-white text-xs truncate">{image.title}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Image Preview Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-background rounded-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={selectedImage.thumbnail}
              alt={selectedImage.title}
              className="max-w-full max-h-[70vh] object-contain"
            />
            <div className="p-4">
              <h3 className="font-medium mb-1 line-clamp-2">{selectedImage.title}</h3>
              <p className="text-sm text-muted-foreground mb-3">{selectedImage.source}</p>
              <a
                href={selectedImage.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
              >
                Visit page <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ImageResults;
