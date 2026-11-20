export { metadata } from './metadata'
import 'mapbox-gl/dist/mapbox-gl.css'
import 'react-circular-progressbar/dist/styles.css'
import config from './config'
import CityDataGamePage from '@/components/CityDataGamePage'
import { Provider } from '@/lib/configContext'
import Main from '@/components/Main'

export default function AlgiersPage() {
  return (
    <Provider value={config}>
      <Main className="min-h-screen">
        <CityDataGamePage slug="algiers" />
      </Main>
    </Provider>
  )
}
