import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <Link href="/" className="mb-6 text-2xl font-extrabold">
        <span className="text-primary">WorkNow</span>{" "}
        <span className="text-gray-700">Korea</span>
      </Link>
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
