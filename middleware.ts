import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) { return request.cookies.get(name)?.value },
          set(name: string, value: string, options: CookieOptions) {
            request.cookies.set({ name, value, ...options })
            supabaseResponse = NextResponse.next({ request: { headers: request.headers } })
            supabaseResponse.cookies.set({ name, value, ...options })
          },
          remove(name: string, options: CookieOptions) {
            request.cookies.set({ name, value: '', ...options })
            supabaseResponse = NextResponse.next({ request: { headers: request.headers } })
            supabaseResponse.cookies.set({ name, value: '', ...options })
          },
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()
    const isPublicRoute = request.nextUrl.pathname.startsWith('/sign-in') || 
                          request.nextUrl.pathname.startsWith('/sign-up') || 
                          request.nextUrl.pathname.startsWith('/invite/accept') ||
                          request.nextUrl.pathname.startsWith('/api/invites') ||
                          request.nextUrl.pathname.startsWith('/api/lms') ||
                          request.nextUrl.pathname.startsWith('/setup') ||
                          request.nextUrl.pathname.startsWith('/api/auth/setup') ||
                          request.nextUrl.pathname.startsWith('/api/webhooks')

    const isRootRoute = request.nextUrl.pathname === '/'
    const isDashboardRoot = request.nextUrl.pathname === '/dashboard'

    if (!user && !isPublicRoute) {
      const url = request.nextUrl.clone()
      url.pathname = '/sign-in'
      return NextResponse.redirect(url)
    }

    // Direct Zero-Flash Routing
    // Instead of rendering the `/dashboard` loader, we instantly redirect them to `/dashboard/staff` etc.
    // Logic: If user is logged in AND (on a public route OR at root OR at /dashboard) AND NOT on /invite/accept
    const isInviteAccept = request.nextUrl.pathname.startsWith('/invite/accept')
    const isApiRoute = request.nextUrl.pathname.startsWith('/api')
    
    if (user && (isPublicRoute || isRootRoute || isDashboardRoot) && !isInviteAccept && !isApiRoute) {
      const rawRole = user.app_metadata?.role || user.user_metadata?.role || 'student'
      
      // Role allowlist validation to prevent path traversal
      const VALID_ROLES = ['super_admin', 'org_admin', 'staff', 'student']
      const role = VALID_ROLES.includes(rawRole) ? rawRole : 'student'
      
      const dashboardPath = `/dashboard/${role.replace(/_/g, '-')}`
      
      const url = request.nextUrl.clone()
      url.pathname = dashboardPath
      return NextResponse.redirect(url)
    }

    return supabaseResponse
  } catch (e) {
    return supabaseResponse
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
