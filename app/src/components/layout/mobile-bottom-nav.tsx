import * as React from "react";
import { Link, useLocation } from "@tanstack/react-router";
import {
  IconMessageCircle,
  IconRobot,
  IconClock,
  IconSettings,
} from "@tabler/icons-react";

export function MobileBottomNav() {
  const location = useLocation();
  const path = location.pathname;

  const items = [
    { label: "Chats", to: "/", icon: IconMessageCircle, active: path === "/" || path.startsWith("/channel") },
    { label: "Agents", to: "/agents", icon: IconRobot, active: path.startsWith("/agents") || path.startsWith("/bot") },
    { label: "Routines", to: "/routines", icon: IconClock, active: path.startsWith("/routines") },
    { label: "Settings", to: "/settings", icon: IconSettings, active: path.startsWith("/settings") || path.startsWith("/admin") },
  ];

  return (
    <nav className="md:hidden border-t border-border bg-background/95 backdrop-blur-md shrink-0 h-14 flex items-center justify-around px-2 z-30">
      {items.map((item) => (
        <Link
          key={item.label}
          to={item.to}
          className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-1 rounded-lg transition-colors ${
            item.active
              ? "text-primary font-medium"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <item.icon className="size-5 shrink-0" />
          <span className="text-[10px] tracking-tight">{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}
