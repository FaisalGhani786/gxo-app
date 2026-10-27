"use client";

import { useActionState } from "react";
import FormMessage from "@/components/FormMessage";
import SubmitButton from "@/components/SubmitButton";
import type { ActionState } from "@/lib/types";

type Field = { name: string; label: string; type?: string; autoComplete?: string; required?: boolean; placeholder?: string };

export default function AuthForm({
  action,
  fields,
  submit,
  next,
}: {
  action: (state: ActionState, form: FormData) => Promise<ActionState>;
  fields: Field[];
  submit: string;
  next?: string;
}) {
  const [state, formAction] = useActionState(action, undefined);
  if (state?.ok) return <FormMessage state={state} />;
  return (
    <form action={formAction} className="form">
      {next && <input type="hidden" name="next" value={next} />}
      {fields.map((f) => (
        <div className="field" key={f.name}>
          <label htmlFor={f.name}>{f.label}</label>
          <input
            id={f.name}
            name={f.name}
            className="input"
            type={f.type ?? "text"}
            autoComplete={f.autoComplete}
            required={f.required ?? true}
            placeholder={f.placeholder}
          />
        </div>
      ))}
      <FormMessage state={state} />
      <SubmitButton className="btn block">{submit}</SubmitButton>
    </form>
  );
}
