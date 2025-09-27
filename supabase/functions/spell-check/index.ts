import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content, action = 'spell', instructions, title } = await req.json();
    
    if (!content || typeof content !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Content is required' }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      console.error('OPENAI_API_KEY is not set');
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`${action} checking text:`, content.substring(0, 100) + '...');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-nano-2025-08-07',
        messages: [
          {
            role: 'system',
            content: getSystemPrompt(action)
          },
          {
            role: 'user',
            content: getUserPrompt(action, content, instructions, title)
          }
        ],
        max_completion_tokens: Math.min(4000, content.length * 3),
        temperature: 1.0
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', response.status, errorData);
      return new Response(
        JSON.stringify({ error: 'Failed to process spell check' }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const data = await response.json();
    let result = data.choices[0].message.content;

    console.log(`${action} completed successfully. Result:`, result);

    // Handle rewrite response that might include title
    if (action === 'rewrite') {
      if (result.includes('TITLE:')) {
        const lines = result.split('\n');
        const titleLine = lines.find((line: string) => line.startsWith('TITLE:'));
        const newTitle = titleLine ? titleLine.replace('TITLE:', '').trim() : null;
        const correctedContent = lines.filter((line: string) => !line.startsWith('TITLE:')).join('\n').trim();
        
        return new Response(
          JSON.stringify({ 
            correctedContent,
            newTitle,
            hasChanges: true
          }), 
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      } else {
        // Rewrite without title change
        return new Response(
          JSON.stringify({ 
            correctedContent: result,
            hasChanges: true
          }), 
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    }

    return new Response(
      JSON.stringify({ 
        correctedContent: result,
        hasChanges: content !== result
      }), 
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in spell-check function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function getSystemPrompt(action: string): string {
  switch (action) {
    case 'spell':
      return `You are a spell checker. Your ONLY task is to fix spelling errors in the provided text.

CRITICAL RULES:
- ONLY fix spelling errors
- Do NOT fix grammar, punctuation, or style
- Do NOT rewrite, rephrase, or change the meaning
- Keep all formatting, line breaks, and structure exactly the same
- If there are no spelling errors, return the text exactly as provided
- Return ONLY the corrected text, no explanations`;

    case 'grammar':
      return `You are a grammar checker. Your task is to fix grammar and punctuation errors in the provided text.

CRITICAL RULES:
- Fix grammar mistakes and punctuation errors
- Do NOT fix spelling (assume it's correct)
- Do NOT rewrite, rephrase, or change the meaning
- Keep the original style, tone, and voice
- Keep all formatting, line breaks, and structure exactly the same
- If there are no grammar errors, return the text exactly as provided
- Return ONLY the corrected text, no explanations`;

    case 'rewrite':
      return `You are a professional writer and editor. Your task is to rewrite the provided content according to the user's specific instructions while maintaining the original structure and format.

INSTRUCTIONS:
- Follow the user's rewriting instructions precisely
- Maintain the original HTML formatting and structure unless asked to change it
- If there's a title, you may update it to match the new content
- If you update the title, format your response as:
  TITLE: [new title]
  [rewritten content]
- Otherwise, just return the rewritten content
- Be creative but stay true to the original intent unless instructed otherwise`;

    default:
      return `You are a text processor. Process the provided text according to the specified action.`;
  }
}

function getUserPrompt(action: string, content: string, instructions?: string, title?: string): string {
  switch (action) {
    case 'rewrite':
      let prompt = `Rewrite the following content according to these instructions: "${instructions}"\n\n`;
      if (title) {
        prompt += `Title: ${title}\n`;
      }
      prompt += `Content: ${content}`;
      return prompt;
    
    default:
      return content;
  }
}