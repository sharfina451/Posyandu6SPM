import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  // Check if using placeholder URL to avoid hang during dev/testing (T-E0.11 / T-E1.3)
  const isPlaceholder =
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')

  let user = null

  if (!isPlaceholder) {
    try {
      const {
        data: { user: supabaseUser },
      } = await supabase.auth.getUser()
      user = supabaseUser
    } catch {
      user = null
    }
  }

  // Enforce 4-hour max session duration (T-E1.3)
  const sessionStartTime = request.cookies.get('session_start_time')?.value
  const now = Math.floor(Date.now() / 1000)

  if (user) {
    if (sessionStartTime) {
      const elapsedSeconds = now - parseInt(sessionStartTime, 10)
      const maxSessionSeconds = 4 * 60 * 60 // 4 jam

      if (elapsedSeconds > maxSessionSeconds) {
        // Force sign out
        await supabase.auth.signOut()
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        const redirectResponse = NextResponse.redirect(url)
        redirectResponse.cookies.delete('session_start_time')
        return redirectResponse
      }
    } else {
      // Set session start time cookie jika belum ada
      response.cookies.set('session_start_time', now.toString(), {
        maxAge: 4 * 60 * 60, // 4 jam
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
      })
    }
  } else {
    // Bersihkan cookie jika tidak terautentikasi
    if (sessionStartTime) {
      response.cookies.delete('session_start_time')
    }
  }

  // Proteksi rute (T-E1.2)
  const path = request.nextUrl.pathname

  // Rute terproteksi: dasbor, admin, dan beranda utama
  const isProtectedRoute =
    path === '/' || path.startsWith('/dashboard') || path.startsWith('/admin')

  if (isProtectedRoute) {
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
  }

  // Rute tamu: cegah pengguna yang sudah login ke halaman login
  if (path.startsWith('/login')) {
    if (user) {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - SVG, PNG, JPG, JPEG, GIF, WEBP files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
