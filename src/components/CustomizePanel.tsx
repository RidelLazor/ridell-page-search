import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Palette, Sun, Moon, Monitor, Image, Sparkles, X, Check, Type, Link2 } from "lucide-react";
import { useTheme } from "next-themes";
import { Input } from "@/components/ui/input";
import { useLocalStorage } from "@/hooks/useLocalStorage";

const accentColors = [
  { name: "Blue", value: "222.2 47.4% 11.2%", light: "222.2 47.4% 11.2%", dark: "210 40% 98%" },
  { name: "Rose", value: "346.8 77.2% 49.8%", light: "346.8 77.2% 49.8%", dark: "346.8 77.2% 70%" },
  { name: "Orange", value: "24.6 95% 53.1%", light: "24.6 95% 53.1%", dark: "20.5 90.2% 70%" },
  { name: "Green", value: "142.1 76.2% 36.3%", light: "142.1 76.2% 36.3%", dark: "142.1 70.6% 60%" },
  { name: "Purple", value: "262.1 83.3% 57.8%", light: "262.1 83.3% 57.8%", dark: "262.1 83.3% 70%" },
  { name: "Cyan", value: "189.5 94.5% 42.7%", light: "189.5 94.5% 42.7%", dark: "186 94% 60%" },
];

const fontOptions = [
  { name: "Inter", value: "inter", preview: "Modern & Clean" },
  { name: "Space Grotesk", value: "space", preview: "Geometric" },
  { name: "Poppins", value: "poppins", preview: "Friendly" },
  { name: "JetBrains Mono", value: "mono", preview: "Technical" },
  { name: "Outfit", value: "outfit", preview: "Contemporary" },
  { name: "Sora", value: "sora", preview: "Elegant" },
];

const backgroundOptions = [
  { name: "Default", value: "default", preview: "bg-background", animated: false },
  { name: "Gradient", value: "gradient", preview: "bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950", animated: false },
  { name: "Mesh", value: "mesh", preview: "bg-gradient-to-br from-rose-100 via-violet-100 to-teal-100 dark:from-rose-950 dark:via-violet-950 dark:to-teal-950", animated: false },
  { name: "Dots", value: "dots", preview: "bg-background", animated: false },
  { name: "Aurora", value: "aurora", preview: "bg-gradient-to-br from-purple-100 via-blue-100 to-green-100 dark:from-purple-950 dark:via-blue-950 dark:to-green-950", animated: true },
  { name: "Sunset", value: "sunset", preview: "bg-gradient-to-br from-orange-100 via-pink-100 to-purple-100 dark:from-orange-950 dark:via-pink-950 dark:to-purple-950", animated: true },
  { name: "Ocean", value: "ocean", preview: "bg-gradient-to-br from-cyan-100 via-blue-100 to-teal-100 dark:from-cyan-950 dark:via-blue-950 dark:to-teal-950", animated: true },
  { name: "Custom Image", value: "custom-image", preview: "bg-muted", animated: false },
];

interface CustomizePanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CustomizePanel = ({ isOpen, onClose }: CustomizePanelProps) => {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [accentColor, setAccentColor] = useLocalStorage("ridel-accent-color", accentColors[0]);
  const [background, setBackground] = useLocalStorage("ridel-background", "default");
  const [fontFamily, setFontFamily] = useLocalStorage("ridel-font", "inter");
  const [customImageUrl, setCustomImageUrl] = useLocalStorage("ridel-custom-bg-url", "");
  const [imageUrlInput, setImageUrlInput] = useState(customImageUrl);

  // Ensure component is mounted before accessing theme
  useEffect(() => {
    setMounted(true);
  }, []);

  // Apply accent color to CSS variables
  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    const isDark = resolvedTheme === "dark";
    
