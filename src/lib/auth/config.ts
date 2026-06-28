import type { NextAuthConfig } from "next-auth";

// Edge-safe config (no Node-only deps). Used by middleware + the full server config.
export const authConfig = {
  // Trust the deployment host (Vercel terminates TLS at its proxy). Without this,
  // Auth.js can reject production requests with an UntrustedHost error.
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
  callbacks: {
    // Persist identity, tenant and permissions into the JWT at sign-in.
    async jwt({ token, user }) {
      if (user) {
        token.uid = user.id;
        token.tenantId = (user as { tenantId?: string | null }).tenantId ?? null;
        token.roles = (user as { roles?: string[] }).roles ?? [];
        token.permissions = (user as { permissions?: string[] }).permissions ?? [];
        token.employeeId = (user as { employeeId?: string | null }).employeeId ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.uid as string;
        session.user.tenantId = (token.tenantId as string | null) ?? null;
        session.user.roles = (token.roles as string[]) ?? [];
        session.user.permissions = (token.permissions as string[]) ?? [];
        session.user.employeeId = (token.employeeId as string | null) ?? null;
      }
      return session;
    },
  },
  providers: [], // declared in the full server config (auth.ts)
} satisfies NextAuthConfig;
