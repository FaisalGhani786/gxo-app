import type { Metadata } from "next";
import Link from "next/link";
import { safeNext } from "@/lib/safe-next";
import { login } from "../auth-actions";
import AuthForm from "../AuthForm";

export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const sp = await searchParams;
  const next = safeNext(sp.next);
  const error = typeof sp.error === "string" ? sp.error : null;
  return (
    <div className="auth">
      <div className="card stack" style={{ gap: 24 }}>
        <div className="stack" style={{ gap: 8 }}>
          <h1 className="h-md">Welcome back</h1>
          <p className="muted">Log in to your courses, bookings and Discord access.</p>
        </div>
        {error && <div className="alert error">{error}</div>}
        <AuthForm
          action={login}
          next={next}
          submit="Log in"
          fields={[
            { name: "email", label: "Email", type: "email", autoComplete: "email" },
            { name: "password", label: "Password", type: "password", autoComplete: "current-password" },
          ]}
        />
        <div className="spread small">
          <Link href="/forgot" className="link muted">Forgot password?</Link>
          <span className="muted">New here? <Link href={`/signup?next=${encodeURIComponent(next)}`} className="link">Create an account</Link></span>
        </div>
      </div>
    </div>
  );
}
