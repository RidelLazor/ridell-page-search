import { useEffect } from "react";

interface ShortcutHandlers {
  onFocusSearch?: () => void;
  onToggleBookmarks?: () => void;
}

export const useKeyboardShortcuts = ({ onFocusSearch, onToggleBookmarks }: ShortcutHandlers) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const target = e.target as HTMLElement;
      const isInputField = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;

      // "/" to focus search (only when not in input)
      if (e.key === "/" && !isInputField) {
        e.preventDefault();
        onFocusSearch?.();
      }

      // Ctrl+B or Cmd+B for bookmarks
      if ((e.ctrlKey || e.metaKey) && e.key === "b") {
        e.preventDefault();
        onToggleBookmarks?.();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onFocusSearch, onToggleBookmarks]);
};
