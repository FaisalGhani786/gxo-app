import Footer from "@/components/Footer";
import { WhatsApp } from "@/components/Icons";
import { whatsappLink } from "@/lib/links";
import { getSettings } from "@/lib/site";

export default async function SiteLayout({ children }: LayoutProps<"/">) {
  const s = await getSettings();
  return (
    <>
      <main>{children}</main>
      <Footer />
      <a
        className="wa-float"
        href={whatsappLink(s.whatsapp_number, "Hi gxo! I found you on your website and ")}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Message gxo on WhatsApp"
      >
        <WhatsApp size={30} />
      </a>
    </>
  );
}
