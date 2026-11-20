import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('ice', {
  icons: {
    icon: '/api/city-icon/ice',
    apple: '/api/city-icon/ice',
  },
  title: 'Intercity-Express (ICE) Memory',
  description: 'How many ICE stations can you name from memory?',
  openGraph: {
    title: 'Intercity-Express (ICE) Memory',
    description: 'How many ICE stations can you name from memory?',
    type: 'website',
    locale: 'de_DE',
    url: 'https://metro-memory.xyz/europe/germany/ice',
  },
})
