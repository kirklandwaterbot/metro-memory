import { generateMiniCityMetadata, renderMiniCityPage } from '@/lib/miniCityPage'
import 'mapbox-gl/dist/mapbox-gl.css'
import 'react-circular-progressbar/dist/styles.css'

export async function generateMetadata() {
  return generateMiniCityMetadata('chengdu-dujiangyan-m-tr')
}

export default async function Page() {
  return renderMiniCityPage('chengdu-dujiangyan-m-tr')
}
