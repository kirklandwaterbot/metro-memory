import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('amsterdam', {
  icons: {
    icon: '/api/city-icon/amsterdam',
    apple: '/api/city-icon/amsterdam',
  },
  title: 'Amsterdam Metro Memory',
  description: 'How many Amsterdam Metro stations can you name from memory?',
  openGraph: {
    title: 'Amsterdam Metro Memory',
    description: 'How many Amsterdam Metro stations can you name from memory?',
    type: 'website',
    locale: 'nl_NL',
    url: 'https://metro-memory.xyz/europe/netherlands/amsterdam',
  },
})
