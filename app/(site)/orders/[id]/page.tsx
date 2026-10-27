import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Mail, WhatsApp } from "@/components/Icons";
import { dateTime, money } from "@/lib/format";
import { fulfilFromCheckoutSession } from "@/lib/fulfil";
import { mailtoLink, whatsappLink } from "@/lib/links";
import { getSettings } from "@/lib/site";
import { stripeEnabled } from "@/lib/stripe";
import { requireUser } from "@/lib/supabase/server";
import type { Booking, Order, Package } from "@/lib/types";
import PayButton from "./PayButton";

export const metadata: Metadata = { title: "Your order" };

type Row = Order & { package: Package; booking: Booking | null };

const STATUS: Record<string, [string, string]> = {
  pending: ["warn", "Awaiting payment"],
  paid: ["ok", "Paid"],
  cancelled: ["bad", "Cancelled"],
  refunded: ["bad", "Refunded"],
};

export default async function OrderPage({ params, searchParams }: PageProps<"/orders/[id]">) {
  const { id } = await params;
  const sp = await searchParams;
  const { supabase, profile } = await requireUser(`/orders/${id}`);

  // Returning from Stripe: confirm with Stripe directly so access unlocks even
  // if the webhook hasn't arrived yet.
  if (typeof sp.session_id === "string") {
    await fulfilFromCheckoutSession(sp.session_id, id).catch(() => false);
  }

  const [{ data: order }, settings] = await Promise.all([
    supabase.from("orders").select("*, package:packages(*), booking:bookings(*)").eq("id", id).maybeSingle<Row>(),
    getSettings(),
  ]);
  if (!order) notFound();

  const ref = order.id.slice(0, 8).toUpperCase();
  const when = order.booking ? dateTime(order.booking.starts_at, settings.timezone) : null;
  const summary = [
    `Order ref: ${ref}`,
    `Name: ${profile.full_name ?? ""}`,
    `Email: ${profile.email}`,
    `Package: ${order.package.title} (${money(order.amount_pence, order.currency)})`,
    when ? `Requested time: ${when} (UK time)` : null,
    order.booking?.notes ? `Notes: ${order.booking.notes}` : null,
  ]
    .filter(Boolean)
    .join("\n");
  const subject = order.booking ? `1-1 booking request — ${order.package.title} — ${when}` : `Course order ${ref} — ${order.package.title}`;
  const [tone, label] = STATUS[order.status];

  return (
    <div className="wrap section" style={{ maxWidth: 760 }}>
      <div className="stack" style={{ gap: 24 }}>
        {sp.booked === "1" && <div className="alert ok">Your slot is held. Pay below to secure it, then send gxo the details.</div>}
        {sp.cancelled === "1" && <div className="alert info">Payment was cancelled — you can try again any time.</div>}

        <div className="card stack" style={{ gap: 20 }}>
          <div className="spread">
            <span className="eyebrow mono">Order {ref}</span>
            <span className={`badge ${tone}`}>{label}</span>
          </div>
          <div className="spread">
            <h1 className="h-md">{order.package.title}</h1>
            <span className="price">{money(order.amount_pence, order.currency)}</span>
          </div>
          {order.booking && (
            <div className="card soft stack" style={{ gap: 6, padding: 20 }}>
              <b>{when} · UK time</b>
              <span className="muted small">
                {order.package.duration_minutes}-minute 1-1 call · booking {order.booking.status}
                {order.booking.meeting_link && (
                  <> · <a className="link" href={order.booking.meeting_link} target="_blank" rel="noopener noreferrer">Join call</a></>
                )}
              </span>
            </div>
          )}

          {order.status === "pending" &&
            (stripeEnabled() ? (
              <PayButton orderId={order.id} label={`Pay ${money(order.amount_pence, order.currency)} securely`} />
            ) : (
              <div className="alert info">
                Online card payments aren&apos;t switched on yet. Send gxo your order details below and you&apos;ll get
                payment instructions — your access unlocks as soon as it&apos;s confirmed.
              </div>
            ))}

          {order.status === "paid" && order.package.kind === "course" && (
            <Link href={`/learn/${order.package.slug}`} className="btn block">Start learning</Link>
          )}
          {order.status === "paid" && order.booking && (
            <div className="alert ok">Paid — gxo will confirm your session and send a call link.</div>
          )}
        </div>

        <div className="card stack" style={{ gap: 14 }}>
          <h2 style={{ fontSize: 22 }}>Send gxo the details</h2>
          <p className="muted small">Opens your email app or WhatsApp with everything pre-filled.</p>
          <div className="row">
            <a className="btn" href={mailtoLink(settings.editor_email, subject, `Hi gxo,\n\n${summary}\n\nThanks!`)}>
              <Mail size={18} /> Email gxo
            </a>
            <a className="btn wa" href={whatsappLink(settings.whatsapp_number, `Hi gxo! ${subject}\n\n${summary}`)} target="_blank" rel="noopener noreferrer">
              <WhatsApp size={18} /> WhatsApp
            </a>
          </div>
        </div>

        <Link href="/dashboard" className="link muted small">Back to your dashboard</Link>
      </div>
    </div>
  );
}
