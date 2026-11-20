import { generateMiniCityMetadata, renderMiniCityPage } from '@/lib/miniCityPage'
import 'mapbox-gl/dist/mapbox-gl.css'
import 'react-circular-progressbar/dist/styles.css'

export async function generateMetadata() {
  return generateMiniCityMetadata('russian-railways-long-distance')
}

export default async function Page() {
  return renderMiniCityPage('russian-railways-long-distance')
}
