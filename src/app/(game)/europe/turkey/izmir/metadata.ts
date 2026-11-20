import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('izmir', {
  icons: {
    icon: '/api/city-icon/izmir',
    apple: '/api/city-icon/izmir',
  },
  title: 'İzmir Metro Memory',
  description: 'How many İzmir Metro stations can you name from memory?',
  openGraph: {
    title: 'İzmir Metro Memory',
    description: 'How many İzmir Metro stations can you name from memory?',
    type: 'website',
    locale: 'tr_TR',
    url: 'https://metro-memory.xyz/europe/turkey/izmir',
  },
})
