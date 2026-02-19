import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import listdProLogo from "@/assets/listd-pro-green.png";

const navLinks = [
  { label: "How It Works", href: "/how-it-works" },
  { label: "For Clients", href: "/for-clients" },
  { label: "For Clerks", href: "/for-clerks" },
  { label: "Pricing", href: "/service-tiers" },
  { label: "Contact", href: "/contact" },
];

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, loading } = useAuth();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleNavClick = () => {
    setMobileMenuOpen(false);
    window.scrollTo(0, 0);
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-background/95 backdrop-blur-md border-b border-border shadow-sm"
          : "bg-background"
      }`}
    >
      <div className="max-w-[1400px] mx-auto px-6 md:px-12">
        <div className="flex items-center justify-between h-[72px]">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <img src={listdProLogo} alt="LISTD.Pro" className="h-8 w-auto" />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-12">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.href}
                onClick={handleNavClick}
                className="text-[0.95rem] font-medium text-muted-foreground hover:text-primary transition-colors duration-300"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop Auth */}
          <div className="hidden md:flex items-center gap-3">
            {loading ? null : user ? (
              <Link to="/dashboard">
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90 px-6">
                  Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/auth">
                  <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
                    Sign In
                  </Button>
                </Link>
                <Link to="/auth">
                  <Button className="bg-primary text-primary-foreground hover:bg-primary/90 px-6">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden text-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-6 border-t border-border">
            <nav className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  to={link.href}
                  onClick={handleNavClick}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {link.label}
                </Link>
              ))}
              <div className="flex flex-col gap-2 pt-4 border-t border-border">
                {user ? (
                  <Link to="/dashboard">
                    <Button className="w-full bg-primary text-primary-foreground">Dashboard</Button>
                  </Link>
                ) : (
                  <>
                    <Link to="/auth">
                      <Button variant="outline" className="w-full">Sign In</Button>
                    </Link>
                    <Link to="/auth">
                      <Button className="w-full bg-primary text-primary-foreground">Get Started</Button>
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
