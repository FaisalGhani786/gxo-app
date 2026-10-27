"use client";

import Link from "next/link";
import { useActionState } from "react";
import FormMessage from "@/components/FormMessage";
import SubmitButton from "@/components/SubmitButton";
import type { Profile } from "@/lib/types";
import { updateProfile } from "../../actions";

export default function ProfileForm({ profile }: { profile: Profile }) {
  const [state, action] = useActionState(updateProfile, undefined);
  return (
    <form action={action} className="form">
      <div className="field"><label>Email</label><input className="input" value={profile.email} disabled /></div>
      <div className="field"><label htmlFor="full_name">Full name</label><input id="full_name" name="full_name" className="input" defaultValue={profile.full_name ?? ""} /></div>
      <div className="field"><label htmlFor="phone">WhatsApp number</label><input id="phone" name="phone" type="tel" className="input" defaultValue={profile.phone ?? ""} /></div>
      <div className="field"><label htmlFor="discord_username">Discord username</label><input id="discord_username" name="discord_username" className="input" defaultValue={profile.discord_username ?? ""} /></div>
      <FormMessage state={state} />
      <div className="spread">
        <SubmitButton pendingText="Saving…">Save</SubmitButton>
        <Link href="/forgot" className="link small muted">Change password</Link>
      </div>
    </form>
  );
}
