import { AreaLayout } from "@/components/shell/area-layout";

export default function ManagerLayout({ children }: { children: React.ReactNode }) {
  return (
    <AreaLayout area="manager" allowedRoles={["MANAGER", "HR_ADMIN"]}>
      {children}
    </AreaLayout>
  );
}
