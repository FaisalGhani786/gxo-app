"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";

// A one-per-visit "action edit" that plays over the landing page:
// countdown leader → rapid action cuts → timeline + razor → logo slam → split reveal.
// An inline script (below) hides it before first paint for repeat visits and
// reduced-motion users, so it never flashes.

const SEEN_KEY = "gxo-intro-seen";
const WORDS = ["CUT", "ZOOM", "SHAKE", "SFX", "DROP"];
const LINES = Array.from({ length: 28 }, (_, i) => {
  const a = (i / 28) * Math.PI * 2;
  const inner = 120 + (i % 3) * 40;
  return { x1: Math.cos(a) * inner, y1: Math.sin(a) * inner, x2: Math.cos(a) * 900, y2: Math.sin(a) * 900, w: 2 + (i % 4) };
});
const CLIPS = [
  { l: 0, w: 17 },
  { l: 18, w: 11 },
  { l: 30, w: 21 },
  { l: 52, w: 9 },
  { l: 62, w: 16 },
  { l: 79, w: 21 },
];

type Phase = "count" | "action" | "timeline" | "logo" | "exit" | "done";

const HIDE_SCRIPT = `try{if(sessionStorage.getItem("${SEEN_KEY}")||matchMedia("(prefers-reduced-motion: reduce)").matches)document.documentElement.dataset.intro="skip"}catch(e){}`;

function Timecode() {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const start = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const frames = Math.floor(((t - start) / 1000) * 60);
      const ff = String(frames % 60).padStart(2, "0");
      const ss = String(Math.floor(frames / 60) % 60).padStart(2, "0");
      if (ref.current) ref.current.textContent = `00:00:${ss}:${ff}`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  return <span ref={ref}>00:00:00:00</span>;
}

