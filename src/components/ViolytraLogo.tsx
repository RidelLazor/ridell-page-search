import { Link } from "react-router-dom";

interface ViolytraLogoProps {
  compact?: boolean;
}

const ViolytraMark = () => (
  <span className="relative inline-flex h-[0.78em] w-[0.78em] shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary align-middle">
    <span className="absolute right-0 top-0 h-1/2 w-1/2 bg-brand-deep" />
    <span className="absolute bottom-0 left-0 h-1/2 w-full bg-brand-warm" />
    <span className="relative h-[46%] w-[46%] rounded-full bg-background">
      <span className="absolute left-[18%] top-[39%] h-[8%] w-[70%] -rotate-12 rounded-full bg-brand-deep" />
      <span className="absolute left-[18%] top-[57%] h-[8%] w-[70%] -rotate-12 rounded-full bg-brand-deep" />
    </span>
  </span>
);

const ViolytraLogo = ({ compact = false }: ViolytraLogoProps) => (
  <Link
    to="/"
    aria-label="Violytra home"
    className={`inline-flex items-center font-display text-primary no-underline ${compact ? "text-[1.55rem]" : "text-[clamp(2.8rem,8vw,5rem)]"}`}
  >
    <span>VI</span>
    <ViolytraMark />
    <span>LYTRA</span>
  </Link>
);

export default ViolytraLogo;