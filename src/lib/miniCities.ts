import registry from './miniCitiesRegistry.json'

export type MiniCityCountingMode = 'mini'

export interface MiniCityDefinition {
  slug: string
  name: string
  link: string
  assetSourceSlug?: string
  parentSlug: string
  parentName: string
  parentLink: string
  parentPath: string
  continent: string
  country: string
  keywords: string[]
  countingMode: MiniCityCountingMode
  includeLines: string[]
  image?: string
  icon?: string
  openGraphImage?: string
}

export const MINI_CITY_MARKER_COORDINATES: Record<string, [number, number]> = {
  'gba-guangzhou': [113.2644, 23.1291],
  'gba-foshan': [113.1214, 23.0215],
  'gba-dongguan': [113.7518, 23.0207],
  'gba-shenzhen': [114.0579, 22.5431],
  'gba-hong-kong': [114.1694, 22.3193],
  'gba-mtr-heavy-rail': [114.1559, 22.3019],
  'gba-mtr-light-rail': [113.9761, 22.3947],
  'gba-macau': [113.5439, 22.1987],
  'chicago-cta': [-87.6276, 41.8837],
  'chicago-metra': [-87.6401, 41.8786],
  'california-state-los-angeles': [-118.2437, 34.0522],
  'california-state-bay-area': [-122.2711, 37.8044],
  'california-state-muni': [-122.4194, 37.7749],
  'california-state-san-diego': [-117.1611, 32.7157],
  'california-state-sacramento': [-121.4944, 38.5816],
  'california-state-bart': [-122.2711, 37.8044],
  'california-state-caltrain': [-122.3959, 37.7764],
  'california-state-vta': [-121.8863, 37.3382],
  'california-state-la-metro': [-118.2437, 34.0522],
  'california-state-metrolink': [-118.2365, 34.0562],
  'nyc-subway': [-73.9911, 40.7506],
  'nyc-lirr': [-73.7906, 40.7003],
  'nyc-mnr': [-73.9772, 40.7527],
  'nyc-ctrail': [-72.9251, 41.2977],
  'nyc-mta-commuter-rail': [-73.9715, 40.7512],
  'nyc-mta': [-73.9816, 40.7561],
  'nyc-path': [-74.0138, 40.7162],
  'nyc-rapid-transit': [-73.9854, 40.7589],
  'nyc-njt-light-rail': [-74.0436, 40.7194],
  'nyc-njt-commuter-rail': [-74.1687, 40.7346],
  'nyc-njt': [-74.1644, 40.7349],
  'nyc-panynj': [-74.0119, 40.7116],
  'boston-subway-light-rail': [-71.0695, 42.3564],
  'boston-commuter-rail': [-71.0552, 42.3522],
  'dc-washington-dc': [-77.0288, 38.9017],
  'dc-baltimore': [-76.6122, 39.2904],
  'florida-state-miami': [-80.1918, 25.7617],
  'florida-state-orlando': [-81.3792, 28.5383],
  'florida-state-tampa': [-82.4572, 27.9506],
  'florida-state-jacksonville': [-81.6557, 30.3322],
  'philly-metro-patco': [-75.1578, 39.9496],
  'philly-regional-rail': [-75.182, 39.9556],
  'montreal-metro': [-73.5611, 45.5152],
  'montreal-exo': [-73.5708, 45.4947],
  'montreal-rem': [-73.5445, 45.4709],
  'toronto-waterloo-ttc': [-79.3832, 43.6532],
  'toronto-waterloo-ttc-subway': [-79.3857, 43.6708],
  'toronto-waterloo-ttc-streetcars': [-79.3927, 43.6526],
  'toronto-waterloo-go-up': [-79.3791, 43.6453],
  'toronto-waterloo-metrolinx': [-79.6441, 43.589],
  'adelaide-trains': [138.576, -34.898],
  'adelaide-tram': [138.5745, -34.9449],
  'algiers-metro': [3.0864, 36.7408],
  'algiers-tramway': [3.1755, 36.7434],
  'amtrak-nec': [-75.1372, 39.927],
  'amtrak-state-supported-routes': [-86.5315, 40.2945],
  'amtrak-long-distance-routes': [-93.2572, 37.7061],
  'atlanta-marta': [-84.3823, 33.7669],
  'atlanta-plane-train': [-84.4395, 33.641],
  'bangkok-mrt': [100.552, 13.7925],
  'bangkok-bts': [100.5634, 13.7475],
  'bangkok-arl': [100.6343, 13.7373],
  'bangkok-srt-red-lines': [100.5534, 13.8604],
  'bangkok-srt-commuter-rail': [100.5205, 13.9704],
  'barcelona-metro': [2.156, 41.3957],
  'barcelona-trambaix-trambesos': [2.1384, 41.3902],
  'beijing-subway-operation': [116.3874, 39.9271],
  'beijing-mtr': [116.3595, 39.9103],
  'beijing-bjmoa': [116.1177, 39.7089],
  'beijing-capital-metro': [116.4978, 39.9939],
  'beijing-tram': [116.4308, 39.828],
  'beijing-suburban-railway': [116.4136, 40.1548],
  'busan-metro': [129.0531, 35.1795],
  'busan-gimhae-lrt': [128.9195, 35.213],
  'busan-haeundae-blue-line': [129.1878, 35.1634],
  'caracas-metro': [-66.9047, 10.4843],
  'caracas-los-teques': [-67.0324, 10.3653],
  'changchun-rail-transit': [125.337, 43.8527],
  'changchun-tram': [125.2531, 43.8711],
  'changsha-metro': [112.98, 28.1906],
  'changsha-maglev-yunba': [112.9631, 28.1025],
  'chengdu-metro': [104.0635, 30.6204],
  'chengdu-tram': [103.9266, 30.7678],
  'chengdu-dujiangyan-m-tr': [103.6111, 30.9578],
  'chongqing-rail-transit': [106.5268, 29.5953],
  'chongqing-byd': [106.2077, 29.5588],
  'dalian-metro': [121.6218, 38.9923],
  'dalian-trams': [121.5825, 38.8938],
  'dallas-dart': [-96.8156, 32.8325],
  'dallas-trinity-metro': [-97.1265, 32.8172],
  'dallas-dcta': [-97.019, 33.0863],
  'dallas-dfw-airport-board': [-97.0396, 32.8989],
  'denver-rtd': [-104.9594, 39.716],
  'denver-airport-train': [-104.6738, 39.8567],
  'detroit-qline': [-83.0597, 42.3503],
  'detroit-people-mover': [-83.0473, 42.3316],
  'dublin-dart': [-6.1636, 53.3279],
  'dublin-luas': [-6.2768, 53.3183],
  'dublin-commuter': [-6.3337, 53.3812],
  'hangzhou-metro': [120.1884, 30.2713],
  'hangzhou-shaoxing-metro': [120.5308, 30.0568],
  'hiroshima-astram-line': [132.4486, 34.4428],
  'hiroshima-hiroden': [132.443, 34.3819],
  'houston-metrorail': [-95.3638, 29.7468],
  'houston-airport': [-95.3419, 29.987],
  'jakarta-mrt': [106.804, -6.2409],
  'jakarta-lrt': [106.8823, -6.1846],
  'jakarta-jabodebek-lrt': [106.8767, -6.2504],
  'jakarta-kai-commuter': [106.7517, -6.1716],
  'jakarta-injourney-airports': [106.6567, -6.1251],
  'jakarta-ancol-dreamland': [106.8402, -6.1241],
  'jakarta-krl-commuterline': [106.7898, -6.2499],
  'jinan-metro': [117.0941, 36.6938],
  'jinan-byd': [117.2772, 36.6879],
  'kaohsiung-heavy-rail': [120.3183, 22.6548],
  'kaohsiung-light-rail': [120.3036, 22.628],
  'kiwirail-great-journeys': [173.6038, -41.0893],
  'kiwirail-regional': [175.0934, -38.3373],
  'korail-high-speed': [127.7599, 36.2609],
  'korail-main-lines': [127.7324, 36.6832],
  'korail-metropolitan-branch-lines': [126.9942, 37.3124],
  'korean-state-railway-trunk-lines': [127.3735, 40.0689],
  'korean-state-railway-other-lines': [127.2504, 40.2169],
  'kuala-lumpur-rapid-kl': [101.6609, 3.1115],
  'kuala-lumpur-express-rail-link': [101.6942, 2.9],
  'kuala-lumpur-ktm-komuter': [101.6718, 3.0816],
  'kyoto-subway': [135.7727, 35.0056],
  'kyoto-randen-eizan': [135.7244, 35.0231],
  'kyoto-hieizan': [135.8537, 35.0679],
  'liverpool-merseyrail': [-2.9942, 53.4228],
  'liverpool-city-line': [-2.7942, 53.4132],
  'lv-monorail-loop': [-115.1621, 36.1227],
  'lv-airport': [-115.1428, 36.0834],
  'manila-lrt': [121.0059, 14.5828],
  'manila-mrt': [121.053, 14.6386],
  'melbourne-burnley-group': [145.0831, -37.8308],
  'melbourne-caulfield-metro-tunnel': [145.0665, -37.8882],
  'melbourne-clifton-hill-group': [145.0234, -37.754],
  'melbourne-northern-group': [144.945, -37.7564],
  'melbourne-cross-city-frankston': [144.9935, -37.9331],
  'metrorail-western-cape': [18.6396, -33.8909],
  'metrorail-gauteng': [28.089, -26.0983],
  'metrorail-kwazulu-natal': [30.958, -29.8693],
  'metrorail-eastern-cape': [26.9985, -33.2793],
  'moscow-metro': [37.5943, 55.7289],
  'moscow-central-circle': [37.6222, 55.7721],
  'moscow-central-diameters': [37.5942, 55.7406],
  'nagoya-municipal-subway': [136.9276, 35.1545],
  'nagoya-aonami-line': [136.8637, 35.1193],
  'nagoya-linimo': [137.0637, 35.1759],
  'nanjing-metro': [118.7881, 32.0101],
  'nanjing-tram': [118.7938, 32.0078],
  'osaka-kobe-metro': [135.511, 34.671],
  'osaka-kobe-kita-osaka-kyuko': [135.494, 34.798],
  'osaka-kobe-monorail': [135.5259, 34.7985],
  'osaka-kobe-hankai-tramway': [135.4882, 34.6066],
  'osaka-kobe-kobe-municipal-subway': [135.1416, 34.681],
  'osaka-kobe-kobe-new-transit': [135.2305, 34.6799],
  'phoenix-valley-metro': [-112.002, 33.4493],
  'phoenix-sky-train': [-112.0101, 33.4362],
  'pittsburgh-light-rail': [-80.0201, 40.3847],
  'pittsburgh-inclines': [-80.0118, 40.4355],
  'portland-max-light-rail': [-122.6803, 45.5195],
  'portland-streetcar': [-122.6763, 45.5192],
  'portland-westside-express-service': [-122.7795, 45.4147],
  'qingdao-metro': [120.3161, 36.0878],
  'qingdao-tram': [120.4089, 36.3131],
  'recife-metro': [-34.9354, -8.0919],
  'recife-vlt': [-34.9758, -8.1885],
  'rome-metro': [12.5277, 41.8823],
  'rome-ferrovie-concesse': [12.4308, 41.8758],
  'russian-railways-high-speed': [40.3725, 54.6809],
  'russian-railways-long-distance': [59.9673, 54.689],
  'santo-domingo-metro': [-69.923, 18.4941],
  'santo-domingo-teleferico': [-69.9688, 18.4882],
  'sao-paulo-metro': [-46.6349, -23.5756],
  'sao-paulo-cptm': [-46.6339, -23.5327],
  'sapporo-municipal-subway': [141.3641, 43.0565],
  'sapporo-streetcar': [141.3448, 43.0445],
  'seattle-sound-transit': [-122.3147, 47.5388],
  'seattle-kcm': [-122.3294, 47.6128],
  'seattle-airport': [-122.3021, 47.4434],
  'shanghai-metro': [121.46, 31.2135],
  'shanghai-suburban-railway': [121.4284, 31.0542],
  'shanghai-songjiang-tram': [121.2397, 31.0348],
  'shanghai-airport-authority': [121.805, 31.1442],
  'shenyang-metro': [123.4054, 41.7831],
  'shenyang-modern-tram': [123.4859, 41.7149],
  'shinkansen-jr-central-west': [135.2966, 34.7244],
  'shinkansen-jr-kyushu': [130.3425, 32.7834],
  'shinkansen-jr-east': [139.4812, 37.6909],
  'shinkansen-jr-hokkaido': [140.573, 41.3891],
  'singapore-mrt': [103.8394, 1.3281],
  'singapore-lrt': [103.8565, 1.3932],
  'singapore-sentosa': [103.8186, 1.2583],
  'singapore-changi-airport-skytrain': [103.988, 1.3565],
  'slc-trax': [-111.908, 40.6989],
  'slc-s-line': [-111.8747, 40.7225],
  'slc-frontrunner': [-111.886, 40.7079],
  'sncf-tgv-inoui': [3.1939, 46.6057],
  'sncf-ouigo-intercites': [2.3906, 45.4058],
  'sncf-international': [5.4558, 45.009],
  'stl-metrolink': [-90.1994, 38.6285],
  'stl-loop-trolley': [-90.2939, 38.6531],
  'suzhou-rail-transit': [120.6693, 31.3079],
  'suzhou-tram': [120.4399, 31.3466],
  'sydney-trains': [151.0546, -33.8571],
  'sydney-metro': [151.0942, -33.8324],
  'sydney-light-rail': [151.1534, -33.8667],
  'taipei-metro': [121.5213, 25.0393],
  'taipei-new-taipei-metro': [121.4508, 25.0365],
  'taipei-taoyuan-metro': [121.2967, 25.0251],
  'tokyo-metro': [139.7449, 35.6969],
  'tokyo-toei-subway': [139.7469, 35.6948],
  'tra-main-lines': [120.9927, 23.9141],
  'tra-branch-lines': [121.1094, 24.4811],
  'twincities-metropolitan-council': [-93.2514, 44.9393],
  'twincities-airport': [-93.2065, 44.8824],
  'vancouver-skytrain': [-122.9874, 49.2317],
  'vancouver-wce': [-122.7246, 49.236],
  'viarail-long-distance': [-90.0347, 49.0243],
  'viarail-corridor': [-77.7038, 44.1911],
  'viarail-regional-remote-services': [-89.3982, 50.6935],
  'wellington-metlink-trains': [174.9673, -41.1575],
  'wellington-cable-car': [174.7713, -41.2848],
  'wuhan-metro': [114.2932, 30.5704],
  'wuhan-trams': [114.3336, 30.4674],
  'xian-metro': [108.9331, 34.2781],
  'xian-byd': [108.8431, 34.1923],
}

