// Turns a pasted Short / Reel / TikTok / video-file link into something we can embed.

export type Embed =
  | { kind: "youtube"; id: string; src: string; thumb: string }
  | { kind: "tiktok"; id: string; src: string }
  | { kind: "instagram"; id: string; src: string }
  | { kind: "file"; src: string }
  | { kind: "link"; src: string };

export function toEmbed(raw: string): Embed {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return { kind: "link", src: raw };
  }
  const host = url.hostname.replace(/^www\.|^m\./, "");

  if (host === "youtu.be" || host.endsWith("youtube.com")) {
    const id =
      host === "youtu.be"
        ? url.pathname.slice(1)
        : url.pathname.match(/^\/(?:shorts|embed|live)\/([\w-]{11})/)?.[1] ?? url.searchParams.get("v");
    if (id && /^[\w-]{11}$/.test(id)) {
      return {
        kind: "youtube",
        id,
        src: `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&playsinline=1&rel=0&modestbranding=1&loop=1&playlist=${id}`,
        thumb: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
      };
    }
  }
  if (host.endsWith("tiktok.com")) {
    const id = url.pathname.match(/\/video\/(\d+)/)?.[1];
    if (id) return { kind: "tiktok", id, src: `https://www.tiktok.com/embed/v2/${id}` };
  }
  if (host.endsWith("instagram.com")) {
    const id = url.pathname.match(/^\/(?:reel|reels|p)\/([\w-]+)/)?.[1];
    if (id) return { kind: "instagram", id, src: `https://www.instagram.com/reel/${id}/embed` };
  }
  if (/\.(mp4|webm|mov)$/i.test(url.pathname)) return { kind: "file", src: url.toString() };
  return { kind: "link", src: url.toString() };
}

/** Lesson videos: same parsing, plus Vimeo and Loom which courses often use. */
export function lessonEmbedSrc(raw: string): string | null {
  const e = toEmbed(raw);
  if (e.kind === "youtube") return `https://www.youtube-nocookie.com/embed/${e.id}?rel=0&modestbranding=1`;
  if (e.kind === "tiktok" || e.kind === "instagram") return e.src;
  try {
    const url = new URL(raw);
    const vimeo = url.hostname.endsWith("vimeo.com") && url.pathname.match(/\/(\d+)/)?.[1];
    if (vimeo) return `https://player.vimeo.com/video/${vimeo}`;
    const loom = url.hostname.endsWith("loom.com") && url.pathname.match(/\/share\/([\w]+)/)?.[1];
    if (loom) return `https://www.loom.com/embed/${loom}`;
  } catch {
    return null;
  }
  return null;
}
