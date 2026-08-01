import type { NextConfig } from "next";

/**
 * SECURITY HEADERS
 * ================
 * The application returned none. Not a weak set — none: no HSTS, no nosniff, no frame protection, no
 * referrer policy, no CSP. Verified by reading the response headers off a running server rather than
 * by looking for the configuration that would have set them.
 *
 * The one that matters most here is the frame policy. A marketplace whose pages can be embedded in
 * an invisible iframe can be clickjacked, and the actions worth stealing on this platform are a
 * dealer publishing stock and a buyer submitting their telephone number.
 *
 * Referrer-Policy has a second job specific to this codebase. Enquiries record `source_page` from the
 * `Referer` header, and the default policy sends full URLs — including search query strings — to any
 * third-party origin a visitor clicks through to. `strict-origin-when-cross-origin` keeps the path
 * for our own requests, so `source_page` still works, and sends only the origin to anyone else.
 */

const supabaseOrigin = (() => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!url) return "";
  try {
    return new URL(url).origin;
  } catch {
    return "";
  }
})();

/*
  ABOUT `unsafe-inline` ON SCRIPTS
  ================================
  It is present and it is a real weakening. Next injects inline bootstrap and hydration scripts on
  every page, and the alternative — per-request nonces — requires generating one in the proxy and
  threading it through every rendered document. That is a change to how every page is served, on the
  eve of a deployment, in a programme whose brief is explicitly not to change how the application
  works.

  What the policy still buys with `unsafe-inline` in place: no script may be *loaded* from an origin
  we did not name, no page may be framed, no form may post to a foreign origin, and no plugin may
  run. That blocks the injected-third-party-script class of attack even though it does not block
  injected inline script.

  Recorded here rather than in a report because the next person to tighten this needs to know why it
  was left, and a CSP with a silent compromise in it is how a false sense of coverage is created.
*/
const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  /* `unsafe-eval` in development only. Turbopack's hot reloader evaluates modules, and without it
     the dev console fills with eval violations that are not real findings — noise that trains
     whoever is reading it to ignore CSP messages, including the genuine ones. A production build
     was checked with the strict policy: zero violations, zero console errors, pages hydrate. */
  `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""}`,
  // Tailwind and the design tokens emit inline style attributes; blocking them breaks every page.
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  `img-src 'self' data: blob:${supabaseOrigin ? ` ${supabaseOrigin}` : ""}`,
  `connect-src 'self'${supabaseOrigin ? ` ${supabaseOrigin} wss://${supabaseOrigin.replace(/^https?:\/\//, "")}` : ""}`,
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    // Nothing on this platform asks for any of these. Naming them denies them to injected code too.
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
  },
  {
    /* Two years, subdomains included. Browsers ignore this over plain HTTP, so it is inert in
       development and takes effect the moment the site is served over TLS. `preload` is deliberately
       omitted: submission to the preload list is difficult to reverse, and that is a decision to
       take once the production domain is settled, not as a side effect of a config file. */
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains",
  },
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [],
  },
  experimental: {
    optimizePackageImports: ["@supabase/supabase-js"],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
