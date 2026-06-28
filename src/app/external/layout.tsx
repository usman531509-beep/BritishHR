import { AreaLayout } from "@/components/shell/area-layout";

export default function ExternalLayout({ children }: { children: React.ReactNode }) {
  return (
    <AreaLayout area="external" allowedRoles={["EXTERNAL", "HR_ADMIN"]}>
      {children}
    </AreaLayout>
  );
}
