"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function RoleNav({ links }: { links: { href: string; label: string }[] }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-1 rounded-xl border bg-card p-1 shadow-sm">
      {links.map((link) => {
        const active = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
