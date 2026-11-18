import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('shanghai', {
  icons: {
    icon: '/api/city-icon/shanghai',
    apple: '/api/city-icon/shanghai',
  },
  title: 'Shanghai Rail Transit Metro Memory',
  description:
    "How many of Shanghai's metro, maglev, suburban rail and tram stations can you name from memory?",
  openGraph: {
    title: 'Shanghai Rail Transit Metro Memory',
    description:
      "How many of Shanghai's metro, maglev, suburban rail and tram stations can you name from memory?",
    type: 'website',
    locale: 'en_US',
    url: 'https://metro-memory.xyz/asia/china/shanghai',
  },
})
