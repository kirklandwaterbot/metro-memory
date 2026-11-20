import path from 'path'
import { fileURLToPath } from 'url'

/** @type {import('next').NextConfig} */
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const isCapacitorExport = process.env.METRO_MEMORY_CAPACITOR_EXPORT === '1'
const assetBaseUrl = process.env.METRO_ASSET_BASE_URL?.trim().replace(/\/+$/, '')
const reactIconsRoot = path.join(__dirname, 'node_modules', 'react-icons')
const reactIconsMdPath = `./${path
  .relative(__dirname, path.join(reactIconsRoot, 'md', 'index.mjs'))
  .replaceAll('\\', '/')}`

const LARGE_GAME_EXCLUDES = [
  './city-registry/**/*',
  './metro-memory-old/**/*',
  './mobile/**/*',
  './package-lock.json',
  './public/city-data/**/*',
  './public/city-cards/**/*',
  './public/city-icons/**/*',
  './public/images/**/*',
  './public/offline-manifest.json',
  './public/fonts/**/*',
  './public/stripmap/**/*',
  './src/app/(game)/**/*',
  './src/images/photos/**/*',
]

const REMOTE_PUBLIC_ASSET_EXCLUDES = [
  './public/city-data/**/*',
  './public/city-cards/**/*',
  './public/images/**/*',
]

const nextConfig = {
  pageExtensions: ['js', 'jsx', 'ts', 'tsx'],
  staticPageGenerationTimeout: 30,
  outputFileTracingIncludes: {
    '/api/city-icon/[slug]': ['./public/city-icons/*.ico'],
    '/api/custom/city-lines/[slug]': [
      './public/city-data/*.json',
      './src/app/(game)/**/data/lines.json',
      './src/app/(game)/**/config.ts',
    ],
  },
  outputFileTracingExcludes: {
    '*': [
      './prisma/**/*.db',
      './prisma/**/*.sqlite',
      ...(assetBaseUrl ? REMOTE_PUBLIC_ASSET_EXCLUDES : []),
    ],
    // Keep the icons this route reads (they were excluded along with the rest
    // of public/, so every city fell back to the default icon).
    '/api/city-icon/[slug]': LARGE_GAME_EXCLUDES.filter(
      (pattern) => pattern !== './public/city-icons/**/*',
    ),
    '/api/dev/site-version': LARGE_GAME_EXCLUDES,
    '/api/auth/register': LARGE_GAME_EXCLUDES,
    '/api/auth/forgot-password': LARGE_GAME_EXCLUDES,
    '/api/auth/change-email': LARGE_GAME_EXCLUDES,
    '/api/auth/resend-verification': LARGE_GAME_EXCLUDES,
  },
  output: isCapacitorExport ? 'export' : 'standalone',
  trailingSlash: isCapacitorExport,
  distDir: isCapacitorExport ? '.next-mobile' : '.next',
  env: {
    NEXT_PUBLIC_METRO_MOBILE_APP:
      process.env.NEXT_PUBLIC_METRO_MOBILE_APP ?? (isCapacitorExport ? '1' : ''),
    NEXT_PUBLIC_APP_VERSION: process.env.npm_package_version ?? '0.1.0',
  },
  images: {
    qualities: [75, 100],
    localPatterns: [
      {
        pathname: '/favicon.ico',
      },
      {
        pathname: '/icon.ico',
      },
      {
        pathname: '/images/**',
      },
      {
        pathname: '/city-cards/**',
      },
      {
        pathname: '/api/city-icon/**',
      },
    ],
  },
  experimental: {
    cpus: 1,
    memoryBasedWorkersCount: true,
    parallelServerBuildTraces: false,
    parallelServerCompiles: false,
    webpackBuildWorker: false,
    webpackMemoryOptimizations: true,
  },
  turbopack: {
    resolveAlias: {
      react: './node_modules/react',
      'react-dom': './node_modules/react-dom',
      'react-icons': './node_modules/react-icons',
      'react-icons/md': reactIconsMdPath,
    },
  },
  webpack(config) {
    config.resolve.alias = {
      ...config.resolve.alias,
      'react-icons': reactIconsRoot,
      'react-icons/md': path.join(reactIconsRoot, 'md', 'index.mjs'),
    }
    return config
  },
  async redirects() {
    return [
      // Dujiangyan's M-TR tram is now part of the Chengdu game.
      {
        source: '/asia/china/dujiangyan',
        destination: '/asia/china/chengdu',
        permanent: false,
      },
    ]
  },
  async rewrites() {
    // Fallback rewrites: a file that is in the deployment (e.g. a preview's
    // own city data) is served first; anything missing comes from the asset
    // host, which is only synced from main.
    return {
      beforeFiles: [],
      fallback: assetBaseUrl
        ? [
            {
              source: '/images/:path*',
              destination: `${assetBaseUrl}/images/:path*`,
            },
            {
              source: '/city-cards/:path*',
              destination: `${assetBaseUrl}/city-cards/:path*`,
            },
            {
              source: '/city-data/:path*',
              destination: `${assetBaseUrl}/city-data/:path*`,
            },
          ]
        : [],
      afterFiles: [],
    }
  },
}

export default nextConfig
