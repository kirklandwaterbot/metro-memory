import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('sncf', {
  icons: {
    icon: '/api/city-icon/sncf',
    apple: '/api/city-icon/sncf',
  },
  title: 'SNCF TGV & Intercités Memory',
  description: 'How many TGV, Ouigo and Intercités stations can you name from memory?',
  openGraph: {
    title: 'SNCF TGV & Intercités Memory',
    description: 'How many TGV, Ouigo and Intercités stations can you name from memory?',
    type: 'website',
    locale: 'fr_FR',
    url: 'https://metro-memory.xyz/europe/france/sncf',
  },
})
