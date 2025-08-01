import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  const { method } = req

  // Only allow POST requests
  if (method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    // Create Supabase client with service role key for admin operations
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    console.log('Starting cleanup of old deleted notes...')

    // Call the cleanup function
    const { data, error } = await supabase.rpc('cleanup_old_deleted_notes')

    if (error) {
      console.error('Error cleaning up deleted notes:', error)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to cleanup deleted notes', 
          details: error.message 
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    const deletedCount = data || 0
    console.log(`Cleanup completed. Permanently deleted ${deletedCount} notes.`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        deletedCount,
        message: `Successfully cleaned up ${deletedCount} old deleted notes`
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Unexpected error during cleanup:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message 
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
})