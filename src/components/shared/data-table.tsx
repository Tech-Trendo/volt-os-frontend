import { useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, Columns3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
export function DataTable<T>({
  data,
  columns,
  total,
  page,
  pageSize,
  onPage,
  sorting,
  onSorting,
}: {
  data: T[];
  columns: ColumnDef<T>[];
  total: number;
  page: number;
  pageSize: number;
  onPage: (page: number) => void;
  sorting: SortingState;
  onSorting: (sort: SortingState) => void;
}) {
  const [visibility, setVisibility] = useState<VisibilityState>({});
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
    manualPagination: true,
    state: { sorting, columnVisibility: visibility },
    onSortingChange: (update) => onSorting(typeof update === "function" ? update(sorting) : update),
    onColumnVisibilityChange: setVisibility,
  });
  return (
    <>
      <div className="flex items-center justify-between border-b px-4 py-2">
        <span className="text-[11px] text-muted-foreground">{total} records</span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <Columns3 />
              Columns
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllLeafColumns()
              .filter((c) => c.getCanHide())
              .map((c) => (
                <DropdownMenuCheckboxItem
                  key={c.id}
                  checked={c.getIsVisible()}
                  onCheckedChange={(v) => c.toggleVisibility(v)}
                >
                  {typeof c.columnDef.header === "string" ? c.columnDef.header : c.id}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="table-scroll">
        <table className="data-table">
          <thead>
            {table.getHeaderGroups().map((g) => (
              <tr key={g.id}>
                {g.headers.map((h) => (
                  <th key={h.id}>
                    {h.isPlaceholder ? null : (
                      <Button
                        variant="ghost"
                        className="h-auto justify-start p-0 text-[11px] font-normal text-muted-foreground"
                        onClick={h.column.getToggleSortingHandler()}
                        disabled={!h.column.getCanSort()}
                      >
                        {flexRender(h.column.columnDef.header, h.getContext())}
                        {h.column.getCanSort() &&
                          (h.column.getIsSorted() === "asc" ? (
                            <ArrowUp size={12} />
                          ) : h.column.getIsSorted() === "desc" ? (
                            <ArrowDown size={12} />
                          ) : (
                            <ArrowUpDown size={12} />
                          ))}
                      </Button>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3">
        <span className="text-[10px] text-muted-foreground">
          Showing {total ? (page - 1) * pageSize + 1 : 0}–{Math.min(page * pageSize, total)} of{" "}
          {total}
        </span>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-muted-foreground">
            Page {page} of {Math.max(1, Math.ceil(total / pageSize))}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="size-7"
            disabled={page <= 1}
            onClick={() => onPage(page - 1)}
            aria-label="Previous page"
          >
            <ChevronLeft size={13} />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-7"
            disabled={page * pageSize >= total}
            onClick={() => onPage(page + 1)}
            aria-label="Next page"
          >
            <ChevronRight size={13} />
          </Button>
        </div>
      </div>
    </>
  );
}
