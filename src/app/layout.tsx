import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Toaster } from "sonner";
import { SiteHeader } from "@/components/layout/site-header";
import "./globals.css";

export const metadata: Metadata = {
  title: "Medrella — Book outpatient appointments",
  description: "Find a doctor and book an outpatient appointment in a few clicks.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="flex min-h-screen flex-col">
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <footer className="border-t bg-card/60">
            <div className="container mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
              <p>Medrella outpatient booking</p>
              <p>Simple scheduling, fewer phone calls.</p>
            </div>
          </footer>
        </div>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
