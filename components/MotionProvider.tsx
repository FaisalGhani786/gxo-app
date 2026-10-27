"use client";

import { MotionConfig } from "motion/react";

// Honour the visitor's "reduce motion" setting everywhere.
export default function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
