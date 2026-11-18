/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Subida de imágenes desde /admin: hasta 4 archivos de 4 MB por envío, más el margen de multipart.
    serverActions: { bodySizeLimit: "17mb" },
  },
};

export default nextConfig;
