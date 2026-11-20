import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('volgograd', {
  icons: {
    icon: '/api/city-icon/volgograd',
    apple: '/api/city-icon/volgograd',
  },
  title: 'Volgograd Metrotram Memory',
  description: 'How many Volgograd Metrotram stations can you name from memory?',
  openGraph: {
    title: 'Volgograd Metrotram Memory',
    description: 'How many Volgograd Metrotram stations can you name from memory?',
    type: 'website',
    locale: 'ru_RU',
    url: 'https://metro-memory.xyz/europe/russia/volgograd',
  },
})
