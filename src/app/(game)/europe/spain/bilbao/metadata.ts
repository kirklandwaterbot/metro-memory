import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('bilbao', {
  icons: {
    icon: '/api/city-icon/bilbao',
    apple: '/api/city-icon/bilbao',
  },
  title: 'Bilbao Metro Memory',
  description: 'How many Bilbao Metro stations can you name from memory?',
  openGraph: {
    title: 'Bilbao Metro Memory',
    description: 'How many Bilbao Metro stations can you name from memory?',
    type: 'website',
    locale: 'es_ES',
    url: 'https://metro-memory.xyz/europe/spain/bilbao',
  },
})
