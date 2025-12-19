import { useLocalStorage } from "@/hooks/useLocalStorage";

export const useSoundSettings = () => {
  const [soundEnabled, setSoundEnabled] = useLocalStorage("ridel-sound-enabled", true);
  
  return {
    soundEnabled,
    setSoundEnabled,
    toggleSound: () => setSoundEnabled(!soundEnabled),
  };
};
