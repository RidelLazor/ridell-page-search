import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { ExternalLink, Download, Copy, Bookmark, Share2, Image as ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocalStorage } from "@/hooks/useLocalStorage";

interface BookmarkItem {
  id: string;
  title: string;
  url: string;
}

interface ResultContextMenuProps {
  children: React.ReactNode;
  type: "link" | "image";
  url: string;
  imageUrl?: string;
  title: string;
  onNavigate: (url: string) => void;
}

export const ResultContextMenu = ({
  children,
  type,
  url,
  imageUrl,
  title,
  onNavigate,
}: ResultContextMenuProps) => {
  const { toast } = useToast();
  const [bookmarks, setBookmarks] = useLocalStorage<BookmarkItem[]>("ridel-bookmarks", []);

  const isBookmarked = bookmarks.some((b) => b.url === url);

  const handleOpenNewTab = () => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast({
        title: "Link copied",
        description: "URL copied to clipboard",
      });
    } catch {
      toast({
        title: "Failed to copy",
        description: "Could not copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleCopyImage = async () => {
    if (!imageUrl) return;
    try {
      await navigator.clipboard.writeText(imageUrl);
      toast({
        title: "Image URL copied",
        description: "Image URL copied to clipboard",
      });
    } catch {
      toast({
        title: "Failed to copy",
        description: "Could not copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleDownloadImage = async () => {
    if (!imageUrl) return;
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `image-${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
      toast({
        title: "Downloading",
        description: "Image download started",
      });
    } catch {
      // Fallback: open in new tab for manual download
      window.open(imageUrl, "_blank");
      toast({
        title: "Opening image",
        description: "Right-click to save the image",
      });
    }
  };

  const handleBookmark = () => {
    if (isBookmarked) {
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

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          url: url,
        });
      } catch {
        // User cancelled or share failed
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-56">
        <ContextMenuItem onClick={() => onNavigate(url)}>
          <ExternalLink className="mr-2 h-4 w-4" />
          Open Link
        </ContextMenuItem>
        <ContextMenuItem onClick={handleOpenNewTab}>
          <ExternalLink className="mr-2 h-4 w-4" />
          Open in New Tab
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={handleCopyLink}>
          <Copy className="mr-2 h-4 w-4" />
          Copy Link
        </ContextMenuItem>
        {type === "image" && imageUrl && (
          <>
            <ContextMenuItem onClick={handleCopyImage}>
              <ImageIcon className="mr-2 h-4 w-4" />
              Copy Image URL
            </ContextMenuItem>
            <ContextMenuItem onClick={handleDownloadImage}>
              <Download className="mr-2 h-4 w-4" />
              Download Image
            </ContextMenuItem>
          </>
        )}
        <ContextMenuSeparator />
        <ContextMenuItem onClick={handleBookmark}>
          <Bookmark className="mr-2 h-4 w-4" />
          {isBookmarked ? "Remove Bookmark" : "Add Bookmark"}
        </ContextMenuItem>
        <ContextMenuItem onClick={handleShare}>
          <Share2 className="mr-2 h-4 w-4" />
          Share
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};