import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('recife', {
  icons: {
    icon: '/api/city-icon/recife',
    apple: '/api/city-icon/recife',
  },
  title: 'Recife Metro Memory',
  description: 'How many Metrô do Recife and VLT stations can you name from memory?',
  openGraph: {
    title: 'Recife Metro Memory',
    description: 'How many Metrô do Recife and VLT stations can you name from memory?',
    type: 'website',
    locale: 'pt_BR',
    url: 'https://metro-memory.xyz/south-america/brazil/recife',
  },
})
