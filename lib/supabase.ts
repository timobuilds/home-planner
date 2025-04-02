// Create lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl) {
  throw new Error("Missing env variable: NEXT_PUBLIC_SUPABASE_URL");
}
if (!supabaseAnonKey) {
    throw new Error("Missing env variable: NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

// Public client for client-side operations (respects RLS)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Note: We will primarily use Drizzle for database interactions via Server Actions.
// The Supabase client might still be useful for Storage, Realtime, or simple auth state checks.
// Avoid using a service role client unless absolutely necessary and secure.