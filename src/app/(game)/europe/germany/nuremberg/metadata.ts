import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('nuremberg', {
  icons: {
    icon: '/api/city-icon/nuremberg',
    apple: '/api/city-icon/nuremberg',
  },
  title: 'Nuremberg Metro Memory',
  description: 'How many Nuremberg U-Bahn stations can you name from memory?',
  openGraph: {
    title: 'Nuremberg Metro Memory',
    description: 'How many Nuremberg U-Bahn stations can you name from memory?',
    type: 'website',
    locale: 'de_DE',
    url: 'https://metro-memory.xyz/europe/germany/nuremberg',
  },
})
