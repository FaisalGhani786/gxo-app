"use client";

import { usePathname } from "next/navigation";
import Intro from "./Intro";

/** Mounts the intro first in <body> on the landing page only, so it covers the very first paint. */
export default function IntroGate() {
  return usePathname() === "/" ? <Intro /> : null;
}
