import { User as SupabaseUser } from "@supabase/supabase-js";

declare module "express-serve-static-core" {
  interface Request {
    user: {
      userId: string;
      supabaseUserId: string;
      email: string | null;
      phone: string | null;
      role: string;
      onboardingCompleted: boolean;
    };
    supabaseUser: SupabaseUser;
  }
}
