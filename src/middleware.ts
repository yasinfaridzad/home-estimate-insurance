import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const isAuthPage = req.nextUrl.pathname.startsWith('/auth')
        if (isAuthPage) {
          return true
        }
        return !!token
      }
    },
  }
)

export const config = {
  matcher: [
    "/",
    "/scan",
    "/reports",
    "/settings",
    "/auth/:path*",
    "/api/scan/:path*",
    "/api/reports/:path*",
    "/api/settings/:path*"
  ]
} 