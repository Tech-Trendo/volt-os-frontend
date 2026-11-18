import { useState } from "react";
import { List, ChevronRight } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/common";
import type { Station } from "@/models/stations";
export function MobileStationList({
  stations,
  onSelect,
}: {
  stations: Station[];
  onSelect: (station: Station) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        variant="outline"
        className="w-full rounded-none border-x-0 border-b-0 py-6"
        onClick={() => setOpen(true)}
      >
        <List />
        Stations ({stations.length})
        <span className="ml-auto text-xs text-muted-foreground">View list</span>
      </Button>
      <Drawer open={open} onOpenChange={setOpen} shouldScaleBackground={false}>
        <DrawerContent className="max-h-[75vh]">
          <DrawerHeader>
            <DrawerTitle>Stations ({stations.length})</DrawerTitle>
            <DrawerDescription>Filtered charging network</DrawerDescription>
          </DrawerHeader>
          <div className="overflow-y-auto" aria-label="Mobile station results">
            {stations.map((s) => (
              <Button
                key={s.id}
                variant="ghost"
                className="station-list-item !h-auto !justify-start !rounded-none !whitespace-normal"
                onClick={() => {
                  setOpen(false);
                  onSelect(s);
                }}
              >
                <div className="min-w-0 flex-1 text-left">
                  <div className="text-xs font-medium">{s.name}</div>
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    {s.stationCode} · {s.municipality}
                  </p>
                  <div className="mt-2">
                    <StatusBadge status={s.status} />
                    <span className="ml-2 text-[10px] text-muted-foreground">
                      {s.chargers.length || 2} chargers
                    </span>
                  </div>
                </div>
                <ChevronRight size={14} />
              </Button>
            ))}
            {stations.length === 0 && (
              <p className="p-10 text-center text-sm text-muted-foreground">No matching stations</p>
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
