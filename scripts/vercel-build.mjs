import { execSync } from "node:child_process";

const environment = process.env.VERCEL_ENV;

if (environment === "production") {
  console.log("[vercel-build] Applying production database migrations...");
  execSync("drizzle-kit migrate", { stdio: "inherit", env: process.env });
} else {
  console.log(`[vercel-build] Skipping migrations (VERCEL_ENV=${environment ?? "unset"}).`);
}

execSync("next build", { stdio: "inherit", env: process.env });
