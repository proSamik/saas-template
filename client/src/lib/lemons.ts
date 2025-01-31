import { LemonsqueezyClient } from "lemonsqueezy.ts";

export const client = new LemonsqueezyClient(process.env.NEXT_PUBLIC_LEMONSQUEEZY_API_KEY as string);