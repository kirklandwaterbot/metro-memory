import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('yarra', {
  icons: {
    icon: '/api/city-icon/yarra',
    apple: '/api/city-icon/yarra',
  },
  title: 'Yarra Trams Metro Memory',
  description: 'How many Melbourne tram stops can you name from memory?',
  openGraph: {
    title: 'Yarra Trams Metro Memory',
    description: 'How many Melbourne tram stops can you name from memory?',
    type: 'website',
    locale: 'en_AU',
    url: 'https://metro-memory.xyz/oceania/australia/yarra',
  },
})
