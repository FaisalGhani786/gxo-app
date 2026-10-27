"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { Plus } from "./Icons";

export default function Faq({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="faq">
      {items.map((it, i) => (
        <div className="faq-item" key={i} data-open={open === i}>
          <button aria-expanded={open === i} onClick={() => setOpen(open === i ? null : i)}>
            {it.q}
            <span className="plus"><Plus size={16} /></span>
          </button>
          <AnimatePresence initial={false}>
            {open === i && (
              <motion.div
                className="answer"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
              >
                <p>{it.a}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}
