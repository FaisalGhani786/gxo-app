import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Nearly every page reads the Supabase session cookie, so pages render per
  // request (the pre-Cache-Components model).
  cacheComponents: false,
};

export default nextConfig;
