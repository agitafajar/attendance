import type { NextConfig } from "next";

const isDevelopment = process.env.NODE_ENV !== "production";
const apiUpstreamUrl =
  process.env.API_UPSTREAM_URL?.replace(/\/$/, "") ??
  "https://api.financialku.online/api/v1";

const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  `script-src 'self' 'unsafe-inline'${isDevelopment ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://api.financialku.online",
  "font-src 'self' data:",
  `connect-src 'self' https://api.financialku.online${
    isDevelopment ? " http://localhost:* http://127.0.0.1:* ws://localhost:* ws://127.0.0.1:*" : ""
  }`,
  "form-action 'self'",
  ...(isDevelopment ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: contentSecurityPolicy,
          },
          {
            key: "Referrer-Policy",
            value: "no-referrer",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          ...(isDevelopment
            ? []
            : [
                {
                  key: "Strict-Transport-Security",
                  value: "max-age=31536000; includeSubDomains",
                },
              ]),
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/api/backend/:path*",
        destination: `${apiUpstreamUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;
