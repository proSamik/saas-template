import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      accessToken: string;
      error?: string;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    token: string;
    expiresAt: number;
    name: string;
    email: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    accessToken: string;
    expiresAt: number;
    error?: string;
  }
}