import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('nizhny-novgorod', {
  icons: {
    icon: '/api/city-icon/nizhny-novgorod',
    apple: '/api/city-icon/nizhny-novgorod',
  },
  title: 'Nizhny Novgorod Metro Memory',
  description: 'How many Nizhny Novgorod Metro stations can you name from memory?',
  openGraph: {
    title: 'Nizhny Novgorod Metro Memory',
    description: 'How many Nizhny Novgorod Metro stations can you name from memory?',
    type: 'website',
    locale: 'ru_RU',
    url: 'https://metro-memory.xyz/europe/russia/nizhny-novgorod',
  },
})
