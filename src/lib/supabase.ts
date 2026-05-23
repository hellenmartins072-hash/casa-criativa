import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Use createBrowserClient so it can read cookies set by the server actions (login/signup)
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)
