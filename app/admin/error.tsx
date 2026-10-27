"use client";

export default function AdminError({ error, retry }: { error: Error; retry: () => void }) {
  return (
    <div className="stack" style={{ maxWidth: 560 }}>
      <div className="alert error">{error.message || "Something went wrong."}</div>
      <button className="btn ghost" onClick={() => retry()}>Try again</button>
    </div>
  );
}
