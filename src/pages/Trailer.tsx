import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download, Play, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const Trailer = () => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentScene, setCurrentScene] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const scenes = [
    { id: 0, duration: 2000 },
    { id: 1, duration: 2500 },
    { id: 2, duration: 2500 },
    { id: 3, duration: 2000 },
    { id: 4, duration: 2000 },
  ];

  const totalDuration = scenes.reduce((acc, scene) => acc + scene.duration, 0);

  useEffect(() => {
    if (!isPlaying) return;

    let elapsed = 0;
    let sceneIndex = 0;

    const interval = setInterval(() => {
      elapsed += 100;
      
      let accumulated = 0;
      for (let i = 0; i < scenes.length; i++) {
        accumulated += scenes[i].duration;
        if (elapsed < accumulated) {
          sceneIndex = i;
          break;
        }
      }

      if (sceneIndex !== currentScene) {
        setCurrentScene(sceneIndex);
      }

      if (elapsed >= totalDuration) {
        setIsPlaying(false);
        setCurrentScene(0);
        if (isRecording) {
          stopRecording();
        }
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying, currentScene, isRecording]);

  const startTrailer = () => {
    setCurrentScene(0);
    setIsPlaying(true);
  };

  const startRecording = async () => {
    if (!containerRef.current) return;

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
      // Fallback: just play the trailer
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
            {currentScene === 0 && isPlaying && (
              <motion.div
                key="scene0"
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
                    initial={{ 
                      opacity: 0, 
                      x: "50%", 
                      y: "50%",
                      scale: 0
                    }}
                    animate={{ 
                      opacity: [0, 1, 0],
                      x: `${Math.random() * 100}%`,
                      y: `${Math.random() * 100}%`,
                      scale: [0, 1, 0]
                    }}
                    transition={{ 
                      duration: 2,
                      delay: Math.random() * 0.5,
                      ease: "easeOut"
                    }}
                    className="absolute w-2 h-2 bg-blue-400 rounded-full"
                  />
                ))}
              </motion.div>
            )}

            {/* Scene 1: Search Bar Animation */}
            {currentScene === 1 && isPlaying && (
              <motion.div
                key="scene1"
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
            )}

            {/* Scene 2: AI Features */}
            {currentScene === 2 && isPlaying && (
              <motion.div
                key="scene2"
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
                  {/* Floating elements */}
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
            )}

            {/* Scene 3: Speed Demo */}
            {currentScene === 3 && isPlaying && (
              <motion.div
                key="scene3"
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
                    transition={{ 
                      duration: 0.8,
                      delay: i * 0.05,
                      ease: "easeOut"
                    }}
                    className="absolute h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent"
                    style={{ 
                      width: `${Math.random() * 200 + 100}px`,
                      top: `${Math.random() * 100}%`
                    }}
                  />
                ))}
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.5, type: "spring" }}
                  className="text-center z-10"
                >
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
            )}

            {/* Scene 4: Final CTA */}
            {currentScene === 4 && isPlaying && (
              <motion.div
                key="scene4"
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
            )}

            {/* Static state when not playing */}
            {!isPlaying && (
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
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: totalDuration / 1000, ease: "linear" }}
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
              />
            </div>
          )}
        </div>

        <canvas ref={canvasRef} className="hidden" />

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
