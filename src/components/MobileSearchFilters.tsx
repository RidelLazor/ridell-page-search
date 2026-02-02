import { useState } from "react";
import { Filter, Globe, Languages, Clock, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { DateRange } from "./DateFilter";

export type Region = "any" | "us" | "uk" | "ca" | "au" | "de" | "fr" | "es" | "it" | "jp" | "in" | "br";
export type Language = "any" | "en" | "es" | "fr" | "de" | "it" | "pt" | "ja" | "zh" | "ko" | "ar" | "hi";

interface MobileSearchFiltersProps {
  dateRange: DateRange;
  region: Region;
  language: Language;
  onDateRangeChange: (value: DateRange) => void;
  onRegionChange: (value: Region) => void;
  onLanguageChange: (value: Language) => void;
}

const dateOptions: { value: DateRange; label: string }[] = [
  { value: "any", label: "Any time" },
  { value: "day", label: "Past 24 hours" },
  { value: "week", label: "Past week" },
  { value: "month", label: "Past month" },
  { value: "year", label: "Past year" },
];

const regionOptions: { value: Region; label: string }[] = [
  { value: "any", label: "Any region" },
  { value: "us", label: "United States" },
  { value: "uk", label: "United Kingdom" },
  { value: "ca", label: "Canada" },
  { value: "au", label: "Australia" },
  { value: "de", label: "Germany" },
  { value: "fr", label: "France" },
  { value: "es", label: "Spain" },
  { value: "it", label: "Italy" },
  { value: "jp", label: "Japan" },
  { value: "in", label: "India" },
  { value: "br", label: "Brazil" },
];

const languageOptions: { value: Language; label: string }[] = [
  { value: "any", label: "Any language" },
  { value: "en", label: "English" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "it", label: "Italian" },
  { value: "pt", label: "Portuguese" },
  { value: "ja", label: "Japanese" },
  { value: "zh", label: "Chinese" },
  { value: "ko", label: "Korean" },
  { value: "ar", label: "Arabic" },
  { value: "hi", label: "Hindi" },
];

const MobileSearchFilters = ({
  dateRange,
  region,
  language,
  onDateRangeChange,
  onRegionChange,
  onLanguageChange,
}: MobileSearchFiltersProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedSection, setExpandedSection] = useState<"time" | "region" | "language" | null>(null);

  const activeFiltersCount = [
    dateRange !== "any" ? 1 : 0,
    region !== "any" ? 1 : 0,
    language !== "any" ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  const getDateLabel = () => dateOptions.find(o => o.value === dateRange)?.label || "Any time";
  const getRegionLabel = () => regionOptions.find(o => o.value === region)?.label || "Any region";
  const getLanguageLabel = () => languageOptions.find(o => o.value === language)?.label || "Any language";

  const toggleSection = (section: "time" | "region" | "language") => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const handleClearFilters = () => {
    onDateRangeChange("any");
    onRegionChange("any");
    onLanguageChange("any");
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 rounded-full relative"
        >
          <Filter className="h-4 w-4" />
          <span>Filters</span>
          {activeFiltersCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
              {activeFiltersCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="rounded-t-3xl pb-safe max-h-[80vh] overflow-y-auto">
        <SheetHeader className="pb-4">
          <div className="flex items-center justify-between">
            <SheetTitle>Search Filters</SheetTitle>
            {activeFiltersCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="text-primary text-sm"
              >
                Clear all
              </Button>
            )}
          </div>
        </SheetHeader>

        <div className="space-y-2">
          {/* Time Range Filter */}
          <div className="rounded-xl border border-border overflow-hidden">
            <button
              onClick={() => toggleSection("time")}
              className="w-full flex items-center justify-between p-4 hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Time Range</p>
                  <p className="text-sm text-muted-foreground">{getDateLabel()}</p>
                </div>
              </div>
              <ChevronDown 
                className={`h-5 w-5 text-muted-foreground transition-transform ${
                  expandedSection === "time" ? "rotate-180" : ""
                }`} 
              />
            </button>
            <AnimatePresence>
              {expandedSection === "time" && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4 grid grid-cols-2 gap-2">
                    {dateOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          onDateRangeChange(option.value);
                          setExpandedSection(null);
                        }}
                        className={`p-3 rounded-lg text-sm text-left transition-colors ${
                          dateRange === option.value
                            ? "bg-primary text-primary-foreground"
                            : "bg-accent/50 hover:bg-accent"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Region Filter */}
          <div className="rounded-xl border border-border overflow-hidden">
            <button
              onClick={() => toggleSection("region")}
              className="w-full flex items-center justify-between p-4 hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Globe className="h-5 w-5 text-primary" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Region</p>
                  <p className="text-sm text-muted-foreground">{getRegionLabel()}</p>
                </div>
              </div>
              <ChevronDown 
                className={`h-5 w-5 text-muted-foreground transition-transform ${
                  expandedSection === "region" ? "rotate-180" : ""
                }`} 
              />
            </button>
            <AnimatePresence>
              {expandedSection === "region" && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4 grid grid-cols-2 gap-2">
                    {regionOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          onRegionChange(option.value);
                          setExpandedSection(null);
                        }}
                        className={`p-3 rounded-lg text-sm text-left transition-colors ${
                          region === option.value
                            ? "bg-primary text-primary-foreground"
                            : "bg-accent/50 hover:bg-accent"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Language Filter */}
          <div className="rounded-xl border border-border overflow-hidden">
            <button
              onClick={() => toggleSection("language")}
              className="w-full flex items-center justify-between p-4 hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Languages className="h-5 w-5 text-primary" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Language</p>
                  <p className="text-sm text-muted-foreground">{getLanguageLabel()}</p>
                </div>
              </div>
              <ChevronDown 
                className={`h-5 w-5 text-muted-foreground transition-transform ${
                  expandedSection === "language" ? "rotate-180" : ""
                }`} 
              />
            </button>
            <AnimatePresence>
              {expandedSection === "language" && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4 grid grid-cols-2 gap-2">
                    {languageOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          onLanguageChange(option.value);
                          setExpandedSection(null);
                        }}
                        className={`p-3 rounded-lg text-sm text-left transition-colors ${
                          language === option.value
                            ? "bg-primary text-primary-foreground"
                            : "bg-accent/50 hover:bg-accent"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="mt-6">
          <Button
            className="w-full"
            onClick={() => setIsOpen(false)}
          >
            Apply Filters
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MobileSearchFilters;
