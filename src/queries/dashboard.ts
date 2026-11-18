import { queryOptions } from "@tanstack/react-query";
import { getDashboardKpis } from "@/services/dashboard";

export const dashboardQuery = queryOptions({
  queryKey: ["dashboard", "This month", "All warehouses"],
  queryFn: () => getDashboardKpis(),
});
