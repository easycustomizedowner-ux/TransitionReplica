import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // Create a Supabase client with the SERVICE_ROLE_KEY to bypass RLS for moderation
        // In a real app, you'd verify the user has an 'admin' role first.
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const { ad_id, action } = await req.json()

        if (!ad_id || !['approve', 'reject'].includes(action)) {
            throw new Error('Invalid input')
        }

        // Verify the user calling this function (optional, if we want to restrict who can call it)
        // const supabaseAuth = createClient(
        //   Deno.env.get('SUPABASE_URL') ?? '',
        //   Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        //   { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        // )
        // const { data: { user } } = await supabaseAuth.auth.getUser()
        // if (!user || user.role !== 'admin') throw new Error('Unauthorized')

        let updateData = {}
        if (action === 'approve') {
            updateData = { approved: true, status: 'open' }
        } else {
            updateData = { approved: false, status: 'closed' } // Or deleted
        }

        const { error } = await supabaseAdmin
            .from('ads')
            .update(updateData)
            .eq('id', ad_id)

        if (error) throw error

        return new Response(
            JSON.stringify({ message: `Ad ${action}d successfully` }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error: any) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
