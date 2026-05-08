import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error && data.user) {
      // Check if profile is complete
      const { data: profile } = await supabase
        .from('profiles')
        .select('height_cm')
        .eq('id', data.user.id)
        .single()

      if (!profile?.height_cm) {
        return NextResponse.redirect(`${origin}/onboarding`)
      }
      return NextResponse.redirect(`${origin}/dashboard`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`)
}
