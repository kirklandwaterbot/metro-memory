import { generateMiniCityMetadata, renderMiniCityPage } from '@/lib/miniCityPage'
import 'mapbox-gl/dist/mapbox-gl.css'
import 'react-circular-progressbar/dist/styles.css'

export async function generateMetadata() {
  return generateMiniCityMetadata('taipei-new-taipei-metro')
}

export default async function Page() {
  return renderMiniCityPage('taipei-new-taipei-metro')
}
