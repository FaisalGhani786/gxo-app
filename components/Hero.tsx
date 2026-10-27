"use client";

import Link from "next/link";
import { motion, useScroll, useTransform, type MotionValue } from "motion/react";
import { Film, Layers, Play, Scissors, Sparkle, Type, Wave, WhatsApp } from "./Icons";

const TITLE = "gxoeditz!".split("");

// Floating "app tiles" like the brand banner, each drifting at its own pace
// and parallaxing as the page scrolls.
const TILES = [
  { Icon: Scissors, x: "6%", y: "14%", s: 116, r: -14, d: 0, depth: 120 },
  { Icon: Play, x: "84%", y: "10%", s: 104, r: 12, d: 0.6, depth: 180 },
  { Icon: Wave, x: "14%", y: "66%", s: 92, r: 18, d: 1.2, depth: 90 },
  { Icon: Layers, x: "78%", y: "62%", s: 124, r: -10, d: 0.3, depth: 150 },
  { Icon: Type, x: "34%", y: "4%", s: 72, r: 8, d: 0.9, depth: 60 },
  { Icon: Film, x: "62%", y: "2%", s: 80, r: -18, d: 1.5, depth: 100 },
  { Icon: Sparkle, x: "92%", y: "40%", s: 70, r: 20, d: 1.8, depth: 70 },
];

function Tile({ t, scroll }: { t: (typeof TILES)[number]; scroll: MotionValue<number> }) {
  const y = useTransform(scroll, [0, 1], [0, -t.depth]);
  return (
    <motion.div
      className="tile"
      style={{ left: t.x, top: t.y, ["--s" as string]: `${t.s}px`, y }}
      initial={{ opacity: 0, scale: 0.6, rotate: t.r * 2 }}
      animate={{ opacity: 0.75, scale: 1, rotate: t.r }}
      transition={{ duration: 1, delay: 0.2 + t.d * 0.25, ease: [0.2, 0.8, 0.2, 1] }}
    >
      <motion.div
        animate={{ y: [0, -12, 0], rotate: [0, 4, 0] }}
        transition={{ duration: 6 + t.d * 2, repeat: Infinity, ease: "easeInOut", delay: t.d }}
        style={{ display: "grid", placeItems: "center", width: "100%", height: "100%" }}
      >
        <t.Icon />
      </motion.div>
    </motion.div>
  );
}

/** A tiny editing timeline whose playhead sweeps across the clips. */
function Timeline() {
  return (
    <motion.div
      className="timeline"
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.9, delay: 0.9, ease: [0.2, 0.8, 0.2, 1] }}
      aria-hidden
    >
      <div className="tl-top">
        <span className="rec">● REC</span>
        <span>SEQ_01 · 1080×1920 · 30fps</span>
        <span>00:00:59:29</span>
      </div>
      <div className="track">
        {[
          [0, 22, "HOOK"],
          [23, 30, "WATCH THIS"],
          [55, 18, "WAIT…"],
          [75, 24, "FOLLOW ✦"],
        ].map(([l, w, label], i) => (
          <motion.div
            key={i}
            className="clip t"
            style={{ left: `${l}%`, width: `${w}%` }}
            initial={{ scaleX: 0, originX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.6, delay: 1.1 + i * 0.12 }}
          >
            {label}
          </motion.div>
        ))}
      </div>
      <div className="track">
        {[
          [0, 14],
          [15, 19],
          [35, 11],
          [47, 23],
          [71, 12],
          [84, 16],
        ].map(([l, w], i) => (
          <motion.div
            key={i}
            className="clip v"
            style={{ left: `${l}%`, width: `${w}%` }}
            initial={{ scaleX: 0, originX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.5, delay: 1.2 + i * 0.08 }}
          />
        ))}
      </div>
      <div className="track">
        <div className="clip a" style={{ left: 0, width: "100%" }} />
      </div>
      <motion.div
        className="playhead"
        initial={{ left: "1%" }}
        animate={{ left: ["1%", "99%"] }}
        transition={{ duration: 7, repeat: Infinity, ease: "linear", delay: 1.6 }}
      />
    </motion.div>
  );
}

export default function Hero({ whatsapp }: { whatsapp: string }) {
  const { scrollYProgress } = useScroll();
  const titleScale = useTransform(scrollYProgress, [0, 0.25], [1, 0.92]);

  return (
    <section className="hero">
      <div className="hero-tiles">
        {TILES.map((t, i) => (
          <Tile key={i} t={t} scroll={scrollYProgress} />
        ))}
      </div>
      <div className="wrap hero-inner">
        <motion.span
          className="eyebrow"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className="dot" /> Short-form editor · Premiere Pro &amp; CapCut
        </motion.span>
        <motion.h1 className="h-xl hero-title" style={{ scale: titleScale }} aria-label="gxoeditz!">
          {TITLE.map((ch, i) => (
            <motion.span
              key={i}
              aria-hidden
              initial={{ y: "60%", opacity: 0, filter: "blur(12px)" }}
              animate={{ y: "0%", opacity: 1, filter: "blur(0px)" }}
              transition={{ duration: 0.8, delay: 0.15 + i * 0.05, ease: [0.2, 0.8, 0.2, 1] }}
            >
              {ch}
            </motion.span>
          ))}
        </motion.h1>
        <motion.p
          className="lead"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.6 }}
        >
          I edit scroll-stopping shorts for creators — and teach you exactly how I do it.
          Courses, 1-1 mentoring and a team you can grow into.
        </motion.p>
        <motion.div
          className="row"
          style={{ justifyContent: "center" }}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.75 }}
        >
          <Link href="/#courses" className="btn">Get the course</Link>
          <Link href="/book" className="btn ghost">Book a 1-1</Link>
          <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="btn ghost" aria-label="Message on WhatsApp">
            <WhatsApp size={18} /> WhatsApp
          </a>
        </motion.div>
        <Timeline />
      </div>
    </section>
  );
}
