import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Download, Play, RotateCcw, Moon, Sun, Keyboard, Zap, Grid3X3, User, Bookmark, Star, Globe, ExternalLink, Volume2, VolumeX, Loader2, Search, ArrowRight, Settings } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

const SCENE_DURATIONS = [2000, 2500, 2500, 2500, 2500, 2500, 2500, 2500, 2500, 2500, 2000];
const TOTAL_DURATION = SCENE_DURATIONS.reduce((a, b) => a + b, 0);

const Trailer = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentScene, setCurrentScene] = useState(-1);
  const [progress, setProgress] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoadingMusic, setIsLoadingMusic] = useState(false);
  const [musicLoaded, setMusicLoaded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number>(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const getSceneForTime = useCallback((elapsed: number) => {
    let accumulated = 0;
    for (let i = 0; i < SCENE_DURATIONS.length; i++) {
      accumulated += SCENE_DURATIONS[i];
      if (elapsed < accumulated) {
        return i;
      }
    }
    return SCENE_DURATIONS.length - 1;
  }, []);

  const animate = useCallback(() => {
    const elapsed = Date.now() - startTimeRef.current;
    const newProgress = Math.min(elapsed / TOTAL_DURATION, 1);
    setProgress(newProgress);

    const newScene = getSceneForTime(elapsed);
    setCurrentScene(newScene);

    if (elapsed < TOTAL_DURATION) {
      animationFrameRef.current = requestAnimationFrame(animate);
    } else {
      setIsPlaying(false);
      setCurrentScene(-1);
      setProgress(0);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      if (isRecording) {
        stopRecording();
      }
      // Exit fullscreen when done
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(console.error);
      }
      setShowControls(true);
    }
  }, [getSceneForTime, isRecording]);

  useEffect(() => {
    if (isPlaying) {
      startTimeRef.current = Date.now();
      animationFrameRef.current = requestAnimationFrame(animate);
      // Play music if loaded and not muted
      if (audioRef.current && musicLoaded && !isMuted) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(console.error);
      }
    }
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, animate, musicLoaded, isMuted]);

  // Auto-load background music on mount
  useEffect(() => {
    const loadMusicOnMount = async () => {
      if (musicLoaded || isLoadingMusic) return;
      
      setIsLoadingMusic(true);
      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/trailer-music`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            },
            body: JSON.stringify({
              prompt: "Epic cinematic trailer music, modern tech product reveal, inspiring and powerful, electronic orchestral hybrid, building tension with triumphant finale",
              duration: 30,
            }),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to generate music");
        }

        const data = await response.json();
        const audioUrl = `data:audio/mpeg;base64,${data.audioContent}`;
        audioRef.current = new Audio(audioUrl);
        audioRef.current.loop = false;
        audioRef.current.volume = 0.5;
        setMusicLoaded(true);
        toast.success("Background music loaded!");
      } catch (error) {
        console.error("Error loading music:", error);
        // Silently fail - don't show error toast on auto-load
      } finally {
        setIsLoadingMusic(false);
      }
    };

    loadMusicOnMount();
  }, []);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const enterFullscreen = async () => {
    if (containerRef.current) {
      try {
        if (containerRef.current.requestFullscreen) {
          await containerRef.current.requestFullscreen();
        } else if ((containerRef.current as any).webkitRequestFullscreen) {
          await (containerRef.current as any).webkitRequestFullscreen();
        } else if ((containerRef.current as any).msRequestFullscreen) {
          await (containerRef.current as any).msRequestFullscreen();
        }
      } catch (error) {
        console.error("Fullscreen error:", error);
      }
    }
  };

  const startTrailer = async () => {
    setShowControls(false);
    await enterFullscreen();
    setCurrentScene(-1);
    setProgress(0);
    // Small delay to ensure fullscreen is applied
    setTimeout(() => {
      setIsPlaying(true);
    }, 100);
  };

  const startRecording = async () => {
    setIsRecording(true);
    chunksRef.current = [];
    setShowControls(false);

    // Enter fullscreen first
    await enterFullscreen();

    try {
      const stream = await (navigator.mediaDevices as any).getDisplayMedia({
        video: { mediaSource: 'screen' },
        preferCurrentTab: true
      });

      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9'
      });

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'ridel-trailer.webm';
        a.click();
        URL.revokeObjectURL(url);
        setIsRecording(false);
        stream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
        // Exit fullscreen
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(console.error);
        }
        setShowControls(true);
      };

      mediaRecorderRef.current.start();
      setCurrentScene(-1);
      setProgress(0);
      setTimeout(() => {
        setIsPlaying(true);
      }, 100);
    } catch {
      setIsRecording(false);
      setShowControls(true);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
    }
  };

  return (
    <div 
      ref={containerRef}
      className="min-h-screen bg-black flex flex-col items-center justify-center"
    >
      {/* Fullscreen trailer view */}
      <div className={`w-full h-full ${isFullscreen ? 'fixed inset-0' : 'max-w-5xl p-4 space-y-6'}`}>
        {/* Trailer Container */}
        <div 
          className={`relative bg-gradient-to-br from-black via-zinc-900 to-black overflow-hidden ${
            isFullscreen ? 'w-full h-full' : 'aspect-video rounded-xl shadow-2xl border border-zinc-800'
          }`}
        >
          <AnimatePresence mode="wait">
            {currentScene === 0 && <Scene0 key="scene0" />}
            {currentScene === 1 && <Scene1 key="scene1" />}
            {currentScene === 2 && <Scene2 key="scene2" />}
            {currentScene === 3 && <SceneQuickShortcuts key="scene3" />}
            {currentScene === 4 && <SceneGoogleApps key="scene4" />}
            {currentScene === 5 && <SceneSearchDemo key="scene5" />}
            {currentScene === 6 && <SceneAccountLogin key="scene6" />}
            {currentScene === 7 && <SceneBookmarks key="scene7" />}
            {currentScene === 8 && <Scene3 key="scene8" />}
            {currentScene === 9 && <Scene5 key="scene9" />}
            {currentScene === 10 && <Scene6 key="scene10" />}

            {/* Static state when not playing */}
            {currentScene === -1 && !isPlaying && showControls && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <div className="text-center">
                  <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
                    <span className="text-5xl font-bold text-white">R</span>
                  </div>
                  <h1 className="text-4xl font-bold text-white mb-2">RIDEL</h1>
                  <p className="text-zinc-400 mb-2">Click Play to watch the trailer</p>
                  {isLoadingMusic && (
                    <div className="flex items-center justify-center gap-2 text-zinc-500 text-sm">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading music...
                    </div>
                  )}
                  {musicLoaded && (
                    <div className="flex items-center justify-center gap-2 text-green-500 text-sm">
                      <Volume2 className="h-4 w-4" />
                      Music ready
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Mute button - only show during playback */}
          {isPlaying && musicLoaded && (
            <button
              onClick={toggleMute}
              className="absolute top-4 right-4 z-10 p-2 bg-zinc-800/80 rounded-full hover:bg-zinc-700/80 transition-colors"
            >
              {isMuted ? (
                <VolumeX className="h-5 w-5 text-white" />
              ) : (
                <Volume2 className="h-5 w-5 text-white" />
              )}
            </button>
          )}

          {/* Progress bar - slim and at very bottom */}
          {isPlaying && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-800/50">
              <motion.div
                style={{ width: `${progress * 100}%` }}
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
              />
            </div>
          )}
        </div>

        {/* Controls - only show when not in fullscreen/playing */}
        {showControls && !isFullscreen && (
          <div className="flex justify-center gap-4 flex-wrap">
            <Button
              onClick={startTrailer}
              disabled={isPlaying}
              variant="outline"
              size="lg"
              className="gap-2"
            >
              {isPlaying ? <RotateCcw className="h-5 w-5 animate-spin" /> : <Play className="h-5 w-5" />}
              {isPlaying ? "Playing..." : "Play Fullscreen"}
            </Button>
            
            <Button
              onClick={startRecording}
              disabled={isPlaying || isRecording}
              size="lg"
              className="gap-2"
            >
              <Download className="h-5 w-5" />
              {isRecording ? "Recording..." : "Record & Download"}
            </Button>
          </div>
        )}

        {showControls && !isFullscreen && (
          <p className="text-center text-sm text-muted-foreground">
            {isLoadingMusic ? "Loading background music..." : musicLoaded ? "Music loaded - plays in fullscreen" : "Trailer will play in fullscreen"}
          </p>
        )}
      </div>
    </div>
  );
};

// Scene 0: Logo Intro
const Scene0 = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="absolute inset-0 flex items-center justify-center"
  >
    <div className="relative">
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ duration: 0.8, type: "spring" }}
        className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center"
      >
        <span className="text-6xl font-bold text-white">R</span>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="absolute -bottom-16 left-1/2 -translate-x-1/2 whitespace-nowrap"
      >
        <span className="text-4xl font-bold text-white tracking-wider">RIDEL</span>
      </motion.div>
    </div>
    {[...Array(20)].map((_, i) => (
      <motion.div
        key={i}
        initial={{ opacity: 0, x: "50%", y: "50%", scale: 0 }}
        animate={{ 
          opacity: [0, 1, 0],
          x: `${Math.random() * 100}%`,
          y: `${Math.random() * 100}%`,
          scale: [0, 1, 0]
        }}
        transition={{ duration: 2, delay: Math.random() * 0.5, ease: "easeOut" }}
        className="absolute w-2 h-2 bg-blue-400 rounded-full"
      />
    ))}
  </motion.div>
);

// Scene 1: Search Bar Animation
const Scene1 = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="absolute inset-0 flex flex-col items-center justify-center px-12"
  >
    <motion.p
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-zinc-400 text-lg mb-4"
    >
      Search the web with elegance
    </motion.p>
    <motion.div
      initial={{ scaleX: 0 }}
      animate={{ scaleX: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="w-full max-w-2xl bg-zinc-800/50 backdrop-blur border border-zinc-700 rounded-full p-4 flex items-center gap-4"
    >
      <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-500" />
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-white text-xl"
      >
        <TypewriterText text="How to build amazing apps..." />
      </motion.span>
    </motion.div>
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.5 }}
      className="mt-8 flex gap-4"
    >
      {["Web", "Images", "Videos", "News"].map((tab, i) => (
        <motion.div
          key={tab}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.5 + i * 0.1 }}
          className={`px-4 py-2 rounded-full text-sm ${i === 0 ? 'bg-blue-500 text-white' : 'bg-zinc-800 text-zinc-400'}`}
        >
          {tab}
        </motion.div>
      ))}
    </motion.div>
  </motion.div>
);

// Scene 2: AI Features
const Scene2 = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="absolute inset-0 flex items-center justify-center"
  >
    <div className="text-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", duration: 0.8 }}
        className="mb-6"
      >
        <div className="w-24 h-24 mx-auto bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 rounded-full flex items-center justify-center">
          <motion.span
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="text-4xl"
          >
            ✨
          </motion.span>
        </div>
      </motion.div>
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-4xl font-bold text-white mb-4"
      >
        AI-Powered Search
      </motion.h2>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="text-zinc-400 text-xl"
      >
        Intelligent results, instant answers
      </motion.p>
      {["Smart Summaries", "Image Search", "Video Discovery"].map((feature, i) => (
        <motion.div
          key={feature}
          initial={{ opacity: 0, x: i % 2 === 0 ? -50 : 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1 + i * 0.2 }}
          className="inline-block mx-2 mt-6 px-4 py-2 bg-zinc-800/80 border border-zinc-700 rounded-lg text-zinc-300"
        >
          {feature}
        </motion.div>
      ))}
    </div>
  </motion.div>
);

// Scene: Quick Shortcuts
const SceneQuickShortcuts = () => {
  const shortcuts = [
    { name: "YouTube", color: "from-red-500 to-red-600", icon: "▶" },
    { name: "GitHub", color: "from-gray-600 to-gray-800", icon: "◉" },
    { name: "Twitter", color: "from-blue-400 to-blue-500", icon: "𝕏" },
    { name: "Reddit", color: "from-orange-500 to-orange-600", icon: "◎" },
    { name: "Gmail", color: "from-red-400 to-yellow-500", icon: "✉" },
    { name: "Drive", color: "from-green-500 to-blue-500", icon: "△" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 flex items-center justify-center"
    >
      <div className="text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring" }}
          className="mb-6"
        >
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center">
            <ExternalLink className="h-10 w-10 text-white" />
          </div>
        </motion.div>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-3xl font-bold text-white mb-6"
        >
          Quick Shortcuts
        </motion.h2>
        <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
          {shortcuts.map((shortcut, i) => (
            <motion.div
              key={shortcut.name}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 + i * 0.1, type: "spring" }}
              whileHover={{ scale: 1.1 }}
              className="flex flex-col items-center"
            >
              <div className={`w-14 h-14 bg-gradient-to-br ${shortcut.color} rounded-xl flex items-center justify-center mb-2 shadow-lg`}>
                <span className="text-white text-xl">{shortcut.icon}</span>
              </div>
              <span className="text-zinc-400 text-xs">{shortcut.name}</span>
            </motion.div>
          ))}
        </div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="text-zinc-500 mt-6 text-sm"
        >
          One-click access to your favorites
        </motion.p>
      </div>
    </motion.div>
  );
};

// Scene: Google Apps Grid
const SceneGoogleApps = () => {
  const apps = [
    { name: "Search", color: "bg-blue-500" },
    { name: "Gmail", color: "bg-red-500" },
    { name: "Drive", color: "bg-yellow-500" },
    { name: "Maps", color: "bg-green-500" },
    { name: "YouTube", color: "bg-red-600" },
    { name: "Photos", color: "bg-amber-500" },
    { name: "Docs", color: "bg-blue-600" },
    { name: "Meet", color: "bg-green-600" },
    { name: "Calendar", color: "bg-blue-400" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 flex items-center justify-center"
    >
      <div className="text-center">
        <motion.div
          initial={{ scale: 0, rotate: -90 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", duration: 0.8 }}
          className="mb-6"
        >
          <div className="w-20 h-20 mx-auto bg-zinc-800 rounded-2xl flex items-center justify-center border border-zinc-700">
            <Grid3X3 className="h-10 w-10 text-white" />
          </div>
        </motion.div>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-3xl font-bold text-white mb-6"
        >
          Google Apps Integration
        </motion.h2>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-zinc-800/80 border border-zinc-700 rounded-2xl p-4 inline-block"
        >
          <div className="grid grid-cols-3 gap-3">
            {apps.map((app, i) => (
              <motion.div
                key={app.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + i * 0.05 }}
                className="flex flex-col items-center p-2"
              >
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ delay: 1 + i * 0.1, duration: 0.3 }}
                  className={`w-10 h-10 ${app.color} rounded-lg mb-1 shadow-lg`}
                />
                <span className="text-zinc-400 text-xs">{app.name}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="text-zinc-500 mt-4 text-sm"
        >
          All your Google apps in one place
        </motion.p>
      </div>
    </motion.div>
  );
};

// Scene: Search Demo - Live search experience
const SceneSearchDemo = () => {
  const searchResults = [
    { title: "React Documentation - Getting Started", url: "react.dev/learn", snippet: "Learn React with the official documentation..." },
    { title: "Building Modern Web Applications", url: "medium.com/web-dev", snippet: "A complete guide to modern web development..." },
    { title: "TypeScript Best Practices 2024", url: "typescript-tips.com", snippet: "Essential tips for writing clean TypeScript..." },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 bg-zinc-950"
    >
      {/* Top bar */}
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full bg-zinc-900 border-b border-zinc-800 px-6 py-3"
      >
        <div className="flex items-center gap-4 max-w-4xl mx-auto">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
            className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center"
          >
            <span className="text-white font-bold text-sm">R</span>
          </motion.div>
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="flex-1 bg-zinc-800 border border-zinc-700 rounded-full px-4 py-2 flex items-center gap-3"
          >
            <Search className="h-4 w-4 text-zinc-400" />
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-white text-sm"
            >
              <TypewriterText text="best web development frameworks" />
            </motion.span>
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex items-center gap-2"
          >
            <div className="w-8 h-8 bg-zinc-800 rounded-full flex items-center justify-center">
              <Settings className="h-4 w-4 text-zinc-400" />
            </div>
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-white" />
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Search tabs */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="w-full border-b border-zinc-800 px-6"
      >
        <div className="max-w-4xl mx-auto flex gap-6 py-2">
          {["All", "Images", "Videos", "News", "Maps"].map((tab, i) => (
            <motion.span
              key={tab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 + i * 0.05 }}
              className={`text-sm py-2 ${i === 0 ? 'text-blue-400 border-b-2 border-blue-400' : 'text-zinc-400'}`}
            >
              {tab}
            </motion.span>
          ))}
        </div>
      </motion.div>

      {/* Results */}
      <div className="max-w-4xl mx-auto px-6 py-6 space-y-6">
        {searchResults.map((result, i) => (
          <motion.div
            key={result.title}
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1 + i * 0.2 }}
            className="group"
          >
            <motion.div
              whileHover={{ x: 5 }}
              className="space-y-1"
            >
              <div className="flex items-center gap-2 text-zinc-500 text-xs">
                <Globe className="h-3 w-3" />
                {result.url}
              </div>
              <h3 className="text-blue-400 text-lg font-medium group-hover:underline flex items-center gap-2">
                {result.title}
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.5 + i * 0.2 }}
                >
                  <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </motion.span>
              </h3>
              <p className="text-zinc-400 text-sm">{result.snippet}</p>
            </motion.div>
          </motion.div>
        ))}
        
        {/* AI Summary bubble */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 1.8 }}
          className="mt-8 bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/30 rounded-xl p-4"
        >
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center shrink-0">
              <span className="text-sm">✨</span>
            </div>
            <div>
              <h4 className="text-white font-medium mb-1">AI Summary</h4>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2 }}
                className="text-zinc-400 text-sm"
              >
                Based on your search, React, Vue, and Svelte are the top frameworks for web development in 2024...
              </motion.p>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

// Scene: Account Login
const SceneAccountLogin = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="absolute inset-0 flex items-center justify-center"
  >
    <div className="text-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring" }}
        className="mb-6"
      >
        <div className="w-20 h-20 mx-auto bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
          <User className="h-10 w-10 text-white" />
        </div>
      </motion.div>
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-3xl font-bold text-white mb-6"
      >
        Personalized Experience
      </motion.h2>
      
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-zinc-800/80 border border-zinc-700 rounded-2xl p-6 max-w-xs mx-auto"
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="space-y-4"
        >
          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
            <span className="text-2xl font-bold text-white">JD</span>
          </div>
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.9 }}
            className="h-10 bg-zinc-700 rounded-lg"
          />
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 1 }}
            className="h-10 bg-zinc-700 rounded-lg"
          />
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center"
          >
            <span className="text-white font-medium">Sign In</span>
          </motion.div>
        </motion.div>
      </motion.div>
      
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="text-zinc-500 mt-4 text-sm"
      >
        Sync your preferences across devices
      </motion.p>
    </div>
  </motion.div>
);

// Scene: Bookmarks
const SceneBookmarks = () => {
  const bookmarks = [
    { title: "React Documentation", url: "react.dev", icon: "⚛️" },
    { title: "Stack Overflow", url: "stackoverflow.com", icon: "📚" },
    { title: "GitHub Trending", url: "github.com/trending", icon: "🔥" },
    { title: "MDN Web Docs", url: "developer.mozilla.org", icon: "📖" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 flex items-center justify-center"
    >
      <div className="text-center w-full max-w-lg px-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring" }}
          className="mb-6 flex justify-center gap-4"
        >
          <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center">
            <Bookmark className="h-8 w-8 text-white" />
          </div>
          <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-rose-500 rounded-2xl flex items-center justify-center">
            <Star className="h-8 w-8 text-white" />
          </div>
        </motion.div>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-3xl font-bold text-white mb-6"
        >
          Bookmarks & Favorites
        </motion.h2>
        
        <div className="space-y-3">
          {bookmarks.map((bookmark, i) => (
            <motion.div
              key={bookmark.title}
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + i * 0.15 }}
              className="bg-zinc-800/80 border border-zinc-700 rounded-xl p-3 flex items-center gap-3"
            >
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ delay: 1 + i * 0.2, duration: 0.5 }}
                className="w-10 h-10 bg-zinc-700 rounded-lg flex items-center justify-center text-xl"
              >
                {bookmark.icon}
              </motion.div>
              <div className="text-left flex-1">
                <div className="text-white font-medium">{bookmark.title}</div>
                <div className="text-zinc-500 text-sm flex items-center gap-1">
                  <Globe className="h-3 w-3" />
                  {bookmark.url}
                </div>
              </div>
              <Star className="h-5 w-5 text-yellow-500" />
            </motion.div>
          ))}
        </div>
        
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="text-zinc-500 mt-4 text-sm"
        >
          Save and organize your favorite sites
        </motion.p>
      </div>
    </motion.div>
  );
};

// Scene 3: Dark Mode Toggle
const Scene3 = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="absolute inset-0 flex items-center justify-center"
  >
    <div className="text-center">
      <motion.h2
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold text-white mb-8"
      >
        Beautiful in Any Light
      </motion.h2>
      <div className="flex items-center justify-center gap-8">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="relative"
        >
          <div className="w-48 h-32 bg-white rounded-lg shadow-xl p-4 flex flex-col items-center justify-center">
            <Sun className="h-8 w-8 text-yellow-500 mb-2" />
            <div className="w-24 h-3 bg-gray-200 rounded-full" />
            <div className="w-16 h-2 bg-gray-100 rounded-full mt-2" />
          </div>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.8 }}
            className="absolute -bottom-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center"
          >
            <Sun className="h-4 w-4 text-white" />
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: [0, 1.2, 1] }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="w-16 h-8 bg-zinc-700 rounded-full p-1 relative"
        >
          <motion.div
            animate={{ x: [0, 24, 0] }}
            transition={{ delay: 1, duration: 1.5, repeat: Infinity, repeatDelay: 1 }}
            className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="relative"
        >
          <div className="w-48 h-32 bg-zinc-900 rounded-lg shadow-xl p-4 flex flex-col items-center justify-center border border-zinc-700">
            <Moon className="h-8 w-8 text-purple-400 mb-2" />
            <div className="w-24 h-3 bg-zinc-700 rounded-full" />
            <div className="w-16 h-2 bg-zinc-800 rounded-full mt-2" />
          </div>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.8 }}
            className="absolute -bottom-2 -right-2 w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center"
          >
            <Moon className="h-4 w-4 text-white" />
          </motion.div>
        </motion.div>
      </div>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="text-zinc-400 mt-8"
      >
        Seamless theme switching
      </motion.p>
    </div>
  </motion.div>
);

// Scene 5: Speed Demo
const Scene5 = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="absolute inset-0 flex items-center justify-center overflow-hidden"
  >
    {[...Array(30)].map((_, i) => (
      <motion.div
        key={i}
        initial={{ x: "100%", opacity: 0 }}
        animate={{ x: "-100%", opacity: [0, 1, 1, 0] }}
        transition={{ duration: 0.8, delay: i * 0.05, ease: "easeOut" }}
        className="absolute h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent"
        style={{ width: `${Math.random() * 200 + 100}px`, top: `${Math.random() * 100}%` }}
      />
    ))}
    <motion.div
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.5, type: "spring" }}
      className="text-center z-10"
    >
      <Zap className="h-16 w-16 text-yellow-400 mx-auto mb-4" />
      <span className="text-8xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
        FAST
      </span>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="text-zinc-400 text-xl mt-4"
      >
        Results in milliseconds
      </motion.p>
    </motion.div>
  </motion.div>
);

// Scene 6: Final CTA
const Scene6 = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-pink-900/20"
  >
    <div className="text-center">
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", duration: 0.8 }}
      >
        <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
          <span className="text-4xl font-bold text-white">R</span>
        </div>
      </motion.div>
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-5xl font-bold text-white mb-4"
      >
        RIDEL
      </motion.h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="text-2xl text-zinc-300 mb-8"
      >
        Search Reimagined
      </motion.p>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1 }}
        className="inline-block px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full text-white font-semibold text-lg"
      >
        Try It Now
      </motion.div>
    </div>
  </motion.div>
);

// Typewriter effect component
const TypewriterText = ({ text }: { text: string }) => {
  const [displayText, setDisplayText] = useState("");

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      if (index <= text.length) {
        setDisplayText(text.slice(0, index));
        index++;
      } else {
        clearInterval(interval);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [text]);

  return (
    <>
      {displayText}
      <motion.span
        animate={{ opacity: [1, 0] }}
        transition={{ duration: 0.5, repeat: Infinity }}
      >
        |
      </motion.span>
    </>
  );
};

export default Trailer;
