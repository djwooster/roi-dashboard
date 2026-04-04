import Image from "next/image";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Left panel — form */}
      <div className="flex-1 flex items-center justify-center bg-white px-8 py-12 overflow-y-auto">
        {children}
      </div>

      {/* Right panel — image */}
      <div className="hidden lg:block relative w-[45%] xl:w-1/2 flex-shrink-0">
        <Image
          src="https://images.pexels.com/photos/3184293/pexels-photo-3184293.jpeg"
          alt="Marketing agency team collaborating"
          fill
          className="object-cover"
          priority
          sizes="(min-width: 1280px) 50vw, 45vw"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/15" />

        {/* Testimonial card */}
        <div className="absolute bottom-8 left-8 right-8 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6">
          <p className="text-white/90 text-sm leading-relaxed mb-5">
            &ldquo;Since switching to SourceIQ, our team has cut reporting time in half and finally has clear visibility into which campaigns actually drive revenue.&rdquo;
          </p>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-white font-semibold text-sm">Marcus Webb</p>
              <p className="text-white/55 text-xs mt-0.5">Head of Performance Marketing</p>
              <p className="text-white/40 text-xs">Apex Digital Agency</p>
            </div>
            <div className="flex items-center gap-2">
              <button className="w-7 h-7 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white/60 hover:bg-white/20 transition-colors">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M6.5 8L3.5 5l3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <button className="w-7 h-7 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white/60 hover:bg-white/20 transition-colors">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M3.5 8l3-3-3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
