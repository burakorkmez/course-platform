import type { NextRequest } from "next/server"
import { auth } from "@/lib/auth/server"

// Optimistic redirect to /sign-in for signed-out visitors. Pages and actions still check the session themselves.
// ?next= carries them back afterwards; the sign-in page validates it.
export default function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  return auth.middleware({ loginUrl: `/sign-in?next=${encodeURIComponent(pathname + search)}` })(request)
}

export const config = {
  matcher: ["/dashboard/:path*", "/account/:path*", "/admin/:path*"],
}
