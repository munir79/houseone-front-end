import { Home } from "lucide-react";
import { APP_NAME, APP_TAGLINE } from "@/lib/brand";
import { cn } from "@/lib/cn";

// light — গাঢ় পটভূমির জন্য (Sidebar, Footer)
// iconOnly — Sidebar ছোট থাকলে শুধু আইকন
const Logo = ({ showTagline = false, light = false, iconOnly = false }) => {
  return (
    <div className="flex items-center gap-2">
      <Home className={cn("h-9 w-9 shrink-0", light ? "text-sidebar-accent" : "text-primary")} strokeWidth={2.2} aria-hidden="true" />
      {iconOnly ? (
        <span className="sr-only">{APP_NAME}</span>
      ) : (
        <div>
          <p className={cn("text-lg leading-tight font-bold", light ? "text-sidebar-foreground" : "text-foreground")}>
            House<span className={light ? "text-sidebar-accent" : undefined}>One</span>
          </p>
          {showTagline && (
            <p className={cn("text-xs", light ? "text-sidebar-foreground/70" : "text-muted")}>{APP_TAGLINE}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default Logo;
