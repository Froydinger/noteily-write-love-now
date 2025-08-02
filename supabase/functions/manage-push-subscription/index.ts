import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.0';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, subscription, userId, deviceName } = await req.json();
    
    console.log('Push subscription request:', { action, userId, deviceName });

    if (action === 'subscribe') {
      const { endpoint, keys } = subscription;
      
      // Upsert subscription (replace if exists)
      const { data, error } = await supabase
        .from('push_subscriptions')
        .upsert({
          user_id: userId,
          endpoint,
          p256dh_key: keys.p256dh,
          auth_key: keys.auth,
          device_name: deviceName || 'Unknown Device',
          user_agent: req.headers.get('user-agent') || '',
        }, {
          onConflict: 'user_id,endpoint'
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return new Response(
        JSON.stringify({ success: true, subscription: data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (action === 'unsubscribe') {
      const { endpoint } = subscription;
      
      const { error } = await supabase
        .from('push_subscriptions')
        .delete()
        .eq('user_id', userId)
        .eq('endpoint', endpoint);

      if (error) {
        throw error;
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (action === 'get') {
      const { data, error } = await supabase
        .from('push_subscriptions')
        .select('*')
        .eq('user_id', userId);

      if (error) {
        throw error;
      }

      return new Response(
        JSON.stringify({ subscriptions: data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in manage-push-subscription function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});