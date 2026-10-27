"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { useState } from "react";
import { money } from "@/lib/format";
import type { Package } from "@/lib/types";

export default function Pricing({ courses, mentoring }: { courses: Package[]; mentoring: Package[] }) {
  const [tab, setTab] = useState<"course" | "mentoring">("course");
  const list = tab === "course" ? courses : mentoring;

  return (
    <div className="stack" style={{ gap: 36 }}>
      <div className="row" style={{ justifyContent: "center" }}>
        <div className="pill-toggle" role="group" aria-label="Show">
          {(["course", "mentoring"] as const).map((t) => (
            <button key={t} aria-pressed={tab === t} onClick={() => setTab(t)}>
              {tab === t && <motion.span layoutId="pill" className="pill-bg" transition={{ type: "spring", bounce: 0.2, duration: 0.5 }} />}
              {t === "course" ? "Courses" : "1-1 Mentoring"}
            </button>
          ))}
        </div>
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          className="grid-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.35 }}
        >
          {list.map((p, i) => (
            <motion.article
              key={p.id}
              className={`card price-card${p.highlight ? " hot" : ""}`}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
            >
              {p.highlight && <span className={`badge ${p.highlight ? "inv" : ""}`}>Most popular</span>}
              <div className="stack" style={{ gap: 8 }}>
                <h3 className="h-md">{p.title}</h3>
                <p className="muted">{p.tagline}</p>
              </div>
              <div className="price">
                {money(p.price_pence, p.currency)}{" "}
                <small>
                  {p.kind === "course"
                    ? "one-off"
                    : p.sessions > 1
                      ? `${p.sessions} × ${p.duration_minutes} min`
                      : `${p.duration_minutes} min`}
                </small>
              </div>
              <ul className="checks">
                {p.features.map((f) => <li key={f}>{f}</li>)}
              </ul>
              <Link
                href={p.kind === "course" ? `/checkout/${p.slug}` : `/book?type=${p.slug}`}
                className={`btn block${p.highlight ? " light" : ""}`}
              >
                {p.kind === "course" ? "Enrol now" : "Pick a time"}
              </Link>
            </motion.article>
          ))}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
