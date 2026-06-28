import { AreaLayout } from "@/components/shell/area-layout";

export default function MeLayout({ children }: { children: React.ReactNode }) {
  return (
    <AreaLayout area="me" allowedRoles={["EMPLOYEE", "MANAGER", "HR_ADMIN"]}>
      {children}
    </AreaLayout>
  );
}
