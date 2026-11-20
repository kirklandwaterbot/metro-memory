import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('mashhad', {
  icons: {
    icon: '/api/city-icon/mashhad',
    apple: '/api/city-icon/mashhad',
  },
  title: 'Mashhad Metro Memory',
  description: 'How many Mashhad Urban Railway stations can you name from memory?',
  openGraph: {
    title: 'Mashhad Metro Memory',
    description: 'How many Mashhad Urban Railway stations can you name from memory?',
    type: 'website',
    locale: 'fa_IR',
    url: 'https://metro-memory.xyz/asia/iran/mashhad',
  },
})
