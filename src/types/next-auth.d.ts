import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      tenantId: string | null;
      roles: string[];
      permissions: string[];
      employeeId: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    tenantId?: string | null;
    roles?: string[];
    permissions?: string[];
    employeeId?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    uid?: string;
    tenantId?: string | null;
    roles?: string[];
    permissions?: string[];
    employeeId?: string | null;
  }
}
