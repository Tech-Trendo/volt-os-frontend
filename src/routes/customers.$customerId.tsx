import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2, AlertCircle, ArrowLeft } from "lucide-react";
import { pageHead } from "@/lib/metadata";
import { CustomerDetailView } from "@/features/modules/customer-detail-view";
import { getCustomer360 } from "@/services/records";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/customers/$customerId")({
  head: ({ params }) =>
    pageHead(
      `Customer Profile`,
      `Customer 360 overview, purchased EV chargers, maintenance history, quotations, documents, and lead timeline for ${params.customerId}.`,
    ),
  component: CustomerPage,
});

function CustomerPage() {
  const { customerId } = Route.useParams();
  const navigate = useNavigate();

  const {
    data: profile,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["customer-360", customerId],
    queryFn: () => getCustomer360(customerId),
  });

  const handleBack = () => {
    if (window.history.length > 1) {
      window.history.back();
      return;
    }
    void navigate({
      to: "/network/stations",
      search: {},
    });
  };

  if (isLoading) {
    return (
      <main className="erp-page">
        <div className="panel flex min-h-[50vh] flex-col items-center justify-center gap-3 p-10 text-muted-foreground">
          <Loader2 className="size-7 animate-spin text-primary" />
          <p className="text-xs">Loading customer record from Volt OS…</p>
        </div>
      </main>
    );
  }

  if (isError || !profile) {
    return (
      <main className="erp-page">
        <div className="panel flex min-h-[50vh] flex-col items-center justify-center gap-4 p-10 text-center">
          <div className="rounded-full bg-destructive/10 p-3 text-destructive">
            <AlertCircle className="size-7" />
          </div>
          <div>
            <h2 className="text-base font-semibold">Customer Record Not Found</h2>
            <p className="mt-1 max-w-md text-xs text-muted-foreground">
              {error instanceof Error
                ? error.message
                : "The requested customer profile could not be loaded from the backend."}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleBack}>
            <ArrowLeft size={14} />
            Return
          </Button>
        </div>
      </main>
    );
  }

  return <CustomerDetailView customer={profile.customer} profile={profile} onBack={handleBack} />;
}
