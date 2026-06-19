/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable the instrumentation hook (startup env validation).
  experimental: {
    instrumentationHook: true,
  },
};

export default nextConfig;
