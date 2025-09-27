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

    // Clean and process the response
    let cleanedResult = result.trim();
    let newTitle = null;

    // Handle title extraction for rewrite actions
    if (action === 'rewrite' && cleanedResult.includes('TITLE:')) {
      const lines = cleanedResult.split('\n');
      const titleLineIndex = lines.findIndex((line: string) => line.trim().startsWith('TITLE:'));
      
      if (titleLineIndex !== -1) {
        const titleLine = lines[titleLineIndex];
        newTitle = titleLine.replace(/^TITLE:\s*/, '').trim();
        
        // Remove the title line and any empty lines after it
        lines.splice(titleLineIndex, 1);
        while (lines[titleLineIndex] && lines[titleLineIndex].trim() === '') {
          lines.splice(titleLineIndex, 1);
        }
        
        cleanedResult = lines.join('\n').trim();
      }
    }

    // Build response data
    const responseData: any = {
      correctedContent: cleanedResult,
      hasChanges: cleanedResult !== content.trim()
    };

    // Add title only if it was extracted
    if (newTitle) {
      responseData.newTitle = newTitle;
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
- Return ONLY the corrected text, no explanations
- Maintain exact character count and positioning when possible`;

    case 'grammar':
      return `You are a grammar checker. Your task is to fix grammar and punctuation errors in the provided text.

CRITICAL RULES:
- Fix grammar mistakes and punctuation errors
- Do NOT fix spelling (assume it's correct)
- Do NOT rewrite, rephrase, or change the meaning
- Keep the original style, tone, and voice
- Keep all formatting, line breaks, and structure exactly the same
- If there are no grammar errors, return the text exactly as provided
- Return ONLY the corrected text, no explanations
- Maintain exact character positioning and line breaks`;

    case 'rewrite':
      return `You are a professional writer and editor. Your task is to rewrite the provided content according to the user's specific instructions while maintaining the document's structural integrity.

CRITICAL FORMATTING RULES:
- Read the COMPLETE context including title, original HTML, and selected text carefully
- Preserve the document's heading hierarchy and formatting patterns EXACTLY
- Respect line breaks as semantic paragraph separators - DO NOT remove them
- When working with titles: only change the title if explicitly asked to do so
- When working with selected text: ensure it flows with the surrounding context
- Maintain consistent tone and style with the rest of the document

RESPONSE FORMAT:
- If title should be changed: Start with "TITLE: [new title]" on its own line, then content
- Otherwise: Return only the rewritten content
- Preserve all line breaks and paragraph structure from the original
- Do not add explanations or metadata`;

    default:
      return `You are a text processor. Process the provided text according to the specified action.`;
  }
}

function getUserPrompt(action: string, content: string, instructions?: string, title?: string, originalHTML?: string, isSelectedText?: boolean): string {
  switch (action) {
    case 'rewrite':
      let prompt = `INSTRUCTIONS: ${instructions || 'Improve and enhance the content'}\n\n`;
      
      // Provide clear context about the document structure
      if (title) {
        prompt += `DOCUMENT TITLE: "${title}"\n`;
        prompt += `(Only change the title if the instructions specifically ask for a title change)\n\n`;
      }
      
      if (originalHTML && originalHTML.trim()) {
        const htmlStructure = extractFormatContext(originalHTML);
        prompt += `DOCUMENT STRUCTURE & FORMAT:\n${htmlStructure}\n\n`;
      }
      
      if (isSelectedText) {
        prompt += `TASK: Rewrite only the selected portion below while maintaining consistency with the document structure:\n\n`;
        prompt += `SELECTED TEXT:\n${content}\n\n`;
        prompt += `IMPORTANT: Return only the rewritten selected text. Do not include the title or surrounding content.`;
      } else {
        prompt += `TASK: Rewrite the content below according to the instructions:\n\n`;
        prompt += `CONTENT:\n${content}\n\n`;
        prompt += `IMPORTANT: Preserve all line breaks and paragraph structure. Only return the rewritten content (and title if changed).`;
      }
      
      return prompt;
    
    case 'spell':
    case 'grammar':
      return `Fix ${action} issues in this text while preserving ALL formatting and structure:\n\n${content}`;
    
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