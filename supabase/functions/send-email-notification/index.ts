import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailNotificationRequest {
  type: 'note_shared' | 'note_updated';
  recipientUserId: string;
  noteId: string;
  noteTitle: string;
  ownerEmail?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { type, recipientUserId, noteId, noteTitle, ownerEmail }: EmailNotificationRequest = await req.json();

    console.log(`Processing ${type} notification for user ${recipientUserId}, note: ${noteTitle}`);

    // Get recipient's email and preferences
    const { data: userData, error: userError } = await supabaseClient.auth.admin.getUserById(recipientUserId);
    
    if (userError || !userData.user?.email) {
      console.error('Error getting user:', userError);
      return new Response(
        JSON.stringify({ error: 'User not found or no email' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const recipientEmail = userData.user.email;

    // Check user preferences
    const { data: preferences, error: prefError } = await supabaseClient
      .from('user_preferences')
      .select('*')
      .eq('user_id', recipientUserId)
      .maybeSingle();

    if (prefError) {
      console.error('Error getting preferences:', prefError);
      return new Response(
        JSON.stringify({ error: 'Failed to get user preferences' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user has email notifications enabled
    const emailEnabled = preferences?.email_notifications_enabled ?? true;
    const typeEnabled = type === 'note_shared' 
      ? (preferences?.notification_note_shared ?? true)
      : (preferences?.notification_note_updated ?? true);

    if (!emailEnabled || !typeEnabled) {
      console.log(`Email notification disabled for user ${recipientUserId}, type: ${type}`);
      return new Response(
        JSON.stringify({ success: true, message: 'Notification disabled by user preference' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prepare email content based on type
    let subject: string;
    let htmlContent: string;

    if (type === 'note_shared') {
      subject = `📝 New note shared with you: "${noteTitle}"`;
      htmlContent = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">📝 Noteily</h1>
            <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Write What You Love</p>
          </div>
          
          <div style="background: white; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #e2e8f0; border-top: none;">
            <h2 style="color: #1a202c; margin: 0 0 20px 0; font-size: 20px;">New Note Shared With You!</h2>
            
            <div style="background: #f8fafc; padding: 20px; border-radius: 6px; margin: 20px 0;">
              <p style="margin: 0; color: #4a5568; font-size: 16px;">
                <strong>"${noteTitle}"</strong>
              </p>
              ${ownerEmail ? `<p style="margin: 10px 0 0 0; color: #718096; font-size: 14px;">Shared by: ${ownerEmail}</p>` : ''}
            </div>
            
            <p style="color: #4a5568; line-height: 1.6; margin: 20px 0;">
              Someone has shared a note with you on Noteily. Sign in to your account to view and collaborate on this note.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.netlify.app') || 'https://app.noteily.com'}" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: 500; display: inline-block;">
                View Note
              </a>
            </div>
            
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
            
            <p style="color: #718096; font-size: 12px; text-align: center; margin: 0;">
              You're receiving this because someone shared a note with you on Noteily.<br>
              You can manage your notification preferences in your account settings.
            </p>
          </div>
        </div>
      `;
    } else {
      subject = `📝 Note updated: "${noteTitle}"`;
      htmlContent = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">📝 Noteily</h1>
            <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Write What You Love</p>
          </div>
          
          <div style="background: white; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #e2e8f0; border-top: none;">
            <h2 style="color: #1a202c; margin: 0 0 20px 0; font-size: 20px;">Shared Note Updated</h2>
            
            <div style="background: #f8fafc; padding: 20px; border-radius: 6px; margin: 20px 0;">
              <p style="margin: 0; color: #4a5568; font-size: 16px;">
                <strong>"${noteTitle}"</strong>
              </p>
              <p style="margin: 10px 0 0 0; color: #718096; font-size: 14px;">📝 Recently updated</p>
            </div>
            
            <p style="color: #4a5568; line-height: 1.6; margin: 20px 0;">
              A note shared with you has been updated. Check out the latest changes!
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.netlify.app') || 'https://app.noteily.com'}" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: 500; display: inline-block;">
                View Updated Note
              </a>
            </div>
            
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
            
            <p style="color: #718096; font-size: 12px; text-align: center; margin: 0;">
              You're receiving this because you have access to this shared note on Noteily.<br>
              You can manage your notification preferences in your account settings.
            </p>
          </div>
        </div>
      `;
    }

    // Send email using Supabase's built-in email service (via auth.admin)
    // For now, we'll log the email content since Supabase's built-in email service
    // is primarily for auth emails. In production, you'd want to use a service like Resend.
    console.log('Email notification prepared:', {
      to: recipientEmail,
      subject,
      type,
      noteTitle,
      recipientUserId
    });

    // TODO: Integrate with email service like Resend
    // For now, we'll just log that the email would be sent
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email notification logged (email service integration needed)',
        details: {
          recipient: recipientEmail,
          subject,
          type
        }
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    console.error('Error in send-email-notification function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
};

serve(handler);