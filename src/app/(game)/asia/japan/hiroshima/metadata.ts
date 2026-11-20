import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('hiroshima', {
  icons: {
    icon: '/api/city-icon/hiroshima',
    apple: '/api/city-icon/hiroshima',
  },
  title: 'Hiroshima Metro Memory',
  description: 'How many Astram Line and Hiroden streetcar stops can you name from memory?',
  openGraph: {
    title: 'Hiroshima Metro Memory',
    description: 'How many Astram Line and Hiroden streetcar stops can you name from memory?',
    type: 'website',
    locale: 'ja_JP',
    url: 'https://metro-memory.xyz/asia/japan/hiroshima',
  },
})
