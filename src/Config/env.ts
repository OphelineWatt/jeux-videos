import * as dotenv from "dotenv";
dotenv.config();

export const config = {
  clientId: process.env.TWITCH_CLIENT_ID!,
  clientSecret: process.env.TWITCH_CLIENT_SECRET!,
  igdbUrl: process.env.IGDB_BASE_URL!
};
