export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-black/8 py-8 px-6">
      <div className="max-w-[90rem] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <span className="text-sm font-bold text-[#0a0a0a]/70 tracking-tight">SourceIQ</span>
        <p className="text-xs text-[#0a0a0a]/30 text-center">
          &copy; {year} SourceIQ. All rights reserved.
        </p>
        <div className="flex items-center gap-5">
          <a href="/privacy" className="text-xs text-[#0a0a0a]/30 hover:text-[#0a0a0a]/60 transition-colors duration-200">
            Privacy Policy
          </a>
          <a href="/terms" className="text-xs text-[#0a0a0a]/30 hover:text-[#0a0a0a]/60 transition-colors duration-200">
            Terms of Service
          </a>
          <a href="/privacy/data-deletion" className="text-xs text-[#0a0a0a]/30 hover:text-[#0a0a0a]/60 transition-colors duration-200">
            Data Deletion
          </a>
          <a href="mailto:hello@sourceiq.app" className="text-xs text-[#0a0a0a]/30 hover:text-[#0a0a0a]/60 transition-colors duration-200">
            hello@sourceiq.app
          </a>
        </div>
      </div>
    </footer>
  );
}
