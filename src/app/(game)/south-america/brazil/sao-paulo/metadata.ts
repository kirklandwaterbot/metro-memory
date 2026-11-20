import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('sao-paulo', {
  icons: {
    icon: '/api/city-icon/sao-paulo',
    apple: '/api/city-icon/sao-paulo',
  },
  title: 'São Paulo Metro Memory',
  description: 'How many São Paulo Metrô and CPTM stations can you name from memory?',
  openGraph: {
    title: 'São Paulo Metro Memory',
    description: 'How many São Paulo Metrô and CPTM stations can you name from memory?',
    type: 'website',
    locale: 'pt_BR',
    url: 'https://metro-memory.xyz/south-america/brazil/sao-paulo',
  },
})