export interface ParentCitySplitDefinition {
  parentSlug: string
  parentName: string
  parentLink: string
  parentPath: string
  continent: string
  country: string
  children: MiniCityDefinition[]
}

export interface MiniCityStatsEntry {
  slug: string
  name: string
  parentSlug: string
  parentName: string
  link: string
  percent: number
  found: number
  total: number
}

type RegistryParent = {
  parentSlug: string
  parentName: string
  parentLink: string
  parentPath: string
  continent: string
  country: string
  children: Array<{
    slug: string
    name: string
    link: string
    assetSourceSlug?: string
    keywords?: string[]
    countingMode: MiniCityCountingMode
    includeLines: string[]
    image?: string
    icon?: string
    openGraphImage?: string
  }>
}

const rawParents = (registry.parents ?? []) as RegistryParent[]

export const CITY_SPLIT_PARENTS: ParentCitySplitDefinition[] = rawParents.map(
  (parent) => ({
    parentSlug: parent.parentSlug,
    parentName: parent.parentName,
    parentLink: parent.parentLink,
    parentPath: parent.parentPath,
    continent: parent.continent,
    country: parent.country,
    children: parent.children.map((child) => ({
      slug: child.slug,
      name: child.name,
      link: child.link,
      assetSourceSlug: child.assetSourceSlug,
      parentSlug: parent.parentSlug,
      parentName: parent.parentName,
      parentLink: parent.parentLink,
      parentPath: parent.parentPath,
      continent: parent.continent,
      country: parent.country,
      keywords: Array.isArray(child.keywords) ? child.keywords : [],
      countingMode: child.countingMode,
      includeLines: Array.isArray(child.includeLines) ? child.includeLines : [],
      image: child.image,
      icon: child.icon,
      openGraphImage: child.openGraphImage,
    })),
  }),
)

