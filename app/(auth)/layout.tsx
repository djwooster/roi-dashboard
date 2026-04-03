export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-full bg-[#fafafa] flex items-center justify-center px-4 py-12">
      {children}
    </div>
  );
}
