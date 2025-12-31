import dotenv from "dotenv";

type AppConstants = {
  DATABASE_URL: string;
  PORT: number | string;
};

const envFileMap: Record<string, string> = {
  local: ".env.local",
  dev: ".env.dev",
  prod: ".env.prod",
};


process.env.BUN_DOTENV = "0";

const mode = Bun.env.NODE_ENV ?? "local";

dotenv.config({ 
  path: envFileMap[mode] || ".env.local",
  override: true
});

export const APP_CONSTANTS: AppConstants = {
  DATABASE_URL: process.env.MONGODB_URI as string,
  PORT: Number(process.env.PORT || 3000),
};