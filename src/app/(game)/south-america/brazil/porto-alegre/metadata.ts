import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('porto-alegre', {
  icons: {
    icon: '/api/city-icon/porto-alegre',
    apple: '/api/city-icon/porto-alegre',
  },
  title: 'Porto Alegre Metro Memory',
  description: 'How many Trensurb stations can you name from memory?',
  openGraph: {
    title: 'Porto Alegre Metro Memory',
    description: 'How many Trensurb stations can you name from memory?',
    type: 'website',
    locale: 'pt_BR',
    url: 'https://metro-memory.xyz/south-america/brazil/porto-alegre',
  },
})
