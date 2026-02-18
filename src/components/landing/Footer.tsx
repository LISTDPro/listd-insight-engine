import { Link } from "react-router-dom";
import listdProLogo from "@/assets/listd-pro-green.png";
import { usePlatformSettings } from "@/hooks/usePlatformSettings";

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const Footer = () => {
  const { data: settings } = usePlatformSettings();
  const instagramUrl = settings?.instagram_url;
  const facebookUrl = settings?.facebook_url;

  return (
    <footer className="bg-foreground text-background py-20 px-6 md:px-12">
      <div className="max-w-[1400px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr] gap-12 mb-12">
          {/* Brand + Trust Signals */}
          <div>
            <img src={listdProLogo} alt="LISTD.Pro" className="h-8 w-auto mb-6 brightness-0 invert" />
            <ul className="space-y-0">
              {[
                "Structured tiers",
                "Verified clerks",
                "Escrow-secured workflow",
                "Professional fulfilment network",
              ].map((signal) => (
                <li
                  key={signal}
                  className="py-3 border-b border-background/10 last:border-b-0 text-sm text-background/70"
                >
                  {signal}
                </li>
              ))}
            </ul>
          </div>

          {/* Platform Links */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-[0.1em] text-background/50 mb-6">
              Platform
            </h4>
            <ul className="space-y-3">
              {[
                { label: "How It Works", to: "/how-it-works" },
                { label: "Service Tiers", to: "/service-tiers" },
                { label: "About", to: "/about" },
                { label: "Contact", to: "/contact" },
              ].map((item) => (
                <li key={item.label}>
                  <Link
                    to={item.to}
                    className="text-[0.95rem] text-background/80 hover:text-background transition-colors duration-300"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* For You Links */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-[0.1em] text-background/50 mb-6">
              For You
            </h4>
            <ul className="space-y-3">
              {[
                { label: "For Clients", to: "/for-clients" },
                { label: "For Clerks", to: "/for-clerks" },
              ].map((item) => (
                <li key={item.label}>
                  <Link
                    to={item.to}
                    className="text-[0.95rem] text-background/80 hover:text-background transition-colors duration-300"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-[0.1em] text-background/50 mb-6">
              Legal
            </h4>
            <ul className="space-y-3">
              {[
                { label: "Terms of Service", to: "/terms" },
                { label: "Privacy Policy", to: "/privacy" },
                { label: "Cookie Policy", to: "/cookies" },
              ].map((item) => (
                <li key={item.label}>
                  <Link
                    to={item.to}
                    className="text-[0.95rem] text-background/80 hover:text-background transition-colors duration-300"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Contact strip */}
        <div className="border-t border-background/10 pt-8 mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 text-sm text-background/50">
          <a href="mailto:support@listd.co.uk" className="hover:text-background transition-colors">support@listd.co.uk</a>
          <span className="hidden sm:block">·</span>
          <a href="tel:+447413065681" className="hover:text-background transition-colors">+44 7413 065681</a>
          <span className="hidden sm:block">·</span>
          <span>Bristol, Bath & surrounding areas</span>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-background/10 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-background/50">
            © {new Date().getFullYear()} LISTD. Controlled infrastructure, not gig-economy chaos.
          </p>
          {(instagramUrl || facebookUrl) && (
            <div className="flex items-center gap-3">
              {instagramUrl && (
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="text-background/40 hover:text-background transition-colors"
                >
                  <InstagramIcon />
                </a>
              )}
              {facebookUrl && (
                <a
                  href={facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  className="text-background/40 hover:text-background transition-colors"
                >
                  <FacebookIcon />
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
