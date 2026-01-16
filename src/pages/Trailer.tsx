import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Play, Pause } from "lucide-react";

const Trailer = () => {
  const [isPlaying, setIsPlaying] = useState(false);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = '/trailer.mp4';
    link.download = 'ridel-trailer.mp4';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const togglePlay = () => {
    const video = document.getElementById('trailer-video') as HTMLVideoElement;
    if (video) {
      if (isPlaying) {
        video.pause();
      } else {
        video.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-foreground">Ridel</h1>
          <p className="text-muted-foreground">Experience the future of search</p>
        </div>

        <div className="relative rounded-xl overflow-hidden shadow-2xl bg-black">
          <video
            id="trailer-video"
            className="w-full aspect-video"
            src="/trailer.mp4"
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => setIsPlaying(false)}
            controls
            playsInline
          />
        </div>

        <div className="flex justify-center gap-4">
          <Button
            onClick={togglePlay}
            variant="outline"
            size="lg"
            className="gap-2"
          >
            {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            {isPlaying ? "Pause" : "Play"}
          </Button>
          
          <Button
            onClick={handleDownload}
            size="lg"
            className="gap-2"
          >
            <Download className="h-5 w-5" />
            Download MP4
          </Button>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Click download to save the trailer to your device
        </p>
      </div>
    </div>
  );
};

export default Trailer;
