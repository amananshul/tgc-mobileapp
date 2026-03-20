import "dotenv/config";

const env = {
  port: parseInt(process.env.PORT ?? "3000", 10) || 3000,
  nodeEnv: process.env.NODE_ENV ?? "development",
  isDev: (process.env.NODE_ENV ?? "development") === "development",

  // Database
  databaseUrl: process.env.DATABASE_URL,

  // JWT
  jwtSecret: process.env.JWT_SECRET as string,
  jwtAccessExpires: process.env.JWT_ACCESS_EXPIRES ?? "15m",
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET as string,
  jwtRefreshExpires: process.env.JWT_REFRESH_EXPIRES ?? "30d",

  // Supabase Storage
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  supabaseMediaBucket: process.env.SUPABASE_MEDIA_BUCKET,
};

export default env;
