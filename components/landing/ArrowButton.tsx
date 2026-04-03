import type { ReactNode } from "react";

interface Props {
  href: string;
  children: ReactNode;
  variant?: "dark" | "light";
  external?: boolean;
  className?: string;
  arrowLeft?: string;
}

const ArrowSVG = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path
      d="M3 8H13M9 4l4 4-4 4"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default function ArrowButton({
  href,
  children,
  variant = "dark",
  external = false,
  className = "",
  arrowLeft = "28px",
}: Props) {
  const base =
    "group relative inline-flex items-center justify-center gap-2 font-bold overflow-hidden transition-colors duration-200 rounded-lg";
  const variants = {
    dark: "bg-[#0a0a0a] text-white hover:bg-[#0a0a0a]/85",
    light: "bg-white text-[#0a0a0a] hover:bg-white/90",
  };

  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className={`${base} ${variants[variant]} ${className}`}
      style={{ '--cta-arrow-left': arrowLeft } as React.CSSProperties}
    >
      <span className="cta-arrow-in">
        <ArrowSVG />
      </span>
      <span className="cta-text">{children}</span>
      <span className="cta-arrow-out">
        <ArrowSVG />
      </span>
    </a>
  );
}
