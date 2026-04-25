import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://mpdobvqulzbtvtdfeahf.supabase.co'
const supabaseKey = 'sb_publishable_YtJTKO4lR-KC2kIi08QvOw_ceiI4FkM'

export const supabase = createClient(supabaseUrl, supabaseKey)
