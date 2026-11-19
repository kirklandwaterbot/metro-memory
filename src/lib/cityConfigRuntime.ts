import type { Config } from './types'

// Auto-generated from src/lib/cityPathMap.ts and available route config files.
export const loadCityConfig = async (slug: string): Promise<Config | null> => {
  switch (slug) {
    case 'adelaide': {
      const configModule = await import('@/app/(game)/oceania/australia/adelaide/config')
      return configModule.default
    }
    case 'albuquerque': {
      const configModule = await import('@/app/(game)/north-america/usa/albuquerque/config')
      return configModule.default
    }
    case 'algiers': {
      const configModule = await import('@/app/(game)/africa/algeria/algiers/config')
      return configModule.default
    }
    case 'amtrak': {
      const configModule = await import('@/app/(game)/north-america/usa/amtrak/config')
      return configModule.default
    }
    case 'atlanta': {
      const configModule = await import('@/app/(game)/north-america/usa/atlanta/config')
      return configModule.default
    }
    case 'auckland': {
      const configModule = await import('@/app/(game)/oceania/new-zealand/auckland/config')
      return configModule.default
    }
    case 'austin': {
      const configModule = await import('@/app/(game)/north-america/usa/austin/config')
      return configModule.default
    }
    case 'bangkok': {
      const configModule = await import('@/app/(game)/asia/thailand/bangkok/config')
      return configModule.default
    }
    case 'barcelona': {
      const configModule = await import('@/app/(game)/europe/spain/barcelona/config')
      return configModule.default
    }
    case 'beijing': {
      const configModule = await import('@/app/(game)/asia/china/beijing/config')
      return configModule.default
    }
    case 'berlin': {
      const configModule = await import('@/app/(game)/europe/germany/berlin/config')
      return configModule.default
    }
    case 'blackpool': {
      const configModule = await import('@/app/(game)/europe/uk/blackpool/config')
      return configModule.default
    }
    case 'boston': {
      const configModule = await import('@/app/(game)/north-america/usa/boston/config')
      return configModule.default
    }
    case 'brisbane': {
      const configModule = await import('@/app/(game)/oceania/australia/brisbane/config')
      return configModule.default
    }
    case 'budapest': {
      const configModule = await import('@/app/(game)/europe/hungary/budapest/config')
      return configModule.default
    }
    case 'buffalo': {
      const configModule = await import('@/app/(game)/north-america/usa/buffalo/config')
      return configModule.default
    }
    case 'busan': {
      const configModule = await import('@/app/(game)/asia/south-korea/busan/config')
      return configModule.default
    }
    case 'calgary': {
      const configModule = await import('@/app/(game)/north-america/canada/calgary/config')
      return configModule.default
    }
    case 'california-state': {
      const configModule = await import('@/app/(game)/north-america/usa/california-state/config')
      return configModule.default
    }
    case 'canberra': {
      const configModule = await import('@/app/(game)/oceania/australia/canberra/config')
      return configModule.default
    }
    case 'changchun': {
      const configModule = await import('@/app/(game)/asia/china/changchun/config')
      return configModule.default
    }
    case 'changzhou': {
      const configModule = await import('@/app/(game)/asia/china/changzhou/config')
      return configModule.default
    }
    case 'charlotte': {
      const configModule = await import('@/app/(game)/north-america/usa/charlotte/config')
      return configModule.default
    }
    case 'chicago': {
      const configModule = await import('@/app/(game)/north-america/usa/chicago/config')
      return configModule.default
    }
    case 'cincinnati': {
      const configModule = await import('@/app/(game)/north-america/usa/cincinnati/config')
      return configModule.default
    }
    case 'cleveland': {
      const configModule = await import('@/app/(game)/north-america/usa/cleveland/config')
      return configModule.default
    }
    case 'daegu': {
      const configModule = await import('@/app/(game)/asia/south-korea/daegu/config')
      return configModule.default
    }
    case 'daejeon': {
      const configModule = await import('@/app/(game)/asia/south-korea/daejeon/config')
      return configModule.default
    }
    case 'dalian': {
      const configModule = await import('@/app/(game)/asia/china/dalian/config')
      return configModule.default
    }
    case 'dallas': {
      const configModule = await import('@/app/(game)/north-america/usa/dallas/config')
      return configModule.default
    }
    case 'dc': {
      const configModule = await import('@/app/(game)/north-america/usa/dc/config')
      return configModule.default
    }
    case 'denver': {
      const configModule = await import('@/app/(game)/north-america/usa/denver/config')
      return configModule.default
    }
    case 'detroit': {
      const configModule = await import('@/app/(game)/north-america/usa/detroit/config')
      return configModule.default
    }
    case 'dresden': {
      const configModule = await import('@/app/(game)/europe/germany/dresden/config')
      return configModule.default
    }
    case 'dublin': {
      const configModule = await import('@/app/(game)/europe/ireland/dublin/config')
      return configModule.default
    }
    case 'edinburgh': {
      const configModule = await import('@/app/(game)/europe/uk/edinburgh/config')
      return configModule.default
    }
    case 'edmonton': {
      const configModule = await import('@/app/(game)/north-america/canada/edmonton/config')
      return configModule.default
    }
    case 'elpaso': {
      const configModule = await import('@/app/(game)/north-america/usa/elpaso/config')
      return configModule.default
    }
    case 'florida-state': {
      const configModule = await import('@/app/(game)/north-america/usa/florida-state/config')
      return configModule.default
    }
    case 'fukuoka': {
      const configModule = await import('@/app/(game)/asia/japan/fukuoka/config')
      return configModule.default
    }
    case 'fuzhou': {
      const configModule = await import('@/app/(game)/asia/china/fuzhou/config')
      return configModule.default
    }
    case 'galveston': {
      const configModule = await import('@/app/(game)/north-america/usa/galveston/config')
      return configModule.default
    }
    case 'gba': {
      const configModule = await import('@/app/(game)/asia/china/gba/config')
      return configModule.default
    }
    case 'glasgow': {
      const configModule = await import('@/app/(game)/europe/uk/glasgow/config')
      return configModule.default
    }
    case 'goldcoast': {
      const configModule = await import('@/app/(game)/oceania/australia/goldcoast/config')
      return configModule.default
    }
    case 'guadalajara': {
      const configModule = await import('@/app/(game)/north-america/mexico/guadalajara/config')
      return configModule.default
    }
    case 'guiyang': {
      const configModule = await import('@/app/(game)/asia/china/guiyang/config')
      return configModule.default
    }
    case 'gwangju': {
      const configModule = await import('@/app/(game)/asia/south-korea/gwangju/config')
      return configModule.default
    }
    case 'hamburg': {
      const configModule = await import('@/app/(game)/europe/germany/hamburg/config')
      return configModule.default
    }
    case 'hanoi': {
      const configModule = await import('@/app/(game)/asia/vietnam/hanoi/config')
      return configModule.default
    }
    case 'harbin': {
      const configModule = await import('@/app/(game)/asia/china/harbin/config')
      return configModule.default
    }
    case 'hochiminhcity': {
      const configModule = await import('@/app/(game)/asia/vietnam/hochiminhcity/config')
      return configModule.default
    }
    case 'hohhot': {
      const configModule = await import('@/app/(game)/asia/china/hohhot/config')
      return configModule.default
    }
    case 'honolulu': {
      const configModule = await import('@/app/(game)/north-america/usa/honolulu/config')
      return configModule.default
    }
    case 'houston': {
      const configModule = await import('@/app/(game)/north-america/usa/houston/config')
      return configModule.default
    }
    case 'istanbul': {
      const configModule = await import('@/app/(game)/europe/turkey/istanbul/config')
      return configModule.default
    }
    case 'jakarta': {
      const configModule = await import('@/app/(game)/asia/indonesia/jakarta/config')
      return configModule.default
    }
    case 'jinhua': {
      const configModule = await import('@/app/(game)/asia/china/jinhua/config')
      return configModule.default
    }
    case 'kaohsiung': {
      const configModule = await import('@/app/(game)/asia/taiwan/kaohsiung/config')
      return configModule.default
    }
    case 'karlsruhe': {
      const configModule = await import('@/app/(game)/europe/germany/karlsruhe/config')
      return configModule.default
    }
    case 'kc': {
      const configModule = await import('@/app/(game)/north-america/usa/kc/config')
      return configModule.default
    }
    case 'kuala-lumpur': {
      const configModule = await import('@/app/(game)/asia/malaysia/kuala-lumpur/config')
      return configModule.default
    }
    case 'kyoto': {
      const configModule = await import('@/app/(game)/asia/japan/kyoto/config')
      return configModule.default
    }
    case 'lanzhou': {
      const configModule = await import('@/app/(game)/asia/china/lanzhou/config')
      return configModule.default
    }
    case 'lijiang': {
      const configModule = await import('@/app/(game)/asia/china/lijiang/config')
      return configModule.default
    }
    case 'liupanshui': {
      const configModule = await import('@/app/(game)/asia/china/liupanshui/config')
      return configModule.default
    }
    case 'liverpool': {
      const configModule = await import('@/app/(game)/europe/uk/liverpool/config')
      return configModule.default
    }
    case 'london': {
      const configModule = await import('@/app/(game)/europe/uk/london/config')
      return configModule.default
    }
    case 'lr': {
      const configModule = await import('@/app/(game)/north-america/usa/lr/config')
      return configModule.default
    }
    case 'luoyang': {
      const configModule = await import('@/app/(game)/asia/china/luoyang/config')
      return configModule.default
    }
    case 'lv': {
      const configModule = await import('@/app/(game)/north-america/usa/lv/config')
      return configModule.default
    }
    case 'madrid': {
      const configModule = await import('@/app/(game)/europe/spain/madrid/config')
      return configModule.default
    }
    case 'manchester': {
      const configModule = await import('@/app/(game)/europe/uk/manchester/config')
      return configModule.default
    }
    case 'manila': {
      const configModule = await import('@/app/(game)/asia/philippines/manila/config')
      return configModule.default
    }
    case 'maracaibo': {
      const configModule = await import('@/app/(game)/south-america/venezuela/maracaibo/config')
      return configModule.default
    }
    case 'melbourne': {
      const configModule = await import('@/app/(game)/oceania/australia/melbourne/config')
      return configModule.default
    }
    case 'memphis': {
      const configModule = await import('@/app/(game)/north-america/usa/memphis/config')
      return configModule.default
    }
    case 'mexico-city': {
      const configModule = await import('@/app/(game)/north-america/mexico/mexico-city/config')
      return configModule.default
    }
    case 'milwaukee': {
      const configModule = await import('@/app/(game)/north-america/usa/milwaukee/config')
      return configModule.default
    }
    case 'monterrey': {
      const configModule = await import('@/app/(game)/north-america/mexico/monterrey/config')
      return configModule.default
    }
    case 'montreal': {
      const configModule = await import('@/app/(game)/north-america/canada/montreal/config')
      return configModule.default
    }
    case 'morgantown': {
      const configModule = await import('@/app/(game)/north-america/usa/morgantown/config')
      return configModule.default
    }
    case 'munich': {
      const configModule = await import('@/app/(game)/europe/germany/munich/config')
      return configModule.default
    }
    case 'nanchang': {
      const configModule = await import('@/app/(game)/asia/china/nanchang/config')
      return configModule.default
    }
    case 'nanning': {
      const configModule = await import('@/app/(game)/asia/china/nanning/config')
      return configModule.default
    }
    case 'nantong': {
      const configModule = await import('@/app/(game)/asia/china/nantong/config')
      return configModule.default
    }
    case 'nashville': {
      const configModule = await import('@/app/(game)/north-america/usa/nashville/config')
      return configModule.default
    }
    case 'newcastle': {
      const configModule = await import('@/app/(game)/oceania/australia/newcastle/config')
      return configModule.default
    }
    case 'neworleans': {
      const configModule = await import('@/app/(game)/north-america/usa/neworleans/config')
      return configModule.default
    }
    case 'norfolk': {
      const configModule = await import('@/app/(game)/north-america/usa/norfolk/config')
      return configModule.default
    }
    case 'nottingham': {
      const configModule = await import('@/app/(game)/europe/uk/nottingham/config')
      return configModule.default
    }
    case 'nyc': {
      const configModule = await import('@/app/(game)/north-america/usa/nyc/config')
      return configModule.default
    }
    case 'okayama': {
      const configModule = await import('@/app/(game)/asia/japan/okayama/config')
      return configModule.default
    }
    case 'okc': {
      const configModule = await import('@/app/(game)/north-america/usa/okc/config')
      return configModule.default
    }
    case 'ottawa': {
      const configModule = await import('@/app/(game)/north-america/canada/ottawa/config')
      return configModule.default
    }
    case 'palembang': {
      const configModule = await import('@/app/(game)/asia/indonesia/palembang/config')
      return configModule.default
    }
    case 'paris': {
      const configModule = await import('@/app/(game)/europe/france/paris/config')
      return configModule.default
    }
    case 'perth': {
      const configModule = await import('@/app/(game)/oceania/australia/perth/config')
      return configModule.default
    }
    case 'philly': {
      const configModule = await import('@/app/(game)/north-america/usa/philly/config')
      return configModule.default
    }
    case 'phoenix': {
      const configModule = await import('@/app/(game)/north-america/usa/phoenix/config')
      return configModule.default
    }
    case 'pittsburgh': {
      const configModule = await import('@/app/(game)/north-america/usa/pittsburgh/config')
      return configModule.default
    }
    case 'portland': {
      const configModule = await import('@/app/(game)/north-america/usa/portland/config')
      return configModule.default
    }
    case 'potsdam': {
      const configModule = await import('@/app/(game)/europe/germany/potsdam/config')
      return configModule.default
    }
    case 'pyongyang': {
      const configModule = await import('@/app/(game)/asia/north-korea/pyongyang/config')
      return configModule.default
    }
    case 'san-juan': {
      const configModule = await import('@/app/(game)/north-america/usa/san-juan/config')
      return configModule.default
    }
    case 'sanya': {
      const configModule = await import('@/app/(game)/asia/china/sanya/config')
      return configModule.default
    }
    case 'sapporo': {
      const configModule = await import('@/app/(game)/asia/japan/sapporo/config')
      return configModule.default
    }
    case 'seattle': {
      const configModule = await import('@/app/(game)/north-america/usa/seattle/config')
      return configModule.default
    }
    case 'sendai': {
      const configModule = await import('@/app/(game)/asia/japan/sendai/config')
      return configModule.default
    }
    case 'seoul': {
      const configModule = await import('@/app/(game)/asia/south-korea/seoul/config')
      return configModule.default
    }
    case 'sheffield': {
      const configModule = await import('@/app/(game)/europe/uk/sheffield/config')
      return configModule.default
    }
    case 'shanghai': {
      const configModule = await import('@/app/(game)/asia/china/shanghai/config')
      return configModule.default
    }
    case 'shenyang': {
      const configModule = await import('@/app/(game)/asia/china/shenyang/config')
      return configModule.default
    }
    case 'shijiazhuang': {
      const configModule = await import('@/app/(game)/asia/china/shijiazhuang/config')
      return configModule.default
    }
    case 'singapore': {
      const configModule = await import('@/app/(game)/asia/singapore/config')
      return configModule.default
    }
    case 'slc': {
      const configModule = await import('@/app/(game)/north-america/usa/slc/config')
      return configModule.default
    }
    case 'stl': {
      const configModule = await import('@/app/(game)/north-america/usa/stl/config')
      return configModule.default
    }
    case 'stockholm': {
      const configModule = await import('@/app/(game)/europe/sweden/stockholm/config')
      return configModule.default
    }
    case 'sydney': {
      const configModule = await import('@/app/(game)/oceania/australia/sydney/config')
      return configModule.default
    }
    case 'taichung': {
      const configModule = await import('@/app/(game)/asia/taiwan/taichung/config')
      return configModule.default
    }
    case 'taipei': {
      const configModule = await import('@/app/(game)/asia/taiwan/taipei/config')
      return configModule.default
    }
    case 'taiyuan': {
      const configModule = await import('@/app/(game)/asia/china/taiyuan/config')
      return configModule.default
    }
    case 'taizhou': {
      const configModule = await import('@/app/(game)/asia/china/taizhou/config')
      return configModule.default
    }
    case 'taw': {
      const configModule = await import('@/app/(game)/europe/uk/taw/config')
      return configModule.default
    }
    case 'thsr': {
      const configModule = await import('@/app/(game)/asia/taiwan/thsr/config')
      return configModule.default
    }
    case 'tokyo': {
      const configModule = await import('@/app/(game)/asia/japan/tokyo/config')
      return configModule.default
    }
    case 'toronto-waterloo': {
      const configModule = await import('@/app/(game)/north-america/canada/toronto-waterloo/config')
      return configModule.default
    }
    case 'tucson': {
      const configModule = await import('@/app/(game)/north-america/usa/tucson/config')
      return configModule.default
    }
    case 'twincities': {
      const configModule = await import('@/app/(game)/north-america/usa/twincities/config')
      return configModule.default
    }
    case 'urumqi': {
      const configModule = await import('@/app/(game)/asia/china/urumqi/config')
      return configModule.default
    }
    case 'vancouver': {
      const configModule = await import('@/app/(game)/north-america/canada/vancouver/config')
      return configModule.default
    }
    case 'vienna': {
      const configModule = await import('@/app/(game)/europe/austria/vienna/config')
      return configModule.default
    }
    case 'wellington': {
      const configModule = await import('@/app/(game)/oceania/new-zealand/wellington/config')
      return configModule.default
    }
    case 'wenzhou': {
      const configModule = await import('@/app/(game)/asia/china/wenzhou/config')
      return configModule.default
    }
    case 'wm': {
      const configModule = await import('@/app/(game)/europe/uk/wm/config')
      return configModule.default
    }
    case 'wuhu': {
      const configModule = await import('@/app/(game)/asia/china/wuhu/config')
      return configModule.default
    }
    case 'wuxi': {
      const configModule = await import('@/app/(game)/asia/china/wuxi/config')
      return configModule.default
    }
    case 'xiamen': {
      const configModule = await import('@/app/(game)/asia/china/xiamen/config')
      return configModule.default
    }
    case 'xuzhou': {
      const configModule = await import('@/app/(game)/asia/china/xuzhou/config')
      return configModule.default
    }
    case 'yarra': {
      const configModule = await import('@/app/(game)/oceania/australia/yarra/config')
      return configModule.default
    }
    default:
      return null
  }
}
