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
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        )

        const { quote_id, customer_id } = await req.json()

        if (!quote_id || !customer_id) {
            throw new Error('Missing quote_id or customer_id')
        }

        // 1. Get the quote to find the vendor and ad details
        const { data: quote, error: quoteError } = await supabase
            .from('quotes')
            .select('*, ads(created_by)')
            .eq('id', quote_id)
            .single()

        if (quoteError || !quote) {
            throw new Error('Quote not found')
        }

        // 2. Verify the caller is the customer who owns the ad
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) throw new Error('Unauthorized')

        if (quote.ads.created_by !== user.id) {
            throw new Error('Unauthorized: You do not own this ad')
        }

        // 3. Update quote status
        const { error: updateError } = await supabase
            .from('quotes')
            .update({ status: 'accepted' })
            .eq('id', quote_id)

        if (updateError) throw updateError

        // 4. Create or get existing chat thread
        // Check if thread exists
        const { data: existingThread } = await supabase
            .from('chat_threads')
            .select('id')
            .eq('quote_id', quote_id)
            .single()

        let thread_id = existingThread?.id

        if (!thread_id) {
            const { data: newThread, error: threadError } = await supabase
                .from('chat_threads')
                .insert({
                    quote_id: quote_id,
                    customer_id: user.id,
                    vendor_id: quote.vendor_id,
                })
                .select()
                .single()

            if (threadError) throw threadError
            thread_id = newThread.id
        }

        return new Response(
            JSON.stringify({ thread_id }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error: any) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
