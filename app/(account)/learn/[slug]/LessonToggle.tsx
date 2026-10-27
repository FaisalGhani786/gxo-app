"use client";

import { useOptimistic, useTransition } from "react";
import { setLessonDone } from "../../actions";

export default function LessonToggle({ lessonId, done, slug }: { lessonId: string; done: boolean; slug: string }) {
  const [optimistic, setOptimistic] = useOptimistic(done);
  const [pending, start] = useTransition();
  return (
    <button
      className={`btn${optimistic ? " ghost" : ""}`}
      disabled={pending}
      onClick={() =>
        start(async () => {
          setOptimistic(!optimistic);
          await setLessonDone(lessonId, !optimistic, slug);
        })
      }
    >
      {optimistic ? "✓ Completed" : "Mark as complete"}
    </button>
  );
}
