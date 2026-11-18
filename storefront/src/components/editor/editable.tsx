"use client";

import React from "react";
import { useEditMode } from "./edit-mode-context";

interface EditableTextProps {
  as?: "h1" | "h2" | "h3" | "p" | "span" | "div";
  className?: string;
  value: string;
  label: string;
  cmsPath?: string;
}

export function EditableText({
  as: Tag = "span",
  className = "",
  value,
  label,
  cmsPath = "/pages",
}: EditableTextProps) {
  const { isSuperAdmin, editMode, openInErpCms } = useEditMode();
  const canLink = isSuperAdmin && editMode;

  return (
    <Tag
      className={`${className} ${canLink ? "editable-active" : ""}`}
      title={canLink ? `Edit ${label} in ERP CMS` : undefined}
      onClick={(e) => {
        if (!canLink) return;
        e.preventDefault();
        e.stopPropagation();
        openInErpCms(cmsPath);
      }}
    >
      {value}
    </Tag>
  );
}

interface EditableImageProps {
  src: string;
  alt: string;
  className?: string;
  label: string;
  cmsPath?: string;
}

export function EditableImage({
  src,
  alt,
  className = "",
  label,
  cmsPath = "/pages",
}: EditableImageProps) {
  const { isSuperAdmin, editMode, openInErpCms } = useEditMode();
  const canLink = isSuperAdmin && editMode;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={`${className} ${canLink ? "editable-active" : ""}`}
      title={canLink ? `Edit ${label} in ERP CMS` : undefined}
      onClick={(e) => {
        if (!canLink) return;
        e.preventDefault();
        e.stopPropagation();
        openInErpCms(cmsPath);
      }}
    />
  );
}
