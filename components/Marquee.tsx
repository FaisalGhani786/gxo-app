"use client";

import { motion } from "motion/react";

const WORDS = ["Premiere Pro", "CapCut", "Retention editing", "Motion text", "Sound design", "Colour", "Hooks that hold", "Client workflow"];

export default function Marquee() {
  const row = WORDS.map((w) => <span key={w}>{w}</span>);
  return (
    <div className="marquee" aria-hidden>
      <motion.div
        className="marquee-track"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
      >
        {row}
        {row.map((r, i) => <span key={i}>{WORDS[i]}</span>)}
      </motion.div>
    </div>
  );
}
