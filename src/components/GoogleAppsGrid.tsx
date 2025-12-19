import { useState, useRef, useEffect } from "react";
import { Grid3X3 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface AppItem {
  name: string;
  icon: string;
  url: string;
  color?: string;
}

const GOOGLE_APPS: AppItem[] = [
  { name: "Account", icon: "https://www.gstatic.com/images/branding/product/1x/googleg_32dp.png", url: "https://myaccount.google.com" },
  { name: "Drive", icon: "https://ssl.gstatic.com/images/branding/product/1x/drive_2020q4_32dp.png", url: "https://drive.google.com" },
  { name: "Gmail", icon: "https://ssl.gstatic.com/ui/v1/icons/mail/rfr/gmail.ico", url: "https://mail.google.com" },
  { name: "YouTube", icon: "https://www.youtube.com/favicon.ico", url: "https://youtube.com" },
  { name: "Gemini", icon: "https://www.gstatic.com/lamda/images/gemini_favicon_f069958c85030f2d9b65.svg", url: "https://gemini.google.com" },
  { name: "Maps", icon: "https://maps.google.com/favicon.ico", url: "https://maps.google.com" },
  { name: "Search", icon: "https://www.google.com/favicon.ico", url: "https://google.com" },
  { name: "Calendar", icon: "https://ssl.gstatic.com/calendar/images/dynamiclogo_2020q4/calendar_31_2x.png", url: "https://calendar.google.com" },
  { name: "News", icon: "https://ssl.gstatic.com/news-icon/x48/news_only.png", url: "https://news.google.com" },
  { name: "Photos", icon: "https://ssl.gstatic.com/images/branding/product/1x/photos_2020q4_32dp.png", url: "https://photos.google.com" },
  { name: "Meet", icon: "https://fonts.gstatic.com/s/i/productlogos/meet_2020q4/v1/web-32dp/logo_meet_2020q4_color_2x_web_32dp.png", url: "https://meet.google.com" },
  { name: "Translate", icon: "https://ssl.gstatic.com/images/branding/product/1x/translate_32dp.png", url: "https://translate.google.com" },
];

interface GoogleAppsGridProps {
  openDirection?: "left" | "right";
}

const GoogleAppsGrid = ({ openDirection = "left" }: GoogleAppsGridProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center justify-center w-10 h-10 rounded-full hover:bg-secondary transition-colors"
        aria-label="Google apps"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
      >
        <Grid3X3 className="h-5 w-5" />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            className={`absolute top-12 w-80 bg-popover border border-border rounded-2xl shadow-xl z-50 overflow-hidden ${openDirection === "right" ? "left-0" : "right-0"}`}
            initial={{ opacity: 0, scale: 0.9, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -10 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          >
            <div className="p-4 max-h-96 overflow-y-auto">
              <div className="grid grid-cols-3 gap-2">
                {GOOGLE_APPS.map((app, index) => (
                  <motion.a
                    key={app.name}
                    href={app.url}
                    className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-secondary transition-colors"
                    onClick={() => setIsOpen(false)}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.03, duration: 0.2 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div className="w-12 h-12 flex items-center justify-center">
                      <img
                        src={app.icon}
                        alt={app.name}
                        className="w-10 h-10 object-contain"
                        onError={(e) => {
                          e.currentTarget.src = `https://ui-avatars.com/api/?name=${app.name}&background=random&size=40`;
                        }}
                      />
                    </div>
                    <span className="text-xs text-center">{app.name}</span>
                  </motion.a>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GoogleAppsGrid;
