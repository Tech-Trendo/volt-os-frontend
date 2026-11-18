"use client";

import React, { createContext, useContext, useState } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, EyeOff, PencilLine } from "lucide-react";

interface EditModeContextValue {
  isSuperAdmin: boolean;
  editMode: boolean;
  erpCmsBaseUrl: string;
  openInErpCms: (cmsPath: string) => void;
}

const EditModeContext = createContext<EditModeContextValue>({
  isSuperAdmin: false,
  editMode: false,
  erpCmsBaseUrl: "http://localhost:8081/cms",
  openInErpCms: () => {},
});

export function useEditMode() {
  return useContext(EditModeContext);
}

export function EditModeProvider({
  isSuperAdmin,
  previewActive,
  erpFrontendUrl,
  children,
}: {
  isSuperAdmin: boolean;
  previewActive: boolean;
  erpFrontendUrl: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [editMode, setEditMode] = useState(false);
  const erpCmsBaseUrl = `${erpFrontendUrl.replace(/\/$/, "")}/cms`;
  const showBar = isSuperAdmin || previewActive;

  const openInErpCms = (cmsPath: string) => {
    const clean = cmsPath.startsWith("/") ? cmsPath : `/${cmsPath}`;
    window.open(`${erpCmsBaseUrl}${clean}`, "_blank", "noopener,noreferrer");
  };

  const exitPreview = async () => {
    await fetch("/api/preview", { method: "DELETE" });
    router.refresh();
  };

  return (
    <EditModeContext.Provider value={{ isSuperAdmin: showBar, editMode, erpCmsBaseUrl, openInErpCms }}>
      {showBar && (
        <div className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950 text-zinc-100">
          <div className="flex w-full flex-wrap items-center justify-between gap-3 px-4 py-2 text-xs sm:px-6 lg:px-10 xl:px-14">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 font-medium text-emerald-400">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                {previewActive ? "ERP Draft Preview" : "Super Admin"}
              </span>
              <button
                type="button"
                onClick={() => setEditMode((v) => !v)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-medium transition ${
                  editMode
                    ? "bg-white text-zinc-950"
                    : "border border-zinc-700 text-zinc-200 hover:border-zinc-500"
                }`}
              >
                <PencilLine className="h-3.5 w-3.5" />
                ERP Deep-Link Mode: {editMode ? "ON" : "OFF"}
              </button>
            </div>
            <div className="flex items-center gap-2">
              {previewActive && (
                <button
                  type="button"
                  onClick={() => void exitPreview()}
                  className="inline-flex items-center gap-1.5 rounded-md border border-zinc-700 px-3 py-1 font-medium text-zinc-200 hover:bg-zinc-800"
                >
                  <EyeOff className="h-3.5 w-3.5" />
                  Exit Preview
                </button>
              )}
              <a
                href={erpCmsBaseUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500 px-3 py-1 font-medium text-zinc-950 hover:bg-emerald-400"
              >
                Open ERP CMS
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}
      {children}
    </EditModeContext.Provider>
  );
}
