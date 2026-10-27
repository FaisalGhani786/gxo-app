import type { Metadata } from "next";
import Link from "next/link";
import { safeNext } from "@/lib/safe-next";
import { signup } from "../auth-actions";
import AuthForm from "../AuthForm";

export const metadata: Metadata = { title: "Create your account" };

export default async function SignupPage({ searchParams }: PageProps<"/signup">) {
  const sp = await searchParams;
  const next = safeNext(sp.next);
  return (
    <div className="auth">
      <div className="card stack" style={{ gap: 24 }}>
        <div className="stack" style={{ gap: 8 }}>
          <h1 className="h-md">Create your account</h1>
          <p className="muted">One account for courses, 1-1 bookings and team applications.</p>
        </div>
        <AuthForm
          action={signup}
          next={next}
          submit="Create account"
          fields={[
            { name: "full_name", label: "Full name", autoComplete: "name" },
            { name: "email", label: "Email", type: "email", autoComplete: "email" },
            { name: "phone", label: "WhatsApp number (optional)", type: "tel", autoComplete: "tel", required: false, placeholder: "+44 7…" },
            { name: "password", label: "Password", type: "password", autoComplete: "new-password", placeholder: "At least 8 characters" },
          ]}
        />
        <p className="small muted">
          Already have an account? <Link href={`/login?next=${encodeURIComponent(next)}`} className="link">Log in</Link>
        </p>
      </div>
    </div>
  );
}
