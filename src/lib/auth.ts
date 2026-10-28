import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { admin } from "better-auth/plugins";
import { db } from "@/db";
import * as schema from "@/db/schema";

function parseList(value: string | undefined) {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function toHost(value: string) {
  try {
    return new URL(value.includes("://") ? value : `https://${value}`).host;
  } catch {
    return undefined;
  }
}

const productionUrl = process.env.BETTER_AUTH_URL?.trim() || undefined;
const extraOrigins = parseList(process.env.BETTER_AUTH_TRUSTED_ORIGINS);
const productionHost = productionUrl ? toHost(productionUrl) : undefined;
const extraHosts = extraOrigins.map(toHost).filter((host): host is string => Boolean(host));
const vercelProjectHost = toHost(process.env.VERCEL_PROJECT_PRODUCTION_URL ?? "");
const vercelHosts = process.env.VERCEL
  ? vercelProjectHost
    ? [vercelProjectHost, `${vercelProjectHost.split(".")[0]}-*.vercel.app`]
    : ["*.vercel.app"]
  : [];
const allowedHosts = Array.from(
  new Set([...vercelHosts, ...(productionHost ? [productionHost] : []), ...extraHosts]),
);
const trustedOrigins = Array.from(
  new Set([...(productionUrl ? [productionUrl] : []), ...extraOrigins]),
);
const fallbackUrl = productionUrl ?? (vercelProjectHost ? `https://${vercelProjectHost}` : undefined);

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.VERCEL
    ? {
        allowedHosts: allowedHosts.length > 0 ? allowedHosts : ["*.vercel.app"],
        fallback: fallbackUrl,
        protocol: "https",
      }
    : productionUrl,
  trustedOrigins,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  emailAndPassword: {
    enabled: true,
  },
  user: {
    additionalFields: {
      phone: {
        type: "string",
        required: false,
        input: true,
      },
    },
  },
  plugins: [
    admin({
      defaultRole: "patient",
      adminRoles: ["admin"],
    }),
  ],
});
