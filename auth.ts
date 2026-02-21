import { eq } from "drizzle-orm";
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

const adminEmails = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  secret: process.env.AUTH_SECRET,
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;

      const email = user.email.toLowerCase();
      const isAdmin = adminEmails.includes(email);

      const existing = await db.query.users.findFirst({
        where: eq(users.email, email),
      });

      if (!existing) {
        await db.insert(users).values({
          email,
          name: user.name ?? email,
          image: user.image ?? null,
          role: isAdmin ? "admin" : "user",
        });
      } else if (isAdmin && existing.role !== "admin") {
        await db
          .update(users)
          .set({ role: "admin" })
          .where(eq(users.id, existing.id));
      }

      return true;
    },
    async jwt({ token, user }) {
      if (user?.email) {
        const dbUser = await db.query.users.findFirst({
          where: eq(users.email, user.email.toLowerCase()),
        });
        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
});
