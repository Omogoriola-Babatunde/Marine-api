import { NotFoundCard } from "@/components/not-found-card";
import { SiteHeader } from "@/components/site-header";

export default function NotFound() {
  return (
    <>
      <SiteHeader title="Not found" />
      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <NotFoundCard homeHref="/dashboard" />
      </div>
    </>
  );
}
