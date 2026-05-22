import { ActivityArea } from "@/components/charts/activity-area";
import { PremiumByClassBar } from "@/components/charts/premium-by-class-bar";
import { SectionCards } from "@/components/section-cards";
import { SiteHeader } from "@/components/site-header";

export default function Page() {
  return (
    <>
      <SiteHeader title="Dashboard" />
      <div className="flex flex-1 flex-col gap-6 px-4 py-4 md:gap-6 md:py-6 lg:px-6">
        <SectionCards />
        <div className="grid grid-cols-1 gap-6 @5xl/main:grid-cols-3">
          <div className="@5xl/main:col-span-1">
            <PremiumByClassBar />
          </div>
          <div className="@5xl/main:col-span-2">
            <ActivityArea days={30} />
          </div>
        </div>
      </div>
    </>
  );
}
