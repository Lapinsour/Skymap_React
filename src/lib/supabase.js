// On importe la fonction qui crée le client Supabase
// C'est l'équivalent de : from supabase import create_client
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://vkobxpkysltnycafezen.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrb2J4cGt5c2x0bnljYWZlemVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxMTA0MzksImV4cCI6MjA5NDY4NjQzOX0.SgdwxgdfV-CsdiJeSdvX5OUg_UCMMf2hrz8DpsfJZrE'

// On crée le client une seule fois et on l'exporte
// Les autres fichiers feront : import { supabase } from '../lib/supabase'
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)