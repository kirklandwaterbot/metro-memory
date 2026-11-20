import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('trenitalia', {
  icons: {
    icon: '/api/city-icon/trenitalia',
    apple: '/api/city-icon/trenitalia',
  },
  title: 'Trenitalia Frecce & Intercity Memory',
  description: 'How many Frecciarossa, Frecciabianca and Intercity stations can you name from memory?',
  openGraph: {
    title: 'Trenitalia Frecce & Intercity Memory',
    description: 'How many Frecciarossa, Frecciabianca and Intercity stations can you name from memory?',
    type: 'website',
    locale: 'it_IT',
    url: 'https://metro-memory.xyz/europe/italy/trenitalia',
  },
})
