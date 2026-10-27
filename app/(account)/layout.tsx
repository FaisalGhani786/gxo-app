import SideNav from "@/components/SideNav";
import { requireUser } from "@/lib/supabase/server";

export default async function AccountLayout({ children }: LayoutProps<"/">) {
  const { profile } = await requireUser();
  return (
    <div className="app-shell">
      <SideNav
        items={[
          { section: "Your account" },
          { href: "/dashboard", label: "Overview" },
          { href: "/dashboard/bookings", label: "1-1 sessions" },
          { href: "/dashboard/orders", label: "Orders" },
          { href: "/dashboard/profile", label: "Profile" },
          ...(profile.is_admin ? [{ section: "Admin" }, { href: "/admin", label: "Admin dashboard" }] : []),
        ]}
      />
      <main className="app-main">{children}</main>
    </div>
  );
}
