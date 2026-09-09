import DashboardTopbar from "@/components/ui/dashboard-topbar";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type ComingSoonPageProps = {
  currentPage: string;
};

export default function ComingSoonPage({ currentPage }: ComingSoonPageProps) {
  return (
    <main
      className="h-full min-h-0 min-w-0 flex-1 overflow-y-auto bg-white"
      aria-label={`${currentPage} page`}
    >
      <DashboardTopbar currentPage={currentPage} />
      <section className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>{currentPage}</CardTitle>
            <CardDescription>
              This workspace is coming soon. Return to the dashboard to review
              the current analysis overview.
            </CardDescription>
          </CardHeader>
        </Card>
      </section>
    </main>
  );
}
