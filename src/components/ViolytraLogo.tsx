import { Link } from "react-router-dom";
import wordmark from "@/assets/violytra-wordmark.svg.asset.json";

interface ViolytraLogoProps {
  compact?: boolean;
}

const ViolytraLogo = ({ compact = false }: ViolytraLogoProps) => (
  <Link to="/" aria-label="Violytra home" className="inline-flex items-center no-underline">
    <img
      src={wordmark.url}
      alt="Violytra"
      className={compact ? "h-7 w-auto" : "h-[clamp(3rem,9vw,5.5rem)] w-auto"}
    />
  </Link>
);

export default ViolytraLogo;
