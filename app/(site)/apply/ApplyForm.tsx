"use client";

import { useActionState } from "react";
import FormMessage from "@/components/FormMessage";
import SubmitButton from "@/components/SubmitButton";
import { applyToTeam } from "../commerce-actions";

export default function ApplyForm({ discord }: { discord: string }) {
  const [state, action] = useActionState(applyToTeam, undefined);
  return (
    <form action={action} className="form">
      <h2 className="h-md">Your application</h2>
      <label className="check">
        <input type="checkbox" name="uses_premiere" required />
        <span><b>I use Adobe Premiere Pro</b><br /><span className="muted small">Required for team work.</span></span>
      </label>
      <label className="check">
        <input type="checkbox" name="uses_capcut" required />
        <span><b>I can use CapCut</b><br /><span className="muted small">Required for finishing and templates.</span></span>
      </label>
      <div className="field">
        <label htmlFor="portfolio_url">Portfolio or best edits (link)</label>
        <input id="portfolio_url" name="portfolio_url" type="url" className="input" required placeholder="https://…" />
      </div>
      <div className="field">
        <label htmlFor="discord_username">Discord username</label>
        <input id="discord_username" name="discord_username" className="input" required defaultValue={discord} />
      </div>
      <div className="field">
        <label htmlFor="experience">Tell us about your editing</label>
        <textarea id="experience" name="experience" className="textarea" maxLength={3000} placeholder="How long you've been editing, who for, turnaround times…" />
      </div>
      <FormMessage state={state} />
      <SubmitButton pendingText="Sending…">Send application</SubmitButton>
    </form>
  );
}
