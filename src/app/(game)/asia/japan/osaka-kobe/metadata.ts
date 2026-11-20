import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('osaka-kobe', {
  icons: {
    icon: '/api/city-icon/osaka-kobe',
    apple: '/api/city-icon/osaka-kobe',
  },
  title: 'Osaka–Kobe Metro Memory',
  description: 'How many Osaka Metro, Kobe Subway, monorail, new-transit and Hankai tram stations can you name from memory?',
  openGraph: {
    title: 'Osaka–Kobe Metro Memory',
    description: 'How many Osaka Metro, Kobe Subway, monorail, new-transit and Hankai tram stations can you name from memory?',
    type: 'website',
    locale: 'ja_JP',
    url: 'https://metro-memory.xyz/asia/japan/osaka-kobe',
  },
})
