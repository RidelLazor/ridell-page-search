import { useEffect } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";

const backgroundValues = [
  "default",
  "gradient",
  "mesh",
  "dots",
  "aurora",
  "sunset",
  "ocean",
  "custom-image",
] as const;

type BackgroundValue = (typeof backgroundValues)[number];

export default function AppearanceApplier() {
  const [background] = useLocalStorage<BackgroundValue>("ridel-background", "default");
  const [customImageUrl] = useLocalStorage<string>("ridel-custom-bg-url", "");

  useEffect(() => {
    const body = document.body;

    // Remove all background classes
    backgroundValues.forEach((bg) => body.classList.remove(`bg-${bg}`));

    if (background !== "default") {
      body.classList.add(`bg-${background}`);
    }

    if (background === "custom-image" && customImageUrl) {
      body.style.backgroundImage = `url(${customImageUrl})`;
    } else {
      body.style.backgroundImage = "";
    }
  }, [background, customImageUrl]);

  return null;
}
