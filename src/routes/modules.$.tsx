import { createFileRoute } from "@tanstack/react-router";
import { ModulePage } from "@/features/modules/module-page";
import { allModules } from "@/mock/reference";
import { pageHead } from "@/lib/metadata";
export const Route = createFileRoute("/modules/$")({
  validateSearch: (
    search: Record<string, unknown>,
  ): { status?: string | undefined; recordId?: string | undefined } => ({
    status: typeof search["status"] === "string" ? search["status"] : undefined,
    recordId: typeof search["recordId"] === "string" ? search["recordId"] : undefined,
  }),
  head: ({ params }) => {
    const m = allModules.find((m) => m.slug === params._splat);
    return pageHead(
      m?.title ?? "Business Records",
      m?.description ?? "Volt OS enterprise business operations.",
    );
  },
  component: Module,
});
function Module() {
  const { _splat } = Route.useParams();
  const { status, recordId } = Route.useSearch();
  return (
    <ModulePage
      key={`${_splat}-${status ?? ""}-${recordId ?? ""}`}
      slug={_splat ?? ""}
      initialStatus={status}
      initialRecordId={recordId}
    />
  );
}
