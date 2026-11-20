import { generateMiniCityMetadata, renderMiniCityPage } from '@/lib/miniCityPage'
import 'mapbox-gl/dist/mapbox-gl.css'
import 'react-circular-progressbar/dist/styles.css'

export async function generateMetadata() {
  return generateMiniCityMetadata('shinkansen-jr-hokkaido')
}

export default async function Page() {
  return renderMiniCityPage('shinkansen-jr-hokkaido')
}
