"use client";

import { motion } from "motion/react";
import { useState } from "react";
import { Play } from "./Icons";
import { toEmbed } from "@/lib/video";
import type { ShowcaseItem } from "@/lib/types";

function ShortCard({ item, index }: { item: ShowcaseItem; index: number }) {
  const [playing, setPlaying] = useState(false);
  const embed = toEmbed(item.url);

  const anim = {
    initial: { opacity: 0, y: 60, rotate: index % 2 ? 3 : -3 },
    whileInView: { opacity: 1, y: 0, rotate: 0 },
    viewport: { once: true, margin: "-40px" },
    transition: { duration: 0.8, delay: (index % 4) * 0.08, ease: [0.2, 0.8, 0.2, 1] as const },
  };

  if (embed.kind === "link") {
    return (
      <motion.a {...anim} className="short" href={embed.src} target="_blank" rel="noopener noreferrer">
        <span className="play"><Play size={26} /></span>
        <div className="meta"><b>{item.title || "Watch"}</b></div>
      </motion.a>
    );
  }

  if (playing || embed.kind === "file") {
    return (
      <motion.div {...anim} className="short">
        {embed.kind === "file" ? (
          <video src={embed.src} controls={playing} autoPlay muted loop playsInline onClick={() => setPlaying(true)} />
        ) : (
          <iframe
            src={embed.src}
            title={item.title || "Short"}
            allow="autoplay; encrypted-media; picture-in-picture; clipboard-write"
            allowFullScreen
          />
        )}
      </motion.div>
    );
  }

  return (
    <motion.button {...anim} className="short" onClick={() => setPlaying(true)} aria-label={`Play ${item.title || "short"}`}>
      {embed.kind === "youtube" ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={embed.thumb} alt="" loading="lazy" />
      ) : (
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(120% 80% at 50% 0%, #2f2f2f, #0e0e0e)" }} />
      )}
      <span className="shade" />
      <span className="play"><Play size={26} /></span>
      <div className="meta">
        <span className="mono small" style={{ color: "#bbb" }}>{embed.kind === "youtube" ? "YouTube Shorts" : embed.kind === "tiktok" ? "TikTok" : "Reels"}</span>
        {item.title && <b>{item.title}</b>}
      </div>
    </motion.button>
  );
}

export default function Shorts({ items }: { items: ShowcaseItem[] }) {
  if (items.length === 0) {
    return (
      <div className="shorts">
        {Array.from({ length: 4 }).map((_, i) => (
          <motion.div
            key={i}
            className="short placeholder"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: i * 0.08 }}
          >
            <div className="ph">
              <motion.span animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}>
                <Play size={30} />
              </motion.span>
              New edit dropping soon
            </div>
          </motion.div>
        ))}
      </div>
    );
  }
  return (
    <div className="shorts">
      {items.map((item, i) => (
        <ShortCard key={item.id} item={item} index={i} />
      ))}
    </div>
  );
}
