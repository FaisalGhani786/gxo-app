import type { Metadata } from "next";
import Link from "next/link";
import { forgotPassword } from "../auth-actions";
import AuthForm from "../AuthForm";

export const metadata: Metadata = { title: "Reset password" };

export default function ForgotPage() {
  return (
    <div className="auth">
      <div className="card stack" style={{ gap: 24 }}>
        <div className="stack" style={{ gap: 8 }}>
          <h1 className="h-md">Reset your password</h1>
          <p className="muted">We&apos;ll email you a link to choose a new one.</p>
        </div>
        <AuthForm
          action={forgotPassword}
          submit="Send reset link"
          fields={[{ name: "email", label: "Email", type: "email", autoComplete: "email" }]}
        />
        <Link href="/login" className="small link muted">Back to log in</Link>
      </div>
    </div>
  );
}
