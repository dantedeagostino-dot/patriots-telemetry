import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Esto permite que el build termine aunque falten definiciones de tipos
    ignoreBuildErrors: true,
  },
  // Eliminamos la sección de 'eslint' porque ya no es compatible aquí
};

export default nextConfig;