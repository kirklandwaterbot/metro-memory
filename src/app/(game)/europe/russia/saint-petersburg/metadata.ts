import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('saint-petersburg', {
  icons: {
    icon: '/api/city-icon/saint-petersburg',
    apple: '/api/city-icon/saint-petersburg',
  },
  title: 'Saint Petersburg Metro Memory',
  description: 'How many Saint Petersburg Metro stations can you name from memory?',
  openGraph: {
    title: 'Saint Petersburg Metro Memory',
    description: 'How many Saint Petersburg Metro stations can you name from memory?',
    type: 'website',
    locale: 'ru_RU',
    url: 'https://metro-memory.xyz/europe/russia/saint-petersburg',
  },
})
