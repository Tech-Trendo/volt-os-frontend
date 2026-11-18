import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // Storefront has no admin screens of its own — redirect /admin to the ERP CMS
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    const configured = (process.env.ERP_FRONTEND_URL || "").trim().replace(/\/$/, "");
    if (configured && configured.startsWith("http")) {
      return NextResponse.redirect(`${configured}/cms`);
    }
    const url = request.nextUrl.clone();
    url.pathname = "/erp/cms";
    return NextResponse.redirect(url);
  }

  // Persist ERP preview token when Super Admin clicks "Preview Drafts" from ERP CMS
  const previewToken = searchParams.get("preview_token");
  if (previewToken) {
    const url = request.nextUrl.clone();
    url.searchParams.delete("preview_token");
    const response = NextResponse.redirect(url);
    response.cookies.set("erp_preview_token", previewToken, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 4 * 60 * 60,
    });
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|uploads/|erp-app/).*)"],
};
