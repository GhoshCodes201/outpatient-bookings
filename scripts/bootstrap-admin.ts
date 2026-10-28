import { config } from "dotenv";

config({ path: ".env.local" });
config();

const directDatabaseUrl =
  process.env.DATABASE_URL_UNPOOLED || process.env.POSTGRES_URL_NON_POOLING;

if (directDatabaseUrl) {
  process.env.DATABASE_URL = directDatabaseUrl;
}

function required(name: string) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is required.`);
  }
  return value;
}

async function main() {
  const { eq } = await import("drizzle-orm");
  const { db } = await import("../src/db");
  const { user } = await import("../src/db/schema");
  const { auth } = await import("../src/lib/auth");

  const name = process.env.BOOTSTRAP_ADMIN_NAME?.trim() || "Clinic Admin";
  const email = required("BOOTSTRAP_ADMIN_EMAIL").toLowerCase();
  const password = required("BOOTSTRAP_ADMIN_PASSWORD");

  if (password.length < 8) {
    throw new Error("BOOTSTRAP_ADMIN_PASSWORD must be at least 8 characters.");
  }

  const existing = await db.select().from(user).where(eq(user.email, email)).limit(1);

  if (existing.length === 0) {
    await auth.api.signUpEmail({
      body: {
        name,
        email,
        password,
      },
    });
  }

  const [record] = await db.select().from(user).where(eq(user.email, email)).limit(1);
  if (!record) {
    throw new Error(`Could not create the admin account ${email}.`);
  }

  await db
    .update(user)
    .set({
      name,
      role: "admin",
      emailVerified: true,
      updatedAt: new Date(),
    })
    .where(eq(user.id, record.id));

  console.log(`Admin account ready: ${email}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
