import type { ActionState } from "@/lib/types";

export default function FormMessage({ state }: { state: ActionState }) {
  if (state?.error) return <div className="alert error" role="alert">{state.error}</div>;
  if (state?.ok) return <div className="alert ok" role="status">{state.ok}</div>;
  return null;
}