    root.style.setProperty("--primary", isDark ? accentColor.dark : accentColor.light);
    root.style.setProperty("--ring", isDark ? accentColor.dark : accentColor.light);
  }, [accentColor, resolvedTheme, mounted]);

  // Apply font family
  useEffect(() => {
    const body = document.body;
    // Remove all font classes
    fontOptions.forEach(font => {
      body.classList.remove(`font-${font.value}`);
    });
    // Add selected font class
    body.classList.add(`font-${fontFamily}`);
  }, [fontFamily]);

  // Apply background style
  useEffect(() => {
    const body = document.body;
    // Remove all background classes
    backgroundOptions.forEach(bg => {
      body.classList.remove(`bg-${bg.value}`);
    });
    
    if (background !== "default") {
      body.classList.add(`bg-${background}`);
    }

    // Apply custom image if selected
    if (background === "custom-image" && customImageUrl) {
      body.style.backgroundImage = `url(${customImageUrl})`;
    } else {
      body.style.backgroundImage = "";
    }
  }, [background, customImageUrl]);

  const handleSetCustomImage = () => {
    if (imageUrlInput.trim()) {
      setCustomImageUrl(imageUrlInput.trim());
      setBackground("custom-image");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-20 right-4 w-80 bg-card border border-border rounded-2xl shadow-2xl z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Customize</h3>
              </div>
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-secondary transition-colors"
              >
                <X className="h-4 w-4" />
              </motion.button>
            </div>

            <div className="p-4 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Theme Section */}
              <div>
                <h4 className="text-sm font-medium mb-3 text-muted-foreground">Theme</h4>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: "light", icon: Sun, label: "Light" },
                    { value: "dark", icon: Moon, label: "Dark" },
                    { value: "system", icon: Monitor, label: "System" },
                  ].map(({ value, icon: Icon, label }) => (
                    <motion.button
                      key={value}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setTheme(value)}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${
                        mounted && theme === value
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:border-primary/50 hover:bg-secondary"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="text-xs font-medium">{label}</span>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Font Section */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Type className="h-4 w-4 text-muted-foreground" />
                  <h4 className="text-sm font-medium text-muted-foreground">Font</h4>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {fontOptions.map((font) => (
                    <motion.button
                      key={font.value}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setFontFamily(font.value)}
                      className={`relative p-3 rounded-xl border text-left transition-all ${
                        fontFamily === font.value
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50 hover:bg-secondary"
                      }`}
                    >
                      <p className={`text-sm font-medium font-${font.value}`}>{font.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{font.preview}</p>
                      {fontFamily === font.value && (
                        <div className="absolute top-2 right-2">
                          <Check className="h-3 w-3 text-primary" />
                        </div>
                      )}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Accent Color Section */}
              <div>
                <h4 className="text-sm font-medium mb-3 text-muted-foreground">Accent Color</h4>
                <div className="grid grid-cols-6 gap-2">
                  {accentColors.map((color) => (
                    <motion.button
                      key={color.name}
                      whileHover={{ scale: 1.15 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setAccentColor(color)}
                      className={`relative w-10 h-10 rounded-full transition-all ${
                        accentColor.name === color.name ? "ring-2 ring-offset-2 ring-offset-background ring-primary" : ""
                      }`}
                      style={{ backgroundColor: `hsl(${color.light})` }}
                      title={color.name}
                    >
                      {accentColor.name === color.name && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute inset-0 flex items-center justify-center"
                        >
                          <Check className="h-4 w-4 text-white drop-shadow-md" />
                        </motion.div>
                      )}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Background Section */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Image className="h-4 w-4 text-muted-foreground" />
                  <h4 className="text-sm font-medium text-muted-foreground">Background</h4>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {backgroundOptions.map((bg) => (
                    <motion.button
                      key={bg.value}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setBackground(bg.value)}
                      className={`relative h-16 rounded-xl border overflow-hidden transition-all ${
                        background === bg.value
                          ? "border-primary ring-2 ring-primary/20"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <div className={`absolute inset-0 ${bg.preview}`}>
                        {bg.value === "dots" && (
                          <div
                            className="absolute inset-0 opacity-20"
                            style={{
                              backgroundImage: "radial-gradient(circle, currentColor 1px, transparent 1px)",
                              backgroundSize: "12px 12px",
                            }}
                          />
                        )}
                        {bg.value === "custom-image" && customImageUrl && (
                          <div
                            className="absolute inset-0 bg-cover bg-center"
                            style={{ backgroundImage: `url(${customImageUrl})` }}
                          />
                        )}
                      </div>
                      <div className="absolute inset-0 flex items-end p-2">
                        <span className="text-xs font-medium bg-background/80 backdrop-blur-sm px-2 py-0.5 rounded flex items-center gap-1">
                          {bg.name}
                          {bg.animated && (
                            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                          )}
                        </span>
                      </div>
                      {background === bg.value && (
                        <div className="absolute top-2 right-2">
                          <Check className="h-4 w-4 text-primary" />
                        </div>
                      )}
                    </motion.button>
                  ))}
                </div>

                {/* Custom Image URL Input */}
                {background === "custom-image" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3 space-y-2"
                  >
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="url"
                          placeholder="Paste image URL..."
                          value={imageUrlInput}
                          onChange={(e) => setImageUrlInput(e.target.value)}
                          className="pl-9 text-sm"
                        />
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleSetCustomImage}
                        className="px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium"
                      >
                        Apply
                      </motion.button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Enter a direct link to an image (e.g., from Unsplash)
                    </p>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export const CustomizeButton = ({ onClick }: { onClick: () => void }) => {
  return (
    <motion.button
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.5, type: "spring", stiffness: 300 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      className="fixed bottom-4 right-4 p-3 bg-primary text-primary-foreground rounded-full shadow-lg hover:shadow-xl transition-shadow z-40"
    >
      <Palette className="h-5 w-5" />
    </motion.button>
  );
};

export default CustomizePanel;
