import { Link } from "react-router-dom";
import listdProLogo from "@/assets/listd-pro-green.png";

const Footer = () => {
  return (
    <footer className="bg-foreground text-background py-20 px-6 md:px-12">
      <div className="max-w-[1400px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr] gap-16 mb-16">
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

          {/* Company Links */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-[0.1em] text-background/50 mb-6">
              Company
            </h4>
            <ul className="space-y-3">
              {[
                { label: "About", to: "/about" },
                { label: "Contact", to: "/about" },
                { label: "Terms", to: "/about" },
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

        {/* Bottom Bar */}
        <div className="border-t border-background/10 pt-8 text-center">
          <p className="text-sm text-background/50">
            © {new Date().getFullYear()} LISTD. Controlled infrastructure, not gig-economy chaos.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
