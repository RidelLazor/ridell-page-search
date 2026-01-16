import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Download, Play, RotateCcw, Moon, Sun, Keyboard, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const SCENE_DURATIONS = [2000, 2500, 2500, 2500, 2500, 2500, 2000];
const TOTAL_DURATION = SCENE_DURATIONS.reduce((a, b) => a + b, 0);

const Trailer = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentScene, setCurrentScene] = useState(-1);
  const [progress, setProgress] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number>(0);

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
      if (isRecording) {
        stopRecording();
      }
    }
  }, [getSceneForTime, isRecording]);

  useEffect(() => {
    if (isPlaying) {
      startTimeRef.current = Date.now();
      animationFrameRef.current = requestAnimationFrame(animate);
    }
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, animate]);

  // Auto-play on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsPlaying(true);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const startTrailer = () => {
    setCurrentScene(-1);
    setProgress(0);
    setIsPlaying(true);
  };

  const startRecording = async () => {
    setIsRecording(true);
    chunksRef.current = [];

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
      };

      mediaRecorderRef.current.start();
      startTrailer();
    } catch {
      setIsRecording(false);
      startTrailer();
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-5xl space-y-6">
        {/* Trailer Container */}
        <div 
          ref={containerRef}
          className="relative aspect-video bg-gradient-to-br from-black via-zinc-900 to-black rounded-xl overflow-hidden shadow-2xl border border-zinc-800"
        >
          <AnimatePresence mode="wait">
            {/* Scene 0: Logo Intro */}
            {currentScene === 0 && (
              <Scene0 key="scene0" />
            )}

            {/* Scene 1: Search Bar Animation */}
            {currentScene === 1 && (
              <Scene1 key="scene1" />
            )}

            {/* Scene 2: AI Features */}
            {currentScene === 2 && (
              <Scene2 key="scene2" />
            )}

            {/* Scene 3: Dark Mode */}
            {currentScene === 3 && (
              <Scene3 key="scene3" />
            )}

            {/* Scene 4: Keyboard Shortcuts */}
            {currentScene === 4 && (
              <Scene4 key="scene4" />
            )}

            {/* Scene 5: Speed Demo */}
            {currentScene === 5 && (
              <Scene5 key="scene5" />
            )}

            {/* Scene 6: Final CTA */}
            {currentScene === 6 && (
              <Scene6 key="scene6" />
            )}

            {/* Static state when not playing */}
            {currentScene === -1 && !isPlaying && (
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
                  <p className="text-zinc-400">Click Play to watch the trailer</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Progress bar */}
          {isPlaying && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-800">
              <motion.div
                style={{ width: `${progress * 100}%` }}
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
              />
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex justify-center gap-4">
          <Button
            onClick={startTrailer}
            disabled={isPlaying}
            variant="outline"
            size="lg"
            className="gap-2"
          >
            {isPlaying ? <RotateCcw className="h-5 w-5 animate-spin" /> : <Play className="h-5 w-5" />}
            {isPlaying ? "Playing..." : "Play Trailer"}
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

        <p className="text-center text-sm text-muted-foreground">
          Click "Record & Download" to capture the trailer as a video file
        </p>
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
    {/* Particles */}
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
        {/* Light Mode Preview */}
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

        {/* Toggle Animation */}
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

        {/* Dark Mode Preview */}
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

// Scene 4: Keyboard Shortcuts
const Scene4 = () => (
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
        <div className="w-20 h-20 mx-auto bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center">
          <Keyboard className="h-10 w-10 text-white" />
        </div>
      </motion.div>
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-3xl font-bold text-white mb-6"
      >
        Keyboard Shortcuts
      </motion.h2>
      <div className="flex flex-wrap justify-center gap-4">
        {[
          { keys: ["⌘", "K"], label: "Quick Search" },
          { keys: ["⌘", "⇧", "N"], label: "New Tab" },
          { keys: ["⌘", "/"], label: "Help" },
        ].map((shortcut, i) => (
          <motion.div
            key={shortcut.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 + i * 0.2 }}
            className="bg-zinc-800/80 border border-zinc-700 rounded-lg p-4"
          >
            <div className="flex gap-1 mb-2 justify-center">
              {shortcut.keys.map((key, j) => (
                <motion.span
                  key={j}
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ delay: 1 + i * 0.3 + j * 0.1, duration: 0.3 }}
                  className="px-2 py-1 bg-zinc-700 rounded text-white text-sm font-mono"
                >
                  {key}
                </motion.span>
              ))}
            </div>
            <span className="text-zinc-400 text-sm">{shortcut.label}</span>
          </motion.div>
        ))}
      </div>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="text-zinc-500 mt-6"
      >
        Navigate faster than ever
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
    {/* Speed lines */}
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
