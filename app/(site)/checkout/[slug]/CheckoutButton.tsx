"use client";

import { useActionState } from "react";
import FormMessage from "@/components/FormMessage";
import SubmitButton from "@/components/SubmitButton";
import { startCourseCheckout } from "../../commerce-actions";

export default function CheckoutButton({ slug, label }: { slug: string; label: string }) {
  const [state, action] = useActionState(() => startCourseCheckout(slug), undefined);
  return (
    <form action={action} className="stack">
      <FormMessage state={state} />
      <SubmitButton className="btn block" pendingText="Opening checkout…">{label}</SubmitButton>
    </form>
  );
}
