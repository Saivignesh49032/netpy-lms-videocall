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
    const isPublicRoute = request.nextUrl.pathname.startsWith('/sign-in') || request.nextUrl.pathname.startsWith('/sign-up')

    if (!user && !isPublicRoute) {
      const url = request.nextUrl.clone()
      url.pathname = '/sign-in'
      return NextResponse.redirect(url)
    }

    if (user && isPublicRoute) {
      const url = request.nextUrl.clone()
      url.pathname = '/'
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
