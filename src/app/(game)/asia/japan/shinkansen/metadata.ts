import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('shinkansen', {
  icons: {
    icon: '/api/city-icon/shinkansen',
    apple: '/api/city-icon/shinkansen',
  },
  title: 'Shinkansen Memory',
  description: 'How many Shinkansen stations across Japan can you name from memory?',
  openGraph: {
    title: 'Shinkansen Memory',
    description: 'How many Shinkansen stations across Japan can you name from memory?',
    type: 'website',
    locale: 'ja_JP',
    url: 'https://metro-memory.xyz/asia/japan/shinkansen',
  },
})
