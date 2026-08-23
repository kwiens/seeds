import { eq } from "drizzle-orm";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import type { NextAuthConfig } from "next-auth";
import {
  E2E_TEST_AUTH_PROVIDER_ID,
  getE2ETestAuthSecret,
  matchesE2ETestAuthSecret,
} from "@/lib/e2e-test-auth";

const providers: NextAuthConfig["providers"] = [Google];
const e2eTestAuthSecret = getE2ETestAuthSecret();

if (e2eTestAuthSecret) {
  providers.push(
    Credentials({
      id: E2E_TEST_AUTH_PROVIDER_ID,
      name: "E2E test account",
      credentials: {
        email: { label: "Email", type: "email" },
        secret: { label: "Test secret", type: "password" },
      },
      async authorize(credentials) {
        if (
          typeof credentials.email !== "string" ||
          typeof credentials.secret !== "string" ||
          !matchesE2ETestAuthSecret(credentials.secret, e2eTestAuthSecret)
        ) {
          return null;
        }

        const email = credentials.email.trim().toLowerCase();
        const [{ db }, { users }] = await Promise.all([
          import("@/lib/db"),
          import("@/lib/db/schema"),
        ]);
        const user = await db.query.users.findFirst({
          where: eq(users.email, email),
        });

        if (!user) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        };
      },
    }),
  );
}

export const authConfig: NextAuthConfig = {
  providers,
  secret: process.env.AUTH_SECRET,
};
