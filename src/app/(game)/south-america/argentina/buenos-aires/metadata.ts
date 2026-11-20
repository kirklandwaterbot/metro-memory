import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('buenos-aires', {
  icons: {
    icon: '/api/city-icon/buenos-aires',
    apple: '/api/city-icon/buenos-aires',
  },
  title: 'Buenos Aires Metro Memory',
  description: 'How many Buenos Aires Subte and Premetro stations can you name from memory?',
  openGraph: {
    title: 'Buenos Aires Metro Memory',
    description: 'How many Buenos Aires Subte and Premetro stations can you name from memory?',
    type: 'website',
    locale: 'es_AR',
    url: 'https://metro-memory.xyz/south-america/argentina/buenos-aires',
  },
})
