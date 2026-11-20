import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('russian-railways', {
  icons: {
    icon: '/api/city-icon/russian-railways',
    apple: '/api/city-icon/russian-railways',
  },
  title: 'Russian Railways Memory',
  description: 'How many Russian Railways long-distance and high-speed stations can you name from memory?',
  openGraph: {
    title: 'Russian Railways Memory',
    description: 'How many Russian Railways long-distance and high-speed stations can you name from memory?',
    type: 'website',
    locale: 'ru_RU',
    url: 'https://metro-memory.xyz/europe/russia/russian-railways',
  },
})
