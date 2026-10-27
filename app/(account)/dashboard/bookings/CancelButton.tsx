"use client";

import { useTransition } from "react";
import { cancelBooking } from "../../actions";

export default function CancelButton({ id }: { id: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      className="btn danger sm"
      disabled={pending}
      onClick={() => {
        if (!confirm("Cancel this session request?")) return;
        start(async () => {
          const res = await cancelBooking(id);
          if (res?.error) alert(res.error);
        });
      }}
    >
      {pending ? "Cancelling…" : "Cancel"}
    </button>
  );
}
