/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export: the backend serves these files, so production is one origin and one port.
  output: 'export',
  images: { unoptimized: true },
  reactStrictMode: true,
};

export default nextConfig;
