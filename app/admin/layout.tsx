import type { Metadata } from "next";
import SideNav from "@/components/SideNav";
import { requireAdmin } from "@/lib/supabase/server";

export const metadata: Metadata = { title: { default: "Admin", template: "%s · Admin · gxoeditz!" } };

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  await requireAdmin();
  return (
    <div className="app-shell">
      <SideNav
        items={[
          { section: "Admin" },
          { href: "/admin", label: "Overview" },
          { href: "/admin/clients", label: "Clients" },
          { href: "/admin/bookings", label: "Bookings" },
          { href: "/admin/orders", label: "Orders" },
          { href: "/admin/packages", label: "Packages & courses" },
          { href: "/admin/applications", label: "Team applications" },
          { href: "/admin/showcase", label: "Showcase shorts" },
          { href: "/admin/settings", label: "Settings" },
          { section: "Me" },
          { href: "/dashboard", label: "My dashboard" },
        ]}
      />
      <main className="app-main">{children}</main>
    </div>
  );
}
