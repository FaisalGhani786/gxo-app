import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import FormMessage from "@/components/FormMessage";
import { money } from "@/lib/format";
import { stripeEnabled } from "@/lib/stripe";
import { requireUser } from "@/lib/supabase/server";
import type { Package } from "@/lib/types";
import CheckoutButton from "./CheckoutButton";

export const metadata: Metadata = { title: "Checkout" };

export default async function CheckoutPage({ params }: PageProps<"/checkout/[slug]">) {
  const { slug } = await params;
  const { supabase, user } = await requireUser(`/checkout/${slug}`);
  const { data: pkg } = await supabase
    .from("packages")
    .select("*")
    .eq("slug", slug)
    .eq("kind", "course")
    .maybeSingle<Package>();
  if (!pkg) notFound();

  const { data: enrolment } = await supabase
    .from("enrolments")
    .select("id")
    .eq("user_id", user.id)
    .eq("package_id", pkg.id)
    .maybeSingle();

  return (
    <div className="wrap section" style={{ maxWidth: 760 }}>
      <div className="stack" style={{ gap: 28 }}>
        <span className="eyebrow">Checkout</span>
        <div className="card stack" style={{ gap: 20 }}>
          <div className="spread">
            <h1 className="h-md">{pkg.title}</h1>
            <span className="price">{money(pkg.price_pence, pkg.currency)}</span>
          </div>
          <p className="muted">{pkg.description}</p>
          <ul className="checks">{pkg.features.map((f) => <li key={f}>{f}</li>)}</ul>
          {enrolment ? (
            <>
              <FormMessage state={{ ok: "You already own this course." }} />
              <Link href={`/learn/${pkg.slug}`} className="btn block">Go to the course</Link>
            </>
          ) : (
            <>
              <CheckoutButton slug={pkg.slug} label={stripeEnabled() ? `Pay ${money(pkg.price_pence, pkg.currency)}` : "Reserve my place"} />
              <p className="small muted center">
                {stripeEnabled()
                  ? "Secure card payment via Stripe. Access unlocks instantly."
                  : "We'll send payment details by email or WhatsApp. Access unlocks as soon as payment is confirmed."}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
