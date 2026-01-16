import { NextResponse, type NextRequest } from "next/server"

/**
 * Middleware for JWT-based route protection
 * Replaces Supabase session middleware
 */
export function middleware(request: NextRequest) {
    const token = request.cookies.get('auth_token')?.value

    // Protect dashboard routes - redirect to login if not authenticated
    if (request.nextUrl.pathname.startsWith("/dashboard") && !token) {
        const url = request.nextUrl.clone()
        url.pathname = "/auth/login"
        return NextResponse.redirect(url)
    }

    // Redirect authenticated users away from auth pages
    if (
        (request.nextUrl.pathname.startsWith("/auth/login") ||
            request.nextUrl.pathname.startsWith("/auth/sign-up")) &&
        token
    ) {
        const url = request.nextUrl.clone()
        url.pathname = "/dashboard"
        return NextResponse.redirect(url)
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
}
