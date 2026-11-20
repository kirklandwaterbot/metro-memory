import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('salvador', {
  icons: {
    icon: '/api/city-icon/salvador',
    apple: '/api/city-icon/salvador',
  },
  title: 'Salvador Metro Memory',
  description: 'How many Metrô de Salvador stations can you name from memory?',
  openGraph: {
    title: 'Salvador Metro Memory',
    description: 'How many Metrô de Salvador stations can you name from memory?',
    type: 'website',
    locale: 'pt_BR',
    url: 'https://metro-memory.xyz/south-america/brazil/salvador',
  },
})
