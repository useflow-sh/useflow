import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EXTERNAL_LINKS } from "@/constants";

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-background/95 backdrop-blur-sm border-b border-border/40 z-50 px-4 sm:px-6">
      <div className="h-full flex items-center justify-between max-w-7xl mx-auto">
        {/* Left side - Menu button and Logo */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="hover:bg-accent"
            aria-label="Toggle menu"
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="flex items-center gap-2">
            <div className="text-xl font-bold bg-gradient-to-r from-primary-400 to-secondary-400 bg-clip-text text-transparent">
              useFlow
            </div>
            <span className="hidden sm:inline text-sm text-muted-foreground font-medium">
              Examples
            </span>
          </div>
        </div>

        {/* Right side - External links */}
        <div className="flex items-center gap-2">
          {EXTERNAL_LINKS.map((link) => {
            const IconComponent = link.icon;
            return (
              <a
                key={link.label}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:flex"
              >
                <IconComponent className="h-4 w-4" />
                {link.label}
              </a>
            );
          })}
        </div>
      </div>
    </header>
  );
}
