import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
// Configure which paths need authentication
const protectedPaths = [
  '/dashboard',
  '/settings',
  '/orders',
  '/subscriptions'
]

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname
  
  // Check if the path requires authentication
  const isProtectedPath = protectedPaths.some(protectedPath => 
    path.startsWith(protectedPath)
  )

  if (!isProtectedPath) {
    return NextResponse.next()
  }

  // Get the access token from the Authorization header
  const accessToken = request.headers.get('Authorization')?.split(' ')[1]

  // Redirect unauthenticated users to login page
  if (!accessToken) {
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('callbackUrl', path)
    return NextResponse.redirect(loginUrl)
  }

  // Add the token to the request headers
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('Authorization', `Bearer ${accessToken}`)

  return NextResponse.next({
    request: {
      headers: requestHeaders
    }
  })
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}