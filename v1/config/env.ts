import dotenv from "dotenv";
dotenv.config();
import { z } from "zod";

const envSchema = z.object({
  PORT: z.string().default("3000"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
});
const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error(
    "❌ Invalid environment configuration:",
    parsed.error.flatten().fieldErrors,
  );
  throw new Error(
    "Invalid environment variables. Check your .env configuration.",
  );
}

export const env = {
  ...parsed.data,
  isDevelopment: parsed.data.NODE_ENV === "development",
  isProduction: parsed.data.NODE_ENV === "production",
};
