import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/session";
import { homeForRoles } from "@/lib/nav";

// Post-login dispatcher: send each user to their role's home.
export default async function GoPage() {
  const ctx = await requireSession();
  redirect(homeForRoles(ctx.roles));
}
