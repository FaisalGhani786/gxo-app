import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/supabase/server";
import { resetPassword } from "../auth-actions";
import AuthForm from "../AuthForm";

export const metadata: Metadata = { title: "Choose a new password" };

export default async function ResetPage() {
  const { user } = await getSession();
  if (!user) redirect("/forgot");
  return (
    <div className="auth">
      <div className="card stack" style={{ gap: 24 }}>
        <h1 className="h-md">Choose a new password</h1>
        <AuthForm
          action={resetPassword}
          submit="Save password"
          fields={[{ name: "password", label: "New password", type: "password", autoComplete: "new-password" }]}
        />
      </div>
    </div>
  );
}
