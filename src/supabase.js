import { createClient } from '@supabase/supabase-js'

const SB_URL  = 'https://abbaqmjidclmmwqcutlj.supabase.co'
const SB_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiYmFxbWppZGNsbW13cWN1dGxqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyNDQ2MDgsImV4cCI6MjA4OTgyMDYwOH0.xsPdQ4jKGVi_-1aBODz_Tlf9TMn5dtOZ8cx69HqFAI0'

export const sb = createClient(SB_URL, SB_ANON)
