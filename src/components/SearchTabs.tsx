import { Search, Image, Newspaper, Video } from "lucide-react";

export type SearchTab = "all" | "images" | "news" | "videos";

interface SearchTabsProps {
  activeTab: SearchTab;
  onTabChange: (tab: SearchTab) => void;
}

const tabs: { id: SearchTab; label: string; icon: React.ReactNode }[] = [
  { id: "all", label: "All", icon: <Search className="h-4 w-4" /> },
  { id: "images", label: "Images", icon: <Image className="h-4 w-4" /> },
  { id: "news", label: "News", icon: <Newspaper className="h-4 w-4" /> },
  { id: "videos", label: "Videos", icon: <Video className="h-4 w-4" /> },
];

const SearchTabs = ({ activeTab, onTabChange }: SearchTabsProps) => {
  return (
    <div className="flex items-center gap-1 border-b border-border overflow-x-auto">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
            activeTab === tab.id
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  );
};

export default SearchTabs;
