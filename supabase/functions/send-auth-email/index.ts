import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";
import { Resend } from "npm:resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY") as string);
const hookSecret = Deno.env.get("SEND_EMAIL_HOOK_SECRET") as string;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("not allowed", { status: 400 });
  }

  try {
    const payload = await req.text();
    const headers = Object.fromEntries(req.headers);
    const wh = new Webhook(hookSecret);
    
    const {
      user,
      email_data: { token, token_hash, redirect_to, email_action_type, site_url },
    } = wh.verify(payload, headers) as {
      user: {
        email: string;
      };
      email_data: {
        token: string;
        token_hash: string;
        redirect_to: string;
        email_action_type: string;
        site_url: string;
      };
    };

    let subject = "";
    let htmlContent = "";

    // Handle different email types
    switch (email_action_type) {
      case "signup":
        subject = "Welcome to Noteily - Confirm your email";
        htmlContent = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #333; font-size: 32px; margin: 0; font-weight: 300;">Noteily</h1>
              <p style="color: #666; margin: 5px 0 0 0; font-size: 14px;">"Write What You Love"</p>
            </div>
            
            <h2 style="color: #333; font-size: 24px; margin-bottom: 20px;">Welcome to Noteily!</h2>
            
            <p style="color: #333; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
              Thank you for signing up! Click the button below to confirm your email address and start writing beautiful notes.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${site_url}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to}" 
                 style="background-color: #0066cc; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block;">
                Confirm Email Address
              </a>
            </div>
            
            <p style="color: #666; font-size: 14px; line-height: 1.5; margin-top: 30px;">
              If the button doesn't work, copy and paste this link into your browser:<br>
              <a href="${site_url}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to}" style="color: #0066cc; word-break: break-all;">
                ${site_url}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to}
              </a>
            </p>
            
            <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 40px;">
              <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
                This email was sent from Noteily. If you didn't sign up for an account, you can safely ignore this email.
              </p>
            </div>
          </div>
        `;
        break;

      case "recovery":
        subject = "Reset your Noteily password";
        htmlContent = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #333; font-size: 32px; margin: 0; font-weight: 300;">Noteily</h1>
              <p style="color: #666; margin: 5px 0 0 0; font-size: 14px;">"Write What You Love"</p>
            </div>
            
            <h2 style="color: #333; font-size: 24px; margin-bottom: 20px;">Reset Your Password</h2>
            
            <p style="color: #333; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
              We received a request to reset your password. Click the button below to choose a new password.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${site_url}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to}" 
                 style="background-color: #0066cc; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block;">
                Reset Password
              </a>
            </div>
            
            <p style="color: #666; font-size: 14px; line-height: 1.5; margin-top: 30px;">
              If the button doesn't work, copy and paste this link into your browser:<br>
              <a href="${site_url}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to}" style="color: #0066cc; word-break: break-all;">
                ${site_url}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to}
              </a>
            </p>
            
            <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 40px;">
              <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
                If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.
              </p>
            </div>
          </div>
        `;
        break;

      case "email_change":
        subject = "Confirm your new email address - Noteily";
        htmlContent = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #333; font-size: 32px; margin: 0; font-weight: 300;">Noteily</h1>
              <p style="color: #666; margin: 5px 0 0 0; font-size: 14px;">"Write What You Love"</p>
            </div>
            
            <h2 style="color: #333; font-size: 24px; margin-bottom: 20px;">Confirm Email Change</h2>
            
            <p style="color: #333; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
              Please confirm your new email address by clicking the button below.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${site_url}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to}" 
                 style="background-color: #0066cc; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block;">
                Confirm New Email
              </a>
            </div>
            
            <p style="color: #666; font-size: 14px; line-height: 1.5; margin-top: 30px;">
              If the button doesn't work, copy and paste this link into your browser:<br>
              <a href="${site_url}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to}" style="color: #0066cc; word-break: break-all;">
                ${site_url}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to}
              </a>
            </p>
            
            <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 40px;">
              <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
                If you didn't request this email change, please contact support immediately.
              </p>
            </div>
          </div>
        `;
        break;

      default:
        subject = "Noteily - Account Verification";
        htmlContent = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #333; font-size: 32px; margin: 0; font-weight: 300;">Noteily</h1>
              <p style="color: #666; margin: 5px 0 0 0; font-size: 14px;">"Write What You Love"</p>
            </div>
            
            <p style="color: #333; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
              Please click the link below to verify your account:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${site_url}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to}" 
                 style="background-color: #0066cc; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block;">
                Verify Account
              </a>
            </div>
          </div>
        `;
    }

    const { error } = await resend.emails.send({
      from: "Noteily <help@noteily.app>",
      to: [user.email],
      subject: subject,
      html: htmlContent,
    });

    if (error) {
      console.error("Error sending email:", error);
      throw error;
    }

    console.log("Email sent successfully to:", user.email);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-auth-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});