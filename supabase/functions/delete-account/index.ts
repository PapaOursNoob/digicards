import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_KEY')!

    // Client with service key (bypasses RLS)
    const supabase = createClient(supabaseUrl, serviceKey)

    // Verify the user is authenticated via the Authorization header
    const authHeader = req.headers.get('Authorization')!
    const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    })

    const { data: { user }, error: authError } = await userClient.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const userId = user.id

    // Delete all user data (service key bypasses RLS)
    const deckCards = await supabase.from('deck_cards').delete().in('deck_id',
      (await supabase.from('decks').select('id').eq('user_id', userId)).data?.map(d => d.id) ?? []
    )
    if (deckCards.error) throw deckCards.error

    const decks = await supabase.from('decks').delete().eq('user_id', userId)
    if (decks.error) throw decks.error

    const collection = await supabase.from('collection').delete().eq('user_id', userId)
    if (collection.error) throw collection.error

    const wishlist = await supabase.from('wishlist').delete().eq('user_id', userId)
    if (wishlist.error) throw wishlist.error

    const profiles = await supabase.from('profiles').delete().eq('id', userId)
    if (profiles.error) throw profiles.error

    // Delete the auth user (requires service key)
    const { error: deleteError } = await supabase.auth.admin.deleteUser(userId)
    if (deleteError) throw deleteError

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
