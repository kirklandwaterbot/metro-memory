import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('medellin', {
  icons: {
    icon: '/api/city-icon/medellin',
    apple: '/api/city-icon/medellin',
  },
  title: 'Medellín Metro Memory',
  description: 'How many Metro de Medellín stations can you name from memory?',
  openGraph: {
    title: 'Medellín Metro Memory',
    description: 'How many Metro de Medellín stations can you name from memory?',
    type: 'website',
    locale: 'es_CO',
    url: 'https://metro-memory.xyz/south-america/colombia/medellin',
  },
})