export default function Intro() {
  const [phase, setPhase] = useState<Phase>("count");
  const [count, setCount] = useState(3);
  const [word, setWord] = useState(0);
  const timers = useRef<number[]>([]);

  const finish = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    try {
      sessionStorage.setItem(SEEN_KEY, "1");
    } catch {}
    document.documentElement.dataset.intro = "skip";
    document.body.style.overflow = "";
    window.dispatchEvent(new Event("gxo:intro-done"));
    setPhase("done");
  }, []);

  const skip = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setPhase("exit");
    timers.current.push(window.setTimeout(finish, 650));
  }, [finish]);

  useEffect(() => {
    // Already seen this visit (or reduced motion): the inline script hid us with CSS.
    if (document.documentElement.dataset.intro === "skip") return;
    document.body.style.overflow = "hidden";
    document.documentElement.dataset.intro = "playing";
    const at = (ms: number, fn: () => void) => timers.current.push(window.setTimeout(fn, ms));
    at(330, () => setCount(2));
    at(660, () => setCount(1));
    at(1000, () => setPhase("action"));
    WORDS.forEach((_, i) => i > 0 && at(1000 + i * 230, () => setWord(i)));
    at(2150, () => setPhase("timeline"));
    at(2950, () => setPhase("logo"));
    at(3750, () => setPhase("exit"));
    at(4400, finish);

    const onKey = (e: KeyboardEvent) => e.key === "Escape" && skip();
    window.addEventListener("keydown", onKey);
    const pending = timers.current;
    return () => {
      pending.forEach(clearTimeout);
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [finish, skip]);

  if (phase === "done") return null;
  const exiting = phase === "exit";

  return (
    <div className="intro" onClick={skip}>
      {/* Runs during HTML parsing on hard loads; inert ("text/plain") when React renders it in the browser. */}
      <script
        type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: HIDE_SCRIPT }}
      />

      {/* The two halves the razor splits apart at the end. */}
      <motion.div className="intro-panel top" animate={exiting ? { y: "-100%" } : { y: 0 }} transition={{ duration: 0.6, ease: [0.7, 0, 0.2, 1] }} />
      <motion.div className="intro-panel bottom" animate={exiting ? { y: "100%" } : { y: 0 }} transition={{ duration: 0.6, ease: [0.7, 0, 0.2, 1] }} />
      {exiting && (
        <motion.div
          className="intro-slit"
          initial={{ scaleX: 0, opacity: 1 }}
          animate={{ scaleX: 1, opacity: [1, 1, 0] }}
          transition={{ duration: 0.45, ease: "easeOut" }}
        />
      )}

      <motion.div className="intro-stage" aria-hidden animate={{ opacity: exiting ? 0 : 1 }} transition={{ duration: 0.15 }}>
        {/* Letterbox bars */}
        <motion.div className="intro-bar top" initial={{ y: "-100%" }} animate={{ y: 0 }} transition={{ duration: 0.4, ease: "easeOut" }} />
        <motion.div className="intro-bar bottom" initial={{ y: "100%" }} animate={{ y: 0 }} transition={{ duration: 0.4, ease: "easeOut" }} />

        {/* Viewfinder HUD */}
        <div className="intro-hud">
          <span className="rec"><motion.i animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 0.8, repeat: Infinity }} /> REC</span>
          <span>4K · 60FPS · SHUTTER 1/120</span>
          <Timecode />
        </div>
        <div className="intro-corners"><i /><i /><i /><i /></div>

        <AnimatePresence mode="popLayout">
          {phase === "count" && (
            <motion.div key="count" className="intro-center" exit={{ opacity: 0, scale: 1.4 }} transition={{ duration: 0.15 }}>
              <div className="intro-leader">
                <motion.div className="sweep" animate={{ rotate: 360 }} transition={{ duration: 0.33, repeat: Infinity, ease: "linear" }} />
                <div className="ring" />
                <div className="cross" />
                <AnimatePresence mode="popLayout">
                  <motion.b key={count} initial={{ scale: 1.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.6, opacity: 0 }} transition={{ duration: 0.16 }}>
                    {count}
                  </motion.b>
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {phase === "action" && (
            <motion.div
              key={`w${word}`}
              className={`intro-center intro-cut${word % 2 ? " inv" : ""}`}
              initial={{ scale: 1.35, x: 0, y: 0 }}
              animate={{ scale: 1, x: [0, -18, 14, -8, 5, 0], y: [0, 10, -12, 6, -3, 0] }}
              transition={{ duration: 0.22, ease: "easeOut" }}
            >
              <svg className="intro-speed" viewBox="-900 -900 1800 1800" preserveAspectRatio="xMidYMid slice">
                <motion.g initial={{ scale: 0.4, opacity: 1 }} animate={{ scale: 1.5, opacity: 0 }} transition={{ duration: 0.3, ease: "easeOut" }}>
                  {LINES.map((l, i) => (
                    <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} strokeWidth={l.w} />
                  ))}
                </motion.g>
              </svg>
              <b className="intro-word" data-text={WORDS[word]}>{WORDS[word]}</b>
            </motion.div>
          )}

          {phase === "timeline" && (
            <motion.div key="tl" className="intro-center" exit={{ opacity: 0 }} transition={{ duration: 0.1 }}>
              <div className="intro-timeline">
                <div className="intro-track">
                  {CLIPS.map((c, i) => (
                    <motion.div
                      key={i}
                      className="clip"
                      style={{ left: `${c.l}%`, width: `${c.w}%` }}
                      initial={{ x: i % 2 ? 260 : -260, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 520, damping: 26, delay: i * 0.05 }}
                    />
                  ))}
                </div>
                <div className="intro-track audio">
                  <motion.div className="wave" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.4, delay: 0.1 }} />
                </div>
                <motion.div className="intro-playhead" initial={{ left: "0%" }} animate={{ left: "100%" }} transition={{ duration: 0.65, ease: [0.6, 0, 0.3, 1] }} />
              </div>
              <motion.span className="intro-caption" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                ✂ RAZOR · RIPPLE DELETE · RENDER
              </motion.span>
            </motion.div>
          )}

          {phase === "logo" && (
            <motion.div
              key="logo"
              className="intro-center"
              initial={{ x: 0 }}
              animate={{ x: [0, -14, 10, -5, 0], y: [0, 8, -6, 3, 0] }}
              transition={{ duration: 0.3, delay: 0.12 }}
            >
              <motion.div className="intro-flash" initial={{ opacity: 0.9 }} animate={{ opacity: 0 }} transition={{ duration: 0.4, delay: 0.1 }} />
              <motion.b
                className="intro-logo"
                initial={{ scale: 2.6, opacity: 0, filter: "blur(18px)" }}
                animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
                transition={{ duration: 0.22, ease: [0.2, 0.9, 0.2, 1] }}
              >
                gxoeditz!
              </motion.b>
              <motion.span className="intro-caption" initial={{ opacity: 0, letterSpacing: "0.6em" }} animate={{ opacity: 1, letterSpacing: "0.25em" }} transition={{ delay: 0.3, duration: 0.4 }}>
                SHORT-FORM THAT HITS
              </motion.span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {!exiting && (
        <button
          className="intro-skip"
          onClick={(e) => {
            e.stopPropagation();
            skip();
          }}
        >
          Skip intro
        </button>
      )}
    </div>
  );
}
