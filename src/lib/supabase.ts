import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase Environment Variables')
}

// NOTE: This client uses the Service Role Key and should ONLY be used on the server.
export const supabaseAdmin = createClient(supabaseUrl, supabaseKey)
