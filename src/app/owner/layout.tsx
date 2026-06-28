import { AreaLayout } from "@/components/shell/area-layout";

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  return (
    <AreaLayout area="owner" allowedRoles={["PLATFORM_OWNER"]}>
      {children}
    </AreaLayout>
  );
}
