import { Link } from "react-router-dom";
import icon from "@/assets/violytra-icon.svg.asset.json";

interface ViolytraLogoProps {
  compact?: boolean;
}

const ViolytraLogo = ({ compact = false }: ViolytraLogoProps) => (
  <Link to="/" aria-label="Violytra home" className="inline-flex items-center gap-2 no-underline">
    <img
      src={icon.url}
      alt=""
      className={compact ? "h-7 w-auto" : "h-[clamp(2.5rem,7vw,4rem)] w-auto"}
      aria-hidden="true"
    />
    <span
      className={`font-display tracking-tight text-foreground ${
        compact
          ? "text-xl leading-none"
          : "text-[clamp(2.5rem,8vw,4.5rem)] leading-none"
      }`}
    >
      Violytra
    </span>
  </Link>
);

export default ViolytraLogo;
