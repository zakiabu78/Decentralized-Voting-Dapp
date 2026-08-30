/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Dit à webpack d'ignorer le module 'electron' côté client
      config.resolve.fallback = {
        ...config.resolve.fallback,
        electron: false,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'gateway.pinata.cloud',
      },
      {
        protocol: 'https',
        hostname: 'ipfs.infura.io',
      },
    ],
  },
};

export default nextConfig;