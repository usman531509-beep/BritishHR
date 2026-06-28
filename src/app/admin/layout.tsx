import { AreaLayout } from "@/components/shell/area-layout";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AreaLayout area="admin" allowedRoles={["HR_ADMIN"]}>
      {children}
    </AreaLayout>
  );
}
