import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { safeRedirectPath } from "@/lib/safe-redirect";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh the session if expired — required for Server Components
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isLoginPage = path === "/login";
  // Public, shareable player pages — the links teachers send to students.
  const isPlayer = path.startsWith("/p/");
  // The raw activity HTML served to the sandboxed iframe (students aren't signed in).
  const isActivityFile = path.startsWith("/a/");
  // Students enter a class code here — no login.
  const isJoin = path === "/join";
  // Stripe posts subscription events here — no user session.
  const isStripeWebhook = path === "/api/stripe/webhook";
  const isPublic =
    path === "/" ||
    isLoginPage ||
    isPlayer ||
    isActivityFile ||
    isJoin ||
    isStripeWebhook;

  // Not signed in + accessing a protected route -> /login, remembering where
  // they were headed so we can bounce them back after sign-in.
  if (!user && !isPublic) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", path + request.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  // Signed in + on /login -> straight to their destination (or the dashboard)
  if (user && isLoginPage) {
    const next = safeRedirectPath(request.nextUrl.searchParams.get("next"));
    return NextResponse.redirect(new URL(next ?? "/dashboard", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
