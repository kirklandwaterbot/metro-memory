import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('tbilisi', {
  icons: {
    icon: '/api/city-icon/tbilisi',
    apple: '/api/city-icon/tbilisi',
  },
  title: 'Tbilisi Metro Memory',
  description: 'How many Tbilisi Metro stations can you name from memory?',
  openGraph: {
    title: 'Tbilisi Metro Memory',
    description: 'How many Tbilisi Metro stations can you name from memory?',
    type: 'website',
    locale: 'ka_GE',
    url: 'https://metro-memory.xyz/asia/georgia/tbilisi',
  },
})
