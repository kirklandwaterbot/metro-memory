import { generateMiniCityMetadata, renderMiniCityPage } from '@/lib/miniCityPage'
import 'mapbox-gl/dist/mapbox-gl.css'
import 'react-circular-progressbar/dist/styles.css'

export async function generateMetadata() {
  return generateMiniCityMetadata('viarail-regional-remote-services')
}

export default async function Page() {
  return renderMiniCityPage('viarail-regional-remote-services')
}
