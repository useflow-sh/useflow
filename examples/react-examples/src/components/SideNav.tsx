import { Link, useLocation } from "react-router";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getNavItems } from "@/config/pages";
import { EXTERNAL_LINKS } from "@/constants";

interface SideNavProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SideNav({ isOpen, onClose }: SideNavProps) {
  const location = useLocation();
  const navItems = getNavItems();

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        // biome-ignore lint/a11y/noStaticElementInteractions: ignore
        // biome-ignore lint/a11y/useKeyWithClickEvents: ignore
        <div
          className="fixed inset-0 bg-black/50 z-[60] transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 left-0 h-full w-80 max-w-[85vw] bg-background/95 backdrop-blur-sm border-r border-border/40 z-[70] transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Card className="h-full border-0 rounded-none flex flex-col">
          <CardHeader>
            <CardTitle>Navigation</CardTitle>
            <CardDescription>useFlow Example Flows</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 flex-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const IconComponent = item.icon;

              return (
                <Link key={item.id} to={item.path} onClick={onClose}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    className={`w-full justify-start h-auto py-3 ${
                      isActive
                        ? ""
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-3 w-full">
                      <IconComponent className="h-5 w-5" />
                      <div className="flex-1 text-left">
                        <div className="font-medium text-sm">{item.label}</div>
                        <div className="text-xs text-muted-foreground">
                          {item.description}
                        </div>
                      </div>
                    </div>
                  </Button>
                </Link>
              );
            })}
          </CardContent>

          {/* External Links */}
          <div className="border-t border-border/40 p-4 space-y-2">
            {EXTERNAL_LINKS.map((link) => {
              const IconComponent = link.icon;
              return (
                <a
                  key={link.label}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={onClose}
                >
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-muted-foreground hover:text-foreground"
                  >
                    <IconComponent className="h-4 w-4 mr-2" />
                    {link.label}
                  </Button>
                </a>
              );
            })}
          </div>
        </Card>
      </div>
    </>
  );
}