export const MINI_CITIES: MiniCityDefinition[] = CITY_SPLIT_PARENTS.flatMap(
  (parent) => parent.children,
)

const miniCityBySlug = new Map(MINI_CITIES.map((entry) => [entry.slug, entry]))
const parentBySlug = new Map(
  CITY_SPLIT_PARENTS.map((entry) => [entry.parentSlug, entry]),
)

export const getMiniCityBySlug = (slug: string | null | undefined) =>
  (slug ? miniCityBySlug.get(slug) : undefined) ?? null

export const getMiniCitiesForParent = (parentSlug: string | null | undefined) =>
  (parentSlug ? parentBySlug.get(parentSlug)?.children : undefined) ?? []

export const getMiniCityParentDefinition = (
  parentSlug: string | null | undefined,
) => (parentSlug ? parentBySlug.get(parentSlug) : undefined) ?? null

export const isMiniCitySlug = (slug: string | null | undefined): boolean =>
  Boolean(slug && miniCityBySlug.has(slug))

export const getMiniCityFamilyByCountryBase = (
  basePath: string,
): ParentCitySplitDefinition[] =>
  CITY_SPLIT_PARENTS.filter((entry) =>
    entry.parentLink.startsWith(basePath),
  )

export const getMiniCityLinksForSlug = (slug: string) => {
  const miniCity = getMiniCityBySlug(slug)
  if (miniCity) {
    const siblings = getMiniCitiesForParent(miniCity.parentSlug)
    return {
      mode: 'child' as const,
      parent: getMiniCityParentDefinition(miniCity.parentSlug),
      current: miniCity,
      siblings,
    }
  }

  const children = getMiniCitiesForParent(slug)
  if (children.length > 0) {
    return {
      mode: 'parent' as const,
      parent: getMiniCityParentDefinition(slug),
      current: null,
      siblings: children,
    }
  }

  return null
}

export const resolveMiniCityParentSlugForIcon = (slug: string): string | null =>
  getMiniCityBySlug(slug)?.parentSlug ??
  (slug.startsWith('custom-') ? slug.slice('custom-'.length) : null)
