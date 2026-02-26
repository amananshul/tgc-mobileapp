/**
 * Thin wrapper — returns the canonical Supabase singleton from src/lib/supabase.ts.
 * All existing call-sites use getSupabaseClient() and continue to work unchanged.
 */
import {supabase} from '../../lib/supabase';
import {getFrontendAuthEnvDebugSnapshot} from '../../config/env';

let logged = false;

export function getSupabaseClient() {
  if (!logged) {
    console.log('[Supabase] getSupabaseClient()', getFrontendAuthEnvDebugSnapshot());
    logged = true;
  }
  return supabase;
}
