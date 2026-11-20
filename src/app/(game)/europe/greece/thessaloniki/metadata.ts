import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('thessaloniki', {
  icons: {
    icon: '/api/city-icon/thessaloniki',
    apple: '/api/city-icon/thessaloniki',
  },
  title: 'Thessaloniki Metro Memory',
  description: 'How many Thessaloniki Metro stations can you name from memory?',
  openGraph: {
    title: 'Thessaloniki Metro Memory',
    description: 'How many Thessaloniki Metro stations can you name from memory?',
    type: 'website',
    locale: 'el_GR',
    url: 'https://metro-memory.xyz/europe/greece/thessaloniki',
  },
})
