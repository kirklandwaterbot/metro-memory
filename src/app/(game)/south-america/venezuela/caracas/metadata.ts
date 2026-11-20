import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('caracas', {
  icons: {
    icon: '/api/city-icon/caracas',
    apple: '/api/city-icon/caracas',
  },
  title: 'Caracas Metro Memory',
  description: 'How many Metro de Caracas, Cabletrén and Los Teques stations can you name from memory?',
  openGraph: {
    title: 'Caracas Metro Memory',
    description: 'How many Metro de Caracas, Cabletrén and Los Teques stations can you name from memory?',
    type: 'website',
    locale: 'es_VE',
    url: 'https://metro-memory.xyz/south-america/venezuela/caracas',
  },
})
