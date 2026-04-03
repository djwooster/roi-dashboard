export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-full bg-[#0a0a0a] flex items-center justify-center px-4 py-12 overflow-hidden">
      {/* Circuit board corner decorations */}
      <CircuitCorner position="top-left" />
      <CircuitCorner position="top-right" />
      <CircuitCorner position="bottom-left" />
      <CircuitCorner position="bottom-right" />

      <div className="relative z-10 w-full flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}

function CircuitCorner({ position }: { position: "top-left" | "top-right" | "bottom-left" | "bottom-right" }) {
  const isRight = position.includes("right");
  const isBottom = position.includes("bottom");

  const posClass = [
    isBottom ? "bottom-0" : "top-0",
    isRight ? "right-0" : "left-0",
  ].join(" ");

  const flipX = isRight ? "scale-x-[-1]" : "";
  const flipY = isBottom ? "scale-y-[-1]" : "";

  return (
    <div className={`absolute ${posClass} ${flipX} ${flipY} origin-[0_0] ${isRight ? "origin-top-right" : ""} ${isBottom ? (isRight ? "origin-bottom-right" : "origin-bottom-left") : ""}`}>
      <svg width="320" height="200" viewBox="0 0 320 200" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Chip block */}
        <rect x="0" y="82" width="88" height="26" rx="3" fill="#161616" stroke="#222" strokeWidth="1" />
        {/* Chip dots */}
        <circle cx="12" cy="95" r="2.5" fill="#2a2a2a" />
        <circle cx="22" cy="95" r="2.5" fill="#2a2a2a" />
        <circle cx="32" cy="95" r="2.5" fill="#2a2a2a" />
        <circle cx="42" cy="95" r="2.5" fill="#2a2a2a" />
        <circle cx="52" cy="95" r="2.5" fill="#2a2a2a" />
        <circle cx="62" cy="95" r="2.5" fill="#2a2a2a" />
        <circle cx="72" cy="95" r="2.5" fill="#2a2a2a" />

        {/* Main horizontal trace from chip */}
        <line x1="88" y1="95" x2="168" y2="95" stroke="#1e1e1e" strokeWidth="1" />
        {/* Turn upward */}
        <line x1="168" y1="95" x2="168" y2="44" stroke="#1e1e1e" strokeWidth="1" />
        {/* Horizontal trace right */}
        <line x1="168" y1="44" x2="280" y2="44" stroke="#1e1e1e" strokeWidth="1" />
        {/* Terminal dot */}
        <circle cx="280" cy="44" r="3.5" fill="#222" stroke="#2a2a2a" strokeWidth="1" />

        {/* Second branch — shorter trace going down from the turn */}
        <line x1="168" y1="95" x2="168" y2="130" stroke="#1e1e1e" strokeWidth="1" />
        <line x1="168" y1="130" x2="230" y2="130" stroke="#1e1e1e" strokeWidth="1" />
        <circle cx="230" cy="130" r="3.5" fill="#222" stroke="#2a2a2a" strokeWidth="1" />

        {/* Small connector tick on chip line */}
        <line x1="128" y1="90" x2="128" y2="82" stroke="#1e1e1e" strokeWidth="1" />
        <rect x="118" y="72" width="20" height="10" rx="2" fill="#161616" stroke="#222" strokeWidth="1" />
      </svg>
    </div>
  );
}
