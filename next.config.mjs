const backendOrigin = process.env.BACKEND_ORIGIN || "http://127.0.0.1:5080";

/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      { source: "/api.php", destination: `${backendOrigin}/api.php` },
      { source: "/sse.php", destination: `${backendOrigin}/sse.php` },
      { source: "/api/:path*", destination: `${backendOrigin}/api/:path*` }
    ];
  }
};

export default nextConfig;
