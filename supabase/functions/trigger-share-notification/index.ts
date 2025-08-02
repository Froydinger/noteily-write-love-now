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
    const { noteId, sharedWithUserId, ownerEmail, noteTitle } = await req.json();
    
    console.log('Triggering share notification:', { noteId, sharedWithUserId, ownerEmail, noteTitle });

    // Check if the user wants to receive note sharing notifications
    const { data: preferences, error: prefsError } = await supabase
      .from('user_preferences')
      .select('notification_note_shared')
      .eq('user_id', sharedWithUserId)
      .single();

    if (prefsError || !preferences?.notification_note_shared) {
      console.log('User has disabled note sharing notifications or preferences not found');
      return new Response(
        JSON.stringify({ message: 'Notifications disabled or preferences not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send push notification
    const notificationPayload = {
      title: 'New Note Shared',
      body: `${ownerEmail} shared "${noteTitle}" with you`,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      data: {
        type: 'note_shared',
        noteId,
        url: `/note/${noteId}`
      },
      actions: [
        {
          action: 'view',
          title: 'View Note',
          icon: '/icon-192.png'
        }
      ]
    };

    const { data, error } = await supabase.functions.invoke('push-notifications', {
      body: {
        type: 'note_shared',
        userId: sharedWithUserId,
        noteId,
        payload: notificationPayload
      }
    });

    if (error) {
      throw error;
    }

    return new Response(
      JSON.stringify({ success: true, data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in trigger-share-notification function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});