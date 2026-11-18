import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters.").max(100),
  email: z.string().trim().email("Enter a valid email address.").toLowerCase(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .max(128, "Password is too long."),
});

export const resetRequestSchema = z.object({
  email: z.string().trim().email("Enter a valid email address.").toLowerCase(),
});

export const resetConfirmSchema = z.object({
  token: z.string().trim().min(10, "Reset token is required."),
  password: z.string().min(8, "New password must be at least 8 characters.").max(128),
});

export const enquirySchema = z.object({
  name: z.string().trim().min(2, "Full name is required.").max(120),
  email: z.string().trim().email("Enter a valid email address."),
  phone: z.string().trim().min(7, "Enter a valid phone number.").max(32),
  message: z.string().trim().min(10, "Please share at least 10 characters about your requirement.").max(3000),
  chargerId: z.string().trim().optional().nullable(),
  website: z.string().optional(), // Honeypot spam trap — must remain empty
});

export const enquiryUpdateSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["NEW", "READ", "REPLIED", "ARCHIVED"]).optional(),
  adminNotes: z.string().max(2000).optional(),
});

export const chargerSchema = z.object({
  id: z.string().optional(),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(140)
    .regex(/^[a-z0-9-]+$/, "Slug can contain lowercase letters, numbers, and hyphens only."),
  name: z.string().trim().min(2, "Charger name is required.").max(180),
  brandId: z.string().min(1, "Brand is required."),
  categoryId: z.string().min(1, "Category is required."),
  type: z.enum(["AC", "DC"]),
  powerKw: z.coerce.number().positive("Power output must be greater than 0 kW.").max(1000),
  connectors: z.array(z.string().trim().min(1)).min(1, "Add at least one connector type."),
  phase: z.string().trim().min(1).max(64).default("3-Phase"),
  dimensions: z.string().trim().max(120).default(""),
  warrantyMonths: z.coerce.number().int().min(0).max(180).default(24),
  priceNpr: z.coerce.number().int().min(0).nullable().optional(),
  showPrice: z.boolean().default(true),
  stockStatus: z.enum(["IN_STOCK", "LOW_STOCK", "PRE_ORDER", "OUT_OF_STOCK"]).default("IN_STOCK"),
  description: z.string().max(20000).default(""),
  specs: z.record(z.string(), z.string()).default({}),
  images: z.array(z.string().trim().min(1)).default([]),
  isFeatured: z.boolean().default(false),
  status: z.enum(["DRAFT", "PUBLISHED"]).default("DRAFT"),
  sortOrder: z.coerce.number().int().default(0),
});

export const brandSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2).max(120),
  slug: z.string().trim().min(2).max(120),
  logoUrl: z.string().trim().max(500).default(""),
  description: z.string().trim().max(1000).default(""),
  website: z.string().trim().max(300).default(""),
  sortOrder: z.coerce.number().int().default(0),
  isActive: z.boolean().default(true),
});

export const categorySchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2).max(120),
  slug: z.string().trim().min(2).max(120),
  description: z.string().trim().max(1000).default(""),
  filterGroup: z.string().trim().min(1).max(60).default("application"),
  sortOrder: z.coerce.number().int().default(0),
  isActive: z.boolean().default(true),
});

export const navLinkSchema = z.object({
  id: z.string().optional(),
  location: z.enum(["HEADER", "FOOTER"]),
  label: z.string().trim().min(1).max(80),
  href: z.string().trim().min(1).max(300),
  sortOrder: z.coerce.number().int().default(0),
  isVisible: z.boolean().default(true),
  openInNewTab: z.boolean().default(false),
});

export const testimonialSchema = z.object({
  id: z.string().optional(),
  authorName: z.string().trim().min(2).max(120),
  authorRole: z.string().trim().max(120).default(""),
  company: z.string().trim().max(160).default(""),
  location: z.string().trim().max(120).default(""),
  quote: z.string().trim().min(10).max(1500),
  rating: z.coerce.number().int().min(1).max(5).default(5),
  avatarUrl: z.string().trim().max(500).default(""),
  isVisible: z.boolean().default(true),
  sortOrder: z.coerce.number().int().default(0),
});

export const faqSchema = z.object({
  id: z.string().optional(),
  question: z.string().trim().min(5).max(300),
  answer: z.string().trim().min(5).max(3000),
  category: z.string().trim().max(80).default("General"),
  isVisible: z.boolean().default(true),
  sortOrder: z.coerce.number().int().default(0),
});

export const serviceSchema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(2).max(160),
  slug: z.string().trim().min(2).max(160),
  summary: z.string().trim().max(500).default(""),
  description: z.string().trim().max(5000).default(""),
  icon: z.string().trim().max(60).default("Wrench"),
  imageUrl: z.string().trim().max(500).default(""),
  isVisible: z.boolean().default(true),
  sortOrder: z.coerce.number().int().default(0),
});

export const sectionSaveSchema = z.object({
  sectionKey: z.string().trim().min(1),
  content: z.record(z.string(), z.unknown()),
  publish: z.boolean().optional().default(false),
  note: z.string().max(300).optional(),
});

export const settingsSaveSchema = z.object({
  settings: z.record(z.string(), z.string()),
  group: z.string().trim().optional(),
  publish: z.boolean().optional().default(false),
  note: z.string().max(300).optional(),
});

export const userAdminUpdateSchema = z.object({
  id: z.string().min(1),
  role: z.enum(["SUPER_ADMIN", "USER"]).optional(),
  isActive: z.boolean().optional(),
});
