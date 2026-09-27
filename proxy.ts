import { auth } from "@/lib/auth/server"

// Optimistic redirect to /sign-in for signed-out visitors. Pages and actions still check the session themselves.
export default auth.middleware({ loginUrl: "/sign-in" })

export const config = {
  matcher: ["/dashboard/:path*", "/account/:path*", "/admin/:path*"],
}
