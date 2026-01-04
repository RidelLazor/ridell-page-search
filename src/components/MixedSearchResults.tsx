import { Loader2, Bookmark, BookmarkCheck, ExternalLink, Image as ImageIcon, Play, Video } from "lucide-react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { useState } from "react";
import { ResultContextMenu } from "./ResultContextMenu";

interface SearchResult {
  title: string;
  url: string;
  description: string;
}

interface ImageResult {
  title: string;
  url: string;
  thumbnail: string;
  source: string;
}

interface VideoResult {
  title: string;
  url: string;
  thumbnail: string;
  duration: string;
  source: string;
  embedUrl: string | null;
}

interface BookmarkItem {
  id: string;
  title: string;
  url: string;
}

interface MixedResult {
  type: "web" | "image" | "video";
  data: SearchResult | ImageResult | VideoResult;
}

interface MixedSearchResultsProps {
  webResults: SearchResult[];
  imageResults: ImageResult[];
  videoResults?: VideoResult[];
  loading: boolean;
  error: string | null;
  onResultClick: (url: string) => void;
}

const MixedSearchResults = ({ webResults, imageResults, videoResults = [], loading, error, onResultClick }: MixedSearchResultsProps) => {
  const [bookmarks, setBookmarks] = useLocalStorage<BookmarkItem[]>("ridel-bookmarks", []);
  const [selectedImage, setSelectedImage] = useState<ImageResult | null>(null);
  const [playingVideo, setPlayingVideo] = useState<VideoResult | null>(null);
  const { toast } = useToast();

  const isBookmarked = (url: string) => {
    return bookmarks.some((b) => b.url === url);
  };

  const toggleBookmark = (result: SearchResult | ImageResult, e: React.MouseEvent) => {
    e.stopPropagation();
    const url = 'source' in result ? result.source : result.url;
    const title = result.title;
    
    if (isBookmarked(url)) {
      setBookmarks((prev) => prev.filter((b) => b.url !== url));
      toast({
        title: "Bookmark removed",
        description: title,
      });
    } else {
      const newBookmark: BookmarkItem = {
        id: Date.now().toString(),
        title: title,
        url: url,
      };
      setBookmarks((prev) => [newBookmark, ...prev]);
      toast({
        title: "Bookmarked",
        description: title,
      });
    }
  };

  // Mix web, image, and video results
  const mixResults = (): MixedResult[] => {
    const mixed: MixedResult[] = [];
    const maxImages = Math.min(imageResults.length, 6);
    const maxVideos = Math.min(videoResults.length, 4);
    
    // Add first 2 web results
    webResults.slice(0, 2).forEach(r => mixed.push({ type: "web", data: r }));
    
    // Add video gallery section if we have videos
    if (maxVideos > 0) {
      videoResults.slice(0, maxVideos).forEach(r => mixed.push({ type: "video", data: r }));
    }
    
    // Add next 2 web results
    webResults.slice(2, 4).forEach(r => mixed.push({ type: "web", data: r }));
    
    // Add image gallery section if we have images
    if (maxImages > 0) {
      imageResults.slice(0, maxImages).forEach(r => mixed.push({ type: "image", data: r }));
    }
    
    // Add remaining web results
    webResults.slice(4).forEach(r => mixed.push({ type: "web", data: r }));
    
    return mixed;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">Searching...</span>
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

  if (webResults.length === 0 && imageResults.length === 0 && videoResults.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-muted-foreground">No results found. Try a different search.</p>
      </div>
    );
  }

  const mixedResults = mixResults();
  let imageGroupRendered = false;
  let videoGroupRendered = false;

  return (
    <div className="space-y-4 py-4">
      {mixedResults.map((result, index) => {
        // Render video group
        if (result.type === "video" && !videoGroupRendered) {
          videoGroupRendered = true;
          const videos = mixedResults
            .filter(r => r.type === "video")
            .map(r => r.data as VideoResult);
          
          return (
            <motion.div
              key={`video-group-${index}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="mb-6"
            >
              <div className="flex items-center gap-2 mb-3">
                <Video className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">Videos</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {videos.map((video, vidIndex) => (
                  <ResultContextMenu
                    key={vidIndex}
                    type="link"
                    url={video.url}
                    title={video.title}
                    onNavigate={onResultClick}
                  >
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: vidIndex * 0.05 }}
                      whileHover={{ scale: 1.02 }}
                      className="relative group cursor-pointer rounded-lg overflow-hidden bg-muted"
                      onClick={() => setPlayingVideo(video)}
                    >
                      <div className="aspect-video relative">
                        <img
                          src={video.thumbnail}
                          alt={video.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors">
                          <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center shadow-lg">
                            <Play className="h-6 w-6 text-white ml-1" fill="white" />
                          </div>
                        </div>
                        {video.duration && (
                          <span className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded">
                            {video.duration}
                          </span>
                        )}
                      </div>
                      <div className="p-2">
                        <p className="text-sm font-medium line-clamp-2">{video.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">{video.source}</p>
                      </div>
                    </motion.div>
                  </ResultContextMenu>
                ))}
              </div>
            </motion.div>
          );
        }

        // Skip individual videos (they're rendered as a group)
        if (result.type === "video") return null;

        // Render image group
        if (result.type === "image" && !imageGroupRendered) {
          imageGroupRendered = true;
          const images = mixedResults
            .filter(r => r.type === "image")
            .map(r => r.data as ImageResult);
          
          return (
            <motion.div
              key={`image-group-${index}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="mb-6"
            >
              <div className="flex items-center gap-2 mb-3">
                <ImageIcon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">Images</span>
              </div>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                {images.map((img, imgIndex) => (
                  <ResultContextMenu
                    key={imgIndex}
                    type="image"
                    url={img.source}
                    imageUrl={img.thumbnail}
                    title={img.title}
                    onNavigate={onResultClick}
                  >
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: imgIndex * 0.05 }}
                      whileHover={{ scale: 1.05, zIndex: 10 }}
                      className="relative group cursor-pointer rounded-lg overflow-hidden aspect-square bg-muted"
                      onClick={() => setSelectedImage(img)}
                    >
                      <img
                        src={img.thumbnail}
                        alt={img.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="absolute bottom-0 left-0 right-0 p-2">
                          <p className="text-white text-xs truncate">{img.title}</p>
                        </div>
                      </div>
                    </motion.div>
                  </ResultContextMenu>
                ))}
              </div>
            </motion.div>
          );
        }

        // Skip individual images (they're rendered as a group)
        if (result.type === "image") return null;

        // Render web result
        const webResult = result.data as SearchResult;
        return (
          <ResultContextMenu
            key={`web-${index}`}
            type="link"
            url={webResult.url}
            title={webResult.title}
            onNavigate={onResultClick}
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              className="max-w-2xl group"
            >
              <div className="flex items-start gap-3">
                <button
                  onClick={() => onResultClick(webResult.url)}
                  className="text-left flex-1"
                >
                  <p className="text-sm text-muted-foreground truncate mb-1 flex items-center gap-1">
                    <ExternalLink className="h-3 w-3" />
                    {webResult.url}
                  </p>
                  <h3 className="text-xl text-blue-600 dark:text-blue-400 group-hover:underline font-normal mb-1">
                    {webResult.title}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {webResult.description}
                  </p>
                </button>
                <motion.button
                  onClick={(e) => toggleBookmark(webResult, e)}
                  className={`p-2 rounded-full transition-all ${
                    isBookmarked(webResult.url)
                      ? "text-yellow-500 hover:bg-yellow-500/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  }`}
                  title={isBookmarked(webResult.url) ? "Remove bookmark" : "Add bookmark"}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  {isBookmarked(webResult.url) ? (
                    <BookmarkCheck className="h-5 w-5" />
                  ) : (
                    <Bookmark className="h-5 w-5" />
                  )}
                </motion.button>
              </div>
            </motion.div>
          </ResultContextMenu>
        );
      })}

      {/* Image Preview Modal */}
      {selectedImage && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setSelectedImage(null)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative max-w-4xl max-h-[90vh] m-4"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={selectedImage.url || selectedImage.thumbnail}
              alt={selectedImage.title}
              className="max-w-full max-h-[80vh] object-contain rounded-lg"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 rounded-b-lg">
              <h3 className="text-white font-medium truncate">{selectedImage.title}</h3>
              <a
                href={selectedImage.source}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 text-sm hover:underline"
              >
                View source
              </a>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Video Player Modal */}
      {playingVideo && playingVideo.embedUrl && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
          onClick={() => setPlayingVideo(null)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative w-full max-w-4xl aspect-video m-4"
            onClick={(e) => e.stopPropagation()}
          >
            <iframe
              src={`${playingVideo.embedUrl}?autoplay=1`}
              title={playingVideo.title}
              className="w-full h-full rounded-lg"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
            <button
              onClick={() => setPlayingVideo(null)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300 transition-colors"
            >
              <span className="text-lg">✕ Close</span>
            </button>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default MixedSearchResults;