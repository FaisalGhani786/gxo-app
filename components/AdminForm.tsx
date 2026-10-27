"use client";

import { useActionState } from "react";
import FormMessage from "./FormMessage";
import type { ActionState } from "@/lib/types";

/** A form bound to an admin server action that shows its error/success inline. */
export default function AdminForm({
  action,
  children,
  className = "form",
  style,
  confirm: confirmText,
  quiet = false,
}: {
  action: (form: FormData) => Promise<ActionState>;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  confirm?: string;
  /** Only show errors, not "Saved." (for one-click buttons in tables). */
  quiet?: boolean;
}) {
  const [state, formAction] = useActionState((_: ActionState, form: FormData) => action(form), undefined);
  return (
    <form
      action={formAction}
      className={className}
      style={style}
      onSubmit={(e) => {
        if (confirmText && !window.confirm(confirmText)) e.preventDefault();
      }}
    >
      {children}
      {quiet ? state?.error && <FormMessage state={state} /> : <FormMessage state={state} />}
    </form>
  );
}
