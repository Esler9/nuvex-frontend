import Link from "next/link";
import { Facebook, Instagram, MapPin } from "lucide-react";
import { siteConfig, whatsappLink } from "@/lib/site-config";
import { TikTokIcon, WhatsAppIcon } from "@/components/icons/brand-icons";
import { BackToTopButton } from "@/components/back-to-top-button";

const socials = [
  { label: "Facebook", href: siteConfig.social.facebook, Icon: Facebook },
  { label: "Instagram", href: siteConfig.social.instagram, Icon: Instagram },
  { label: "TikTok", href: siteConfig.social.tiktok, Icon: TikTokIcon },
];

export function SiteFooter() {
  const whatsapp = whatsappLink("Hola, quiero información sobre sus productos.");
  const whatsappClass = "inline-flex min-h-12 items-center gap-2 rounded-lg bg-whatsapp-bright px-6 font-bold text-white";

  return (
    <footer className="mt-16 bg-navy text-white">
      <div className="container-shell grid gap-10 py-12 md:grid-cols-3">
        <div>
          <p className="text-2xl font-black tracking-tight">
            {siteConfig.name.toUpperCase()}
            <span className="text-primary">.</span>
          </p>
          <address className="mt-4 flex gap-2 text-sm not-italic text-white/75">
            <MapPin aria-hidden className="mt-0.5 size-4 shrink-0 text-primary" />
            {siteConfig.address}
          </address>
        </div>

        <div>
          <h2 className="text-sm font-bold uppercase tracking-[.18em] text-white/60">Contáctanos</h2>
          <div className="mt-4">
            {whatsapp ? (
              <a href={whatsapp} target="_blank" rel="noopener noreferrer" className={`${whatsappClass} transition-opacity hover:opacity-90`}>
                <WhatsAppIcon className="size-5" /> Escríbenos por WhatsApp
              </a>
            ) : (
              <span className={whatsappClass} title="Configura NEXT_PUBLIC_WHATSAPP_NUMBER">
                <WhatsAppIcon className="size-5" /> WhatsApp próximamente
              </span>
            )}
          </div>
          <ul className="mt-5 flex gap-2" aria-label="Redes sociales">
            {socials.map(({ label, href, Icon }) => (
              <li key={label}>
                <a href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className="grid size-11 place-items-center rounded-full border border-white/20 bg-white/5 text-white transition-colors hover:border-primary hover:bg-primary">
                  <Icon aria-hidden className="size-5" />
                </a>
              </li>
            ))}
          </ul>
        </div>

        <nav aria-label="Información legal y ayuda">
          <h2 className="text-sm font-bold uppercase tracking-[.18em] text-white/60">Información</h2>
          <ul className="mt-3">
            {siteConfig.legalLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="inline-flex min-h-11 items-center text-sm text-white/75 hover:text-white hover:underline">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="border-t border-white/10">
        <div className="container-shell flex flex-col items-center gap-3 py-6 sm:flex-row sm:justify-between">
          <p className="text-xs text-white/60">
            © {new Date().getFullYear()} {siteConfig.name}. Guatemala.
          </p>
          <BackToTopButton />
        </div>
      </div>
    </footer>
  );
}
