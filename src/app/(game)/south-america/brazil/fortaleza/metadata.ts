import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('fortaleza', {
  icons: {
    icon: '/api/city-icon/fortaleza',
    apple: '/api/city-icon/fortaleza',
  },
  title: 'Fortaleza Metro Memory',
  description: 'How many Metrofor stations can you name from memory?',
  openGraph: {
    title: 'Fortaleza Metro Memory',
    description: 'How many Metrofor stations can you name from memory?',
    type: 'website',
    locale: 'pt_BR',
    url: 'https://metro-memory.xyz/south-america/brazil/fortaleza',
  },
})
