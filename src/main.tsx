import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import AppErrorBoundary from "@/components/AppErrorBoundary";
import "./index.css";

// Capture hard crashes that would otherwise show a blank screen
if (typeof window !== "undefined") {
  window.addEventListener("error", (event) => {
    console.error("[window.error]", event.error || event.message);
  });

  window.addEventListener("unhandledrejection", (event) => {
    console.error("[window.unhandledrejection]", event.reason);
  });

  console.info("[bootstrap] app starting", {
    userAgent: navigator.userAgent,
    href: window.location.href,
  });
}

createRoot(document.getElementById("root")!).render(
  <AppErrorBoundary>
    <App />
  </AppErrorBoundary>
);
