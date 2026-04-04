import Image from "next/image";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <Image
        src="/new-bg.webp"
        alt=""
        fill
        className="object-cover"
        priority
      />
      <div className="relative z-10 w-full max-w-md mx-6 my-10">
        {children}
      </div>
    </div>
  );
}
