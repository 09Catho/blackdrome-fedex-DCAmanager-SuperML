/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  webpack: (config, { isServer }) => {
    // Exclude Supabase Edge Functions from build (they're deployed separately to Supabase)
    config.module.rules.push({
      test: /supabase\/functions\/.*/,
      use: 'ignore-loader',
    });
    return config;
  },
  // Exclude supabase functions directory from TypeScript checking
  typescript: {
    ignoreBuildErrors: false,
  },
  // Exclude from file watching
  watchOptions: {
    ignored: ['**/supabase/functions/**'],
  },
};

module.exports = nextConfig;
