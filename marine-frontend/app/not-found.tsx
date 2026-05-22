import { NotFoundCard } from "@/components/not-found-card";

export default function NotFound() {
  return (
    <main className="flex min-h-svh w-full items-center justify-center px-6 py-12">
      <NotFoundCard homeHref="/dashboard" />
    </main>
  );
}
