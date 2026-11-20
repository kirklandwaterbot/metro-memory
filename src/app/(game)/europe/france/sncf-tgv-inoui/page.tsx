import { generateMiniCityMetadata, renderMiniCityPage } from '@/lib/miniCityPage'
import 'mapbox-gl/dist/mapbox-gl.css'
import 'react-circular-progressbar/dist/styles.css'

export async function generateMetadata() {
  return generateMiniCityMetadata('sncf-tgv-inoui')
}

export default async function Page() {
  return renderMiniCityPage('sncf-tgv-inoui')
}
