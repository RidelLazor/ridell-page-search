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
  { name: "YouTube", icon: "https://www.gstatic.com/youtube/img/branding/favicon/favicon_144x144.png", url: "https://youtube.com" },
  { name: "Gemini", icon: "https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg", url: "https://gemini.google.com" },
  { name: "Maps", icon: "https://www.gstatic.com/images/branding/product/2x/maps_96dp.png", url: "https://maps.google.com" },
  { name: "Search", icon: "https://www.gstatic.com/images/branding/product/2x/googleg_96dp.png", url: "https://google.com" },
  { name: "Calendar", icon: "https://ssl.gstatic.com/calendar/images/dynamiclogo_2020q4/calendar_31_2x.png", url: "https://calendar.google.com" },
  { name: "News", icon: "https://lh3.googleusercontent.com/J6_coFbogxhRI9iM864BL_xGfAl8oatfqOWhq3Q0jCPkGaYZfIWAEFOFYKUN-FYMblH-", url: "https://news.google.com" },
  { name: "Photos", icon: "https://www.gstatic.com/images/branding/product/2x/photos_96dp.png", url: "https://photos.google.com" },
  { name: "Meet", icon: "https://fonts.gstatic.com/s/i/productlogos/meet_2020q4/v1/web-96dp/logo_meet_2020q4_color_2x_web_96dp.png", url: "https://meet.google.com" },
  { name: "Translate", icon: "https://www.gstatic.com/images/branding/product/2x/translate_96dp.png", url: "https://translate.google.com" },
  { name: "Vids", icon: "https://ssl.gstatic.com/docs/doclist/images/mediatype/icon_1_video_x96.png", url: "https://workspace.google.com/products/vids/" },
  { name: "Sheets", icon: "https://www.gstatic.com/images/branding/product/2x/sheets_2020q4_96dp.png", url: "https://sheets.google.com" },
  { name: "Docs", icon: "https://www.gstatic.com/images/branding/product/2x/docs_2020q4_96dp.png", url: "https://docs.google.com" },
  { name: "Drive", icon: "https://www.gstatic.com/images/branding/product/2x/drive_2020q4_96dp.png", url: "https://drive.google.com" },
  { name: "Gmail", icon: "https://www.gstatic.com/images/branding/product/2x/gmail_2020q4_96dp.png", url: "https://mail.google.com" },
  { name: "Account", icon: "https://www.gstatic.com/images/branding/product/2x/googleg_96dp.png", url: "https://myaccount.google.com" },
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
