import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { motion } from "framer-motion";

interface MobileAppsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (url: string) => void;
}

const apps = [
  { name: "Gmail", icon: "https://www.google.com/gmail/about/static-2.0/images/logo-gmail.png?fingerprint=c2eaf4aae389c3f885e97081bb197b97", url: "https://mail.google.com" },
  { name: "Drive", icon: "https://ssl.gstatic.com/images/branding/product/2x/drive_2020q4_48dp.png", url: "https://drive.google.com" },
  { name: "Maps", icon: "https://maps.gstatic.com/mapfiles/maps_lite/images/2x/maps_google_logo.png", url: "https://maps.google.com" },
  { name: "YouTube", icon: "https://www.youtube.com/s/desktop/12d6b690/img/favicon_144x144.png", url: "https://youtube.com" },
  { name: "Calendar", icon: "https://ssl.gstatic.com/calendar/images/dynamiclogo_2020q4/calendar_31_2x.png", url: "https://calendar.google.com" },
  { name: "Translate", icon: "https://ssl.gstatic.com/images/branding/product/2x/translate_2020q4_48dp.png", url: "https://translate.google.com" },
  { name: "Photos", icon: "https://ssl.gstatic.com/images/branding/product/2x/photos_2020q4_48dp.png", url: "https://photos.google.com" },
  { name: "News", icon: "https://ssl.gstatic.com/images/branding/product/2x/googlenews_2020q4_48dp.png", url: "https://news.google.com" },
];

const MobileAppsSheet = ({ isOpen, onClose, onNavigate }: MobileAppsSheetProps) => {
  const handleAppClick = (url: string) => {
    if (navigator.vibrate) {
      navigator.vibrate(30);
    }
    onNavigate(url);
    onClose();
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="rounded-t-3xl pb-safe">
        <SheetHeader className="pb-4">
          <SheetTitle className="text-center">Google Apps</SheetTitle>
        </SheetHeader>
        <div className="grid grid-cols-4 gap-4 pb-6">
          {apps.map((app, index) => (
            <motion.button
              key={app.name}
              onClick={() => handleAppClick(app.url)}
              className="flex flex-col items-center gap-2 p-3 rounded-2xl active:bg-accent transition-colors"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileTap={{ scale: 0.9 }}
            >
              <div className="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center overflow-hidden">
                <img 
                  src={app.icon} 
                  alt={app.name}
                  className="w-8 h-8 object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
              <span className="text-xs text-muted-foreground font-medium">{app.name}</span>
            </motion.button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MobileAppsSheet;
