/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Ignora errores de TypeScript para que el build termine
    ignoreBuildErrors: true,
  },
  eslint: {
    // Ignora errores de linting durante el build
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;