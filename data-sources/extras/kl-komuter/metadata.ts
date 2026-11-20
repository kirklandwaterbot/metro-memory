import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('kl-komuter', {
  icons: {
    icon: '/api/city-icon/kl-komuter',
    apple: '/api/city-icon/kl-komuter',
  },
  title: 'x',
  description: 'x',
  openGraph: {
    title: 'x',
    description: 'x',
    type: 'website',
    locale: 'ms_MY',
    url: 'https://metro-memory.xyz/../../../data-sources/extras/kl-komuter',
  },
})
