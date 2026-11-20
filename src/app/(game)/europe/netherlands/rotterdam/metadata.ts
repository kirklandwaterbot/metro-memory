import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('rotterdam', {
  icons: {
    icon: '/api/city-icon/rotterdam',
    apple: '/api/city-icon/rotterdam',
  },
  title: 'Rotterdam Metro Memory',
  description: 'How many Rotterdam Metro stations can you name from memory?',
  openGraph: {
    title: 'Rotterdam Metro Memory',
    description: 'How many Rotterdam Metro stations can you name from memory?',
    type: 'website',
    locale: 'nl_NL',
    url: 'https://metro-memory.xyz/europe/netherlands/rotterdam',
  },
})
