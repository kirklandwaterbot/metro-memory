import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('dnipro', {
  icons: {
    icon: '/api/city-icon/dnipro',
    apple: '/api/city-icon/dnipro',
  },
  title: 'Dnipro Metro Memory',
  description: 'How many Dnipro Metro stations can you name from memory?',
  openGraph: {
    title: 'Dnipro Metro Memory',
    description: 'How many Dnipro Metro stations can you name from memory?',
    type: 'website',
    locale: 'uk_UA',
    url: 'https://metro-memory.xyz/europe/ukraine/dnipro',
  },
})
