import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import argon2 from "argon2";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validations/auth";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/auth/login",
    error: "/auth/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.baseCurrency = (user as any).baseCurrency;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        (session.user as any).baseCurrency = token.baseCurrency;
      }
      return session;
    },
  },
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return null;

        const valid = await argon2.verify(user.passwordHash, password);
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.avatarUrl,
          baseCurrency: user.baseCurrency,
        };
      },
    }),
  ],
});
