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
    const { content, action = 'spell', instructions, title, originalHTML, isSelectedText = false } = await req.json();
    
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
        model: 'gpt-4o-mini', // Fast and efficient model
        messages: [
          {
            role: 'system',
            content: getSystemPrompt(action)
          },
          {
            role: 'user',
            content: getUserPrompt(action, content, instructions, title, originalHTML, isSelectedText)
          }
        ],
        max_tokens: 1500, // Fast responses
        temperature: 0.3, // More focused output
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
    let result = data.choices[0]?.message?.content;

    console.log(`${action} completed successfully. Raw result:`, result);
    console.log('Data choices:', data.choices);

    // Ensure we have content
    if (!result || result.trim() === '') {
      console.error('No content received from AI');
      return new Response(
        JSON.stringify({ error: 'No rewritten content received' }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Simple unified response for all actions
    const responseData: any = {
      correctedContent: result.trim(),
      hasChanges: action === 'rewrite' || content !== result.trim()
    };

    // Add newTitle only if it's a rewrite with title change
    if (action === 'rewrite' && result.includes('TITLE:')) {
      const lines = result.split('\n');
      const titleLine = lines.find((line: string) => line.startsWith('TITLE:'));
      if (titleLine) {
        responseData.newTitle = titleLine.replace('TITLE:', '').trim();
        responseData.correctedContent = lines.filter((line: string) => !line.startsWith('TITLE:')).join('\n').trim();
      }
    }

    console.log('Sending response:', responseData);

    return new Response(
      JSON.stringify(responseData), 
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
      return `You are a professional writer and editor. Your task is to rewrite the provided content according to the user's specific instructions while maintaining document structure and formatting consistency.

CRITICAL FORMATTING RULES:
- Preserve existing HTML structure and formatting patterns from the document
- Maintain consistent heading hierarchy (H1, H2, H3, etc.) that matches the document style
- Respect line breaks as semantic blocks - they separate ideas and should be preserved
- Keep consistent formatting with the rest of the document
- Use the same title/heading style as found in the original document
- For selected text: ensure the rewritten text flows naturally with surrounding content

INSTRUCTIONS:
- Follow the user's rewriting instructions precisely
- If there's a title, you may update it to match the new content
- If you update the title, format your response as:
  TITLE: [new title]
  [rewritten content]
- Otherwise, just return the rewritten content
- Be creative but maintain document consistency and flow`;

    default:
      return `You are a text processor. Process the provided text according to the specified action.`;
  }
}

function getUserPrompt(action: string, content: string, instructions?: string, title?: string, originalHTML?: string, isSelectedText?: boolean): string {
  switch (action) {
    case 'rewrite':
      let prompt = `Rewrite the following content according to these instructions: "${instructions}"\n\n`;
      
      if (title) {
        prompt += `Current document title: ${title}\n\n`;
      }
      
      if (originalHTML && isSelectedText) {
        // Extract formatting context from the original HTML
        const htmlStructure = extractFormatContext(originalHTML);
        prompt += `DOCUMENT CONTEXT:\n${htmlStructure}\n\n`;
        prompt += `SELECTED TEXT TO REWRITE:\n${content}\n\n`;
        prompt += `Note: This is selected text from within a larger document. Ensure the rewritten text maintains consistency with the document's existing formatting and style patterns.`;
      } else if (originalHTML) {
        const htmlStructure = extractFormatContext(originalHTML);
        prompt += `DOCUMENT FORMATTING CONTEXT:\n${htmlStructure}\n\n`;
        prompt += `CONTENT TO REWRITE:\n${content}`;
      } else {
        prompt += `${content}`;
      }
      
      return prompt;
    
    default:
      return content;
  }
}

function extractFormatContext(html: string): string {
  if (!html) return "No formatting context available.";
  
  // Extract heading structure and formatting patterns
  const headings = html.match(/<h[1-6][^>]*>.*?<\/h[1-6]>/gi) || [];
  const hasLists = html.includes('<ul>') || html.includes('<ol>');
  const hasBlockquotes = html.includes('<blockquote>');
  const hasBold = html.includes('<strong>') || html.includes('<b>');
  const hasItalic = html.includes('<em>') || html.includes('<i>');
  
  let context = "Document formatting patterns:\n";
  
  if (headings.length > 0) {
    context += `- Uses headings: ${headings.slice(0, 3).map(h => h.replace(/<[^>]*>/g, '')).join(', ')}${headings.length > 3 ? '...' : ''}\n`;
  }
  
  if (hasLists) context += "- Contains lists (maintain list formatting)\n";
  if (hasBlockquotes) context += "- Uses blockquotes\n";
  if (hasBold) context += "- Uses bold text for emphasis\n";
  if (hasItalic) context += "- Uses italic text for emphasis\n";
  
  // Check for line break patterns
  const lineBreaks = (html.match(/<br\s*\/?>/gi) || []).length;
  if (lineBreaks > 0) {
    context += `- Uses line breaks as semantic separators (${lineBreaks} breaks found)\n`;
  }
  
  context += "- Maintain consistent formatting with these patterns";
  
  return context;
}