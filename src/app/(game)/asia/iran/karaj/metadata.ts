import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('karaj', {
  icons: {
    icon: '/api/city-icon/karaj',
    apple: '/api/city-icon/karaj',
  },
  title: 'Karaj Metro Memory',
  description: 'How many Karaj Metro stations can you name from memory?',
  openGraph: {
    title: 'Karaj Metro Memory',
    description: 'How many Karaj Metro stations can you name from memory?',
    type: 'website',
    locale: 'fa_IR',
    url: 'https://metro-memory.xyz/asia/iran/karaj',
  },
})
