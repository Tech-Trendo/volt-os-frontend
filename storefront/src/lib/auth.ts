import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { getErpApiBase } from "./erp-client";
import { checkRateLimit } from "./rate-limit";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60,
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Email & Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.trim().toLowerCase() ?? "";
        const password = credentials?.password ?? "";
        if (!email || !password) throw new Error("Email and password are required.");

        const rate = checkRateLimit(`login:${email}`, 12, 15 * 60 * 1000);
        if (!rate.allowed) {
          throw new Error(`Too many login attempts. Please retry in ${rate.retryAfterSec}s.`);
        }

        const res = await fetch(`${getErpApiBase()}/public/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        const data = (await res.json().catch(() => ({}))) as {
          access?: string;
          user?: { id: number; email: string; full_name?: string; username?: string; role?: string; is_active?: boolean };
          non_field_errors?: string[];
          error?: string;
          detail?: string;
        };

        if (!res.ok || !data.user || !data.access) {
          throw new Error(
            data.non_field_errors?.[0] || data.error || data.detail || "Invalid email or password.",
          );
        }

        return {
          id: String(data.user.id),
          name: data.user.full_name || data.user.username || data.user.email,
          email: data.user.email,
          role: data.user.role || "Customer",
          isActive: data.user.is_active !== false,
          accessToken: data.access,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.isActive = user.isActive;
        token.accessToken = user.accessToken;
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      if (session.user) {
        session.user.id = token.id ?? "";
        session.user.role = token.role ?? "Customer";
        session.user.isActive = token.isActive ?? true;
      }
      return session;
    },
  },
};

export async function getStorefrontSession() {
  return getServerSession(authOptions);
}
