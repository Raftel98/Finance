import type { DefaultSession } from "next-auth";
import type { JWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      baseCurrency: string;
    } & DefaultSession["user"];
  }

  interface User {
    baseCurrency?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    baseCurrency?: string;
  }
}
