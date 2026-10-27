"use client";

import { useActionState } from "react";
import FormMessage from "@/components/FormMessage";
import SubmitButton from "@/components/SubmitButton";
import { payOrder } from "../../commerce-actions";

export default function PayButton({ orderId, label }: { orderId: string; label: string }) {
  const [state, action] = useActionState(() => payOrder(orderId), undefined);
  return (
    <form action={action} className="stack">
      <FormMessage state={state} />
      <SubmitButton className="btn block" pendingText="Opening checkout…">{label}</SubmitButton>
    </form>
  );
}
