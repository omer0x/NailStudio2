import { createClient } from 'npm:@supabase/supabase-js@2.39.7'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    })
  }

  try {
    // Create a Supabase client with the service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Get the Authorization header from the request
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Verify the user is authenticated and is an admin
    const userResponse = await supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''))
    if (userResponse.error) {
      throw new Error('Invalid user token')
    }

    // Check if the user is an admin
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('is_admin')
      .eq('id', userResponse.data.user.id)
      .single()

    if (profileError || !profile?.is_admin) {
      throw new Error('User is not an admin')
    }

    // Fetch appointments with user profiles
    const { data: appointments, error: appointmentsError } = await supabaseAdmin
      .from('appointments')
      .select(`
        id,
        date,
        status,
        notes,
        created_at,
        user_profiles (
          id,
          full_name,
          phone
        ),
        time_slot:time_slots (
          start_time
        ),
        services:appointment_services (
          service:services (
            name,
            price
          )
        )
      `)
      .order('date', { ascending: false })

    if (appointmentsError) {
      throw appointmentsError
    }

    // Fetch all users from auth.users to get emails
    const { data: { users }, error: usersError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (usersError) {
      throw usersError
    }

    // Combine the data
    const appointmentsWithUserInfo = appointments.map(appointment => {
      const authUser = users.find(user => user.id === appointment.user_profiles?.id)
      return {
        ...appointment,
        user_profiles: {
          ...appointment.user_profiles,
          email: authUser?.email
        }
      }
    })

    return new Response(JSON.stringify(appointmentsWithUserInfo), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 403,
    })
  }
})