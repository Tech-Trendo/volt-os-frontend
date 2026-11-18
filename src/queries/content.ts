import { queryOptions } from "@tanstack/react-query";
import {
  getSiteSettings,
  getContentStats,
  getProductCategories,
  getProductCategory,
  getBrandSuppliers,
  getProducts,
  getProduct,
  getImportProcessSteps,
  getTestimonials,
  getFaqs,
  getCertifications,
  getBlogPosts,
  getBlogPost,
  getTeamMembers,
} from "@/services/content";

export const siteSettingsQuery = queryOptions({
  queryKey: ["content", "settings"],
  queryFn: () => getSiteSettings(),
  staleTime: 5 * 60 * 1000,
});

export const contentStatsQuery = queryOptions({
  queryKey: ["content", "stats"],
  queryFn: () => getContentStats(),
  staleTime: 60 * 1000,
});

export const productCategoriesQuery = queryOptions({
  queryKey: ["content", "categories"],
  queryFn: () => getProductCategories(),
  staleTime: 5 * 60 * 1000,
});

export function productCategoryQuery(slug: string) {
  return queryOptions({
    queryKey: ["content", "category", slug],
    queryFn: () => getProductCategory(slug),
  });
}

export const brandSuppliersQuery = queryOptions({
  queryKey: ["content", "brands"],
  queryFn: () => getBrandSuppliers(),
  staleTime: 5 * 60 * 1000,
});

export function productsQuery(params?: {
  category?: string;
  brand?: string;
  search?: string;
  status?: string;
  featured?: boolean;
}) {
  return queryOptions({
    queryKey: ["content", "products", params],
    queryFn: () => getProducts(params),
    staleTime: 60 * 1000,
  });
}

export function productDetailQuery(slug: string) {
  return queryOptions({
    queryKey: ["content", "product", slug],
    queryFn: () => getProduct(slug),
  });
}

export const importProcessStepsQuery = queryOptions({
  queryKey: ["content", "process"],
  queryFn: () => getImportProcessSteps(),
  staleTime: 10 * 60 * 1000,
});

export const testimonialsQuery = queryOptions({
  queryKey: ["content", "testimonials"],
  queryFn: () => getTestimonials(),
  staleTime: 10 * 60 * 1000,
});

export function faqsQuery(category?: string) {
  return queryOptions({
    queryKey: ["content", "faqs", category],
    queryFn: () => getFaqs(category),
    staleTime: 10 * 60 * 1000,
  });
}

export const certificationsQuery = queryOptions({
  queryKey: ["content", "certifications"],
  queryFn: () => getCertifications(),
  staleTime: 10 * 60 * 1000,
});

export const blogPostsQuery = queryOptions({
  queryKey: ["content", "blog"],
  queryFn: () => getBlogPosts(),
  staleTime: 5 * 60 * 1000,
});

export function blogPostDetailQuery(slug: string) {
  return queryOptions({
    queryKey: ["content", "blog-post", slug],
    queryFn: () => getBlogPost(slug),
  });
}

export const teamMembersQuery = queryOptions({
  queryKey: ["content", "team"],
  queryFn: () => getTeamMembers(),
  staleTime: 10 * 60 * 1000,
});
