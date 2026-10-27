import type { Metadata } from "next";
import { requireUser } from "@/lib/supabase/server";
import ProfileForm from "./ProfileForm";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const { profile } = await requireUser("/dashboard/profile");
  return (
    <div style={{ maxWidth: 560 }}>
      <div className="page-head"><h1>Profile</h1></div>
      <div className="card"><ProfileForm profile={profile} /></div>
    </div>
  );
}
