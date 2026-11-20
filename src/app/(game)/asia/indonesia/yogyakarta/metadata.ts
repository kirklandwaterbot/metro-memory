import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('yogyakarta', {
  icons: {
    icon: '/api/city-icon/yogyakarta',
    apple: '/api/city-icon/yogyakarta',
  },
  title: 'Yogyakarta–Solo KRL Memory',
  description: 'How many KRL Commuterline Yogyakarta–Solo stations can you name from memory?',
  openGraph: {
    title: 'Yogyakarta–Solo KRL Memory',
    description: 'How many KRL Commuterline Yogyakarta–Solo stations can you name from memory?',
    type: 'website',
    locale: 'id_ID',
    url: 'https://metro-memory.xyz/asia/indonesia/yogyakarta',
  },
})
