import type { Config } from './types'

// Auto-generated from src/lib/cityPathMap.ts and available route config files.
export const loadCityConfig = async (slug: string): Promise<Config | null> => {
  switch (slug) {
    case 'adana': {
      const configModule = await import('@/app/(game)/europe/turkey/adana/config')
      return configModule.default
    }
    case 'adelaide': {
      const configModule = await import('@/app/(game)/oceania/australia/adelaide/config')
      return configModule.default
    }
    case 'agra': {
      const configModule = await import('@/app/(game)/asia/india/agra/config')
      return configModule.default
    }
    case 'ahmedabad': {
      const configModule = await import('@/app/(game)/asia/india/ahmedabad/config')
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
    case 'almaty': {
      const configModule = await import('@/app/(game)/asia/kazakhstan/almaty/config')
      return configModule.default
    }
    case 'amsterdam': {
      const configModule = await import('@/app/(game)/europe/netherlands/amsterdam/config')
      return configModule.default
    }
    case 'amtrak': {
      const configModule = await import('@/app/(game)/north-america/usa/amtrak/config')
      return configModule.default
    }
    case 'ankara': {
      const configModule = await import('@/app/(game)/europe/turkey/ankara/config')
      return configModule.default
    }
    case 'astana': {
      const configModule = await import('@/app/(game)/asia/kazakhstan/astana/config')
      return configModule.default
    }
    case 'athens': {
      const configModule = await import('@/app/(game)/europe/greece/athens/config')
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
    case 'baku': {
      const configModule = await import('@/app/(game)/asia/azerbaijan/baku/config')
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
    case 'belo-horizonte': {
      const configModule = await import('@/app/(game)/south-america/brazil/belo-horizonte/config')
      return configModule.default
    }
    case 'bengaluru': {
      const configModule = await import('@/app/(game)/asia/india/bengaluru/config')
      return configModule.default
    }
    case 'berlin': {
      const configModule = await import('@/app/(game)/europe/germany/berlin/config')
      return configModule.default
    }
    case 'bhopal': {
      const configModule = await import('@/app/(game)/asia/india/bhopal/config')
      return configModule.default
    }
    case 'bilbao': {
      const configModule = await import('@/app/(game)/europe/spain/bilbao/config')
      return configModule.default
    }
    case 'bkk-srt': {
      const configModule = await import('@/app/(game)/../../../data-sources/extras/bkk-srt/config')
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
    case 'brasilia': {
      const configModule = await import('@/app/(game)/south-america/brazil/brasilia/config')
      return configModule.default
    }
    case 'brescia': {
      const configModule = await import('@/app/(game)/europe/italy/brescia/config')
      return configModule.default
    }
    case 'brisbane': {
      const configModule = await import('@/app/(game)/oceania/australia/brisbane/config')
      return configModule.default
    }
    case 'brussels': {
      const configModule = await import('@/app/(game)/europe/belgium/brussels/config')
      return configModule.default
    }
    case 'bucharest': {
      const configModule = await import('@/app/(game)/europe/romania/bucharest/config')
      return configModule.default
    }
    case 'budapest': {
      const configModule = await import('@/app/(game)/europe/hungary/budapest/config')
      return configModule.default
    }
    case 'buenos-aires': {
      const configModule = await import('@/app/(game)/south-america/argentina/buenos-aires/config')
      return configModule.default
    }
    case 'buffalo': {
      const configModule = await import('@/app/(game)/north-america/usa/buffalo/config')
      return configModule.default
    }
    case 'bursa': {
      const configModule = await import('@/app/(game)/europe/turkey/bursa/config')
      return configModule.default
    }
    case 'busan': {
      const configModule = await import('@/app/(game)/asia/south-korea/busan/config')
      return configModule.default
    }
    case 'cairo': {
      const configModule = await import('@/app/(game)/africa/egypt/cairo/config')
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
    case 'caracas': {
      const configModule = await import('@/app/(game)/south-america/venezuela/caracas/config')
      return configModule.default
    }
    case 'catania': {
      const configModule = await import('@/app/(game)/europe/italy/catania/config')
      return configModule.default
    }
    case 'changchun': {
      const configModule = await import('@/app/(game)/asia/china/changchun/config')
      return configModule.default
    }
    case 'changsha': {
      const configModule = await import('@/app/(game)/asia/china/changsha/config')
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
    case 'chengdu': {
      const configModule = await import('@/app/(game)/asia/china/chengdu/config')
      return configModule.default
    }
    case 'chennai': {
      const configModule = await import('@/app/(game)/asia/india/chennai/config')
      return configModule.default
    }
    case 'chicago': {
      const configModule = await import('@/app/(game)/north-america/usa/chicago/config')
      return configModule.default
    }
    case 'china-railway': {
      const configModule = await import('@/app/(game)/asia/china/china-railway/config')
      return configModule.default
    }
    case 'chongqing': {
      const configModule = await import('@/app/(game)/asia/china/chongqing/config')
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
    case 'copenhagen': {
      const configModule = await import('@/app/(game)/europe/denmark/copenhagen/config')
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
    case 'delhi': {
      const configModule = await import('@/app/(game)/asia/india/delhi/config')
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
    case 'dhaka': {
      const configModule = await import('@/app/(game)/asia/bangladesh/dhaka/config')
      return configModule.default
    }
    case 'dnipro': {
      const configModule = await import('@/app/(game)/europe/ukraine/dnipro/config')
      return configModule.default
    }
    case 'doha': {
      const configModule = await import('@/app/(game)/asia/qatar/doha/config')
      return configModule.default
    }
    case 'dresden': {
      const configModule = await import('@/app/(game)/europe/germany/dresden/config')
      return configModule.default
    }
    case 'dubai': {
      const configModule = await import('@/app/(game)/asia/uae/dubai/config')
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
    case 'fenghuang': {
      const configModule = await import('@/app/(game)/asia/china/fenghuang/config')
      return configModule.default
    }
    case 'florida-state': {
      const configModule = await import('@/app/(game)/north-america/usa/florida-state/config')
      return configModule.default
    }
    case 'fortaleza': {
      const configModule = await import('@/app/(game)/south-america/brazil/fortaleza/config')
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
    case 'genoa': {
      const configModule = await import('@/app/(game)/europe/italy/genoa/config')
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
    case 'hangzhou': {
      const configModule = await import('@/app/(game)/asia/china/hangzhou/config')
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
    case 'hefei': {
      const configModule = await import('@/app/(game)/asia/china/hefei/config')
      return configModule.default
    }
    case 'helsinki': {
      const configModule = await import('@/app/(game)/europe/finland/helsinki/config')
      return configModule.default
    }
    case 'hiroshima': {
      const configModule = await import('@/app/(game)/asia/japan/hiroshima/config')
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
    case 'huaian': {
      const configModule = await import('@/app/(game)/asia/china/huaian/config')
      return configModule.default
    }
    case 'huangshi': {
      const configModule = await import('@/app/(game)/asia/china/huangshi/config')
      return configModule.default
    }
    case 'hyderabad': {
      const configModule = await import('@/app/(game)/asia/india/hyderabad/config')
      return configModule.default
    }
    case 'ice': {
      const configModule = await import('@/app/(game)/europe/germany/ice/config')
      return configModule.default
    }
    case 'indore': {
      const configModule = await import('@/app/(game)/asia/india/indore/config')
      return configModule.default
    }
    case 'isfahan': {
      const configModule = await import('@/app/(game)/asia/iran/isfahan/config')
      return configModule.default
    }
    case 'istanbul': {
      const configModule = await import('@/app/(game)/europe/turkey/istanbul/config')
      return configModule.default
    }
    case 'izmir': {
      const configModule = await import('@/app/(game)/europe/turkey/izmir/config')
      return configModule.default
    }
    case 'jaipur': {
      const configModule = await import('@/app/(game)/asia/india/jaipur/config')
      return configModule.default
    }
    case 'jakarta': {
      const configModule = await import('@/app/(game)/asia/indonesia/jakarta/config')
      return configModule.default
    }
    case 'jakarta-krl': {
      const configModule = await import('@/app/(game)/../../../data-sources/extras/jakarta-krl/config')
      return configModule.default
    }
    case 'jiaxing': {
      const configModule = await import('@/app/(game)/asia/china/jiaxing/config')
      return configModule.default
    }
    case 'jinan': {
      const configModule = await import('@/app/(game)/asia/china/jinan/config')
      return configModule.default
    }
    case 'jinhua': {
      const configModule = await import('@/app/(game)/asia/china/jinhua/config')
      return configModule.default
    }
    case 'kanpur': {
      const configModule = await import('@/app/(game)/asia/india/kanpur/config')
      return configModule.default
    }
    case 'kaohsiung': {
      const configModule = await import('@/app/(game)/asia/taiwan/kaohsiung/config')
      return configModule.default
    }
    case 'karaj': {
      const configModule = await import('@/app/(game)/asia/iran/karaj/config')
      return configModule.default
    }
    case 'karlsruhe': {
      const configModule = await import('@/app/(game)/europe/germany/karlsruhe/config')
      return configModule.default
    }
    case 'kazan': {
      const configModule = await import('@/app/(game)/europe/russia/kazan/config')
      return configModule.default
    }
    case 'kc': {
      const configModule = await import('@/app/(game)/north-america/usa/kc/config')
      return configModule.default
    }
    case 'kharkiv': {
      const configModule = await import('@/app/(game)/europe/ukraine/kharkiv/config')
      return configModule.default
    }
    case 'kiwirail': {
      const configModule = await import('@/app/(game)/oceania/new-zealand/kiwirail/config')
      return configModule.default
    }
    case 'kl-komuter': {
      const configModule = await import('@/app/(game)/../../../data-sources/extras/kl-komuter/config')
      return configModule.default
    }
    case 'kochi': {
      const configModule = await import('@/app/(game)/asia/india/kochi/config')
      return configModule.default
    }
    case 'kolkata': {
      const configModule = await import('@/app/(game)/asia/india/kolkata/config')
      return configModule.default
    }
    case 'komuter-utara': {
      const configModule = await import('@/app/(game)/asia/malaysia/komuter-utara/config')
      return configModule.default
    }
    case 'korail': {
      const configModule = await import('@/app/(game)/asia/south-korea/korail/config')
      return configModule.default
    }
    case 'korean-state-railway': {
      const configModule = await import('@/app/(game)/asia/north-korea/korean-state-railway/config')
      return configModule.default
    }
    case 'kryvyi-rih': {
      const configModule = await import('@/app/(game)/europe/ukraine/kryvyi-rih/config')
      return configModule.default
    }
    case 'kuala-lumpur': {
      const configModule = await import('@/app/(game)/asia/malaysia/kuala-lumpur/config')
      return configModule.default
    }
    case 'kunming': {
      const configModule = await import('@/app/(game)/asia/china/kunming/config')
      return configModule.default
    }
    case 'kyiv': {
      const configModule = await import('@/app/(game)/europe/ukraine/kyiv/config')
      return configModule.default
    }
    case 'kyoto': {
      const configModule = await import('@/app/(game)/asia/japan/kyoto/config')
      return configModule.default
    }
    case 'lagos': {
      const configModule = await import('@/app/(game)/africa/nigeria/lagos/config')
      return configModule.default
    }
    case 'lahore': {
      const configModule = await import('@/app/(game)/asia/pakistan/lahore/config')
      return configModule.default
    }
    case 'lanzhou': {
      const configModule = await import('@/app/(game)/asia/china/lanzhou/config')
      return configModule.default
    }
    case 'lausanne': {
      const configModule = await import('@/app/(game)/europe/switzerland/lausanne/config')
      return configModule.default
    }
    case 'lijiang': {
      const configModule = await import('@/app/(game)/asia/china/lijiang/config')
      return configModule.default
    }
    case 'lille': {
      const configModule = await import('@/app/(game)/europe/france/lille/config')
      return configModule.default
    }
    case 'lima': {
      const configModule = await import('@/app/(game)/south-america/peru/lima/config')
      return configModule.default
    }
    case 'lisbon': {
      const configModule = await import('@/app/(game)/europe/portugal/lisbon/config')
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
    case 'lucknow': {
      const configModule = await import('@/app/(game)/asia/india/lucknow/config')
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
    case 'lyon': {
      const configModule = await import('@/app/(game)/europe/france/lyon/config')
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
    case 'marseille': {
      const configModule = await import('@/app/(game)/europe/france/marseille/config')
      return configModule.default
    }
    case 'mashhad': {
      const configModule = await import('@/app/(game)/asia/iran/mashhad/config')
      return configModule.default
    }
    case 'mecca': {
      const configModule = await import('@/app/(game)/asia/saudi-arabia/mecca/config')
      return configModule.default
    }
    case 'medellin': {
      const configModule = await import('@/app/(game)/south-america/colombia/medellin/config')
      return configModule.default
    }
    case 'meerut': {
      const configModule = await import('@/app/(game)/asia/india/meerut/config')
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
    case 'mengzhi': {
      const configModule = await import('@/app/(game)/asia/china/mengzhi/config')
      return configModule.default
    }
    case 'metrorail': {
      const configModule = await import('@/app/(game)/africa/south-africa/metrorail/config')
      return configModule.default
    }
    case 'mexico-city': {
      const configModule = await import('@/app/(game)/north-america/mexico/mexico-city/config')
      return configModule.default
    }
    case 'milan': {
      const configModule = await import('@/app/(game)/europe/italy/milan/config')
      return configModule.default
    }
    case 'milwaukee': {
      const configModule = await import('@/app/(game)/north-america/usa/milwaukee/config')
      return configModule.default
    }
    case 'minsk': {
      const configModule = await import('@/app/(game)/europe/belarus/minsk/config')
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
    case 'moscow': {
      const configModule = await import('@/app/(game)/europe/russia/moscow/config')
      return configModule.default
    }
    case 'mumbai': {
      const configModule = await import('@/app/(game)/asia/india/mumbai/config')
      return configModule.default
    }
    case 'munich': {
      const configModule = await import('@/app/(game)/europe/germany/munich/config')
      return configModule.default
    }
    case 'nagoya': {
      const configModule = await import('@/app/(game)/asia/japan/nagoya/config')
      return configModule.default
    }
    case 'nagpur': {
      const configModule = await import('@/app/(game)/asia/india/nagpur/config')
      return configModule.default
    }
    case 'nanchang': {
      const configModule = await import('@/app/(game)/asia/china/nanchang/config')
      return configModule.default
    }
    case 'nanjing': {
      const configModule = await import('@/app/(game)/asia/china/nanjing/config')
      return configModule.default
    }
    case 'nanning': {
      const configModule = await import('@/app/(game)/asia/china/nanning/config')
      return configModule.default
    }
    case 'nanping': {
      const configModule = await import('@/app/(game)/asia/china/nanping/config')
      return configModule.default
    }
    case 'nantong': {
      const configModule = await import('@/app/(game)/asia/china/nantong/config')
      return configModule.default
    }
    case 'naples': {
      const configModule = await import('@/app/(game)/europe/italy/naples/config')
      return configModule.default
    }
    case 'nashville': {
      const configModule = await import('@/app/(game)/north-america/usa/nashville/config')
      return configModule.default
    }
    case 'national-rail': {
      const configModule = await import('@/app/(game)/europe/uk/national-rail/config')
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
    case 'ningbo': {
      const configModule = await import('@/app/(game)/asia/china/ningbo/config')
      return configModule.default
    }
    case 'nizhny-novgorod': {
      const configModule = await import('@/app/(game)/europe/russia/nizhny-novgorod/config')
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
    case 'novosibirsk': {
      const configModule = await import('@/app/(game)/asia/russia/novosibirsk/config')
      return configModule.default
    }
    case 'nuremberg': {
      const configModule = await import('@/app/(game)/europe/germany/nuremberg/config')
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
    case 'osaka-kobe': {
      const configModule = await import('@/app/(game)/asia/japan/osaka-kobe/config')
      return configModule.default
    }
    case 'oslo': {
      const configModule = await import('@/app/(game)/europe/norway/oslo/config')
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
    case 'panama-city': {
      const configModule = await import('@/app/(game)/north-america/panama/panama-city/config')
      return configModule.default
    }
    case 'paris': {
      const configModule = await import('@/app/(game)/europe/france/paris/config')
      return configModule.default
    }
    case 'patna': {
      const configModule = await import('@/app/(game)/asia/india/patna/config')
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
    case 'porto-alegre': {
      const configModule = await import('@/app/(game)/south-america/brazil/porto-alegre/config')
      return configModule.default
    }
    case 'potsdam': {
      const configModule = await import('@/app/(game)/europe/germany/potsdam/config')
      return configModule.default
    }
    case 'prague': {
      const configModule = await import('@/app/(game)/europe/czechia/prague/config')
      return configModule.default
    }
    case 'pune': {
      const configModule = await import('@/app/(game)/asia/india/pune/config')
      return configModule.default
    }
    case 'pyongyang': {
      const configModule = await import('@/app/(game)/asia/north-korea/pyongyang/config')
      return configModule.default
    }
    case 'qingdao': {
      const configModule = await import('@/app/(game)/asia/china/qingdao/config')
      return configModule.default
    }
    case 'qiubei': {
      const configModule = await import('@/app/(game)/asia/china/qiubei/config')
      return configModule.default
    }
    case 'quito': {
      const configModule = await import('@/app/(game)/south-america/ecuador/quito/config')
      return configModule.default
    }
    case 'recife': {
      const configModule = await import('@/app/(game)/south-america/brazil/recife/config')
      return configModule.default
    }
    case 'rennes': {
      const configModule = await import('@/app/(game)/europe/france/rennes/config')
      return configModule.default
    }
    case 'rio-de-janeiro': {
      const configModule = await import('@/app/(game)/south-america/brazil/rio-de-janeiro/config')
      return configModule.default
    }
    case 'riyadh': {
      const configModule = await import('@/app/(game)/asia/saudi-arabia/riyadh/config')
      return configModule.default
    }
    case 'rotterdam': {
      const configModule = await import('@/app/(game)/europe/netherlands/rotterdam/config')
      return configModule.default
    }
    case 'russian-railways': {
      const configModule = await import('@/app/(game)/europe/russia/russian-railways/config')
      return configModule.default
    }
    case 'saint-petersburg': {
      const configModule = await import('@/app/(game)/europe/russia/saint-petersburg/config')
      return configModule.default
    }
    case 'salvador': {
      const configModule = await import('@/app/(game)/south-america/brazil/salvador/config')
      return configModule.default
    }
    case 'samara': {
      const configModule = await import('@/app/(game)/europe/russia/samara/config')
      return configModule.default
    }
    case 'san-juan': {
      const configModule = await import('@/app/(game)/north-america/usa/san-juan/config')
      return configModule.default
    }
    case 'santiago': {
      const configModule = await import('@/app/(game)/south-america/chile/santiago/config')
      return configModule.default
    }
    case 'santo-domingo': {
      const configModule = await import('@/app/(game)/north-america/dominican-republic/santo-domingo/config')
      return configModule.default
    }
    case 'sanya': {
      const configModule = await import('@/app/(game)/asia/china/sanya/config')
      return configModule.default
    }
    case 'sao-paulo': {
      const configModule = await import('@/app/(game)/south-america/brazil/sao-paulo/config')
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
    case 'shinkansen': {
      const configModule = await import('@/app/(game)/asia/japan/shinkansen/config')
      return configModule.default
    }
    case 'shiraz': {
      const configModule = await import('@/app/(game)/asia/iran/shiraz/config')
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
    case 'sncf': {
      const configModule = await import('@/app/(game)/europe/france/sncf/config')
      return configModule.default
    }
    case 'sofia': {
      const configModule = await import('@/app/(game)/europe/bulgaria/sofia/config')
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
    case 'suzhou': {
      const configModule = await import('@/app/(game)/asia/china/suzhou/config')
      return configModule.default
    }
    case 'sydney': {
      const configModule = await import('@/app/(game)/oceania/australia/sydney/config')
      return configModule.default
    }
    case 'tabriz': {
      const configModule = await import('@/app/(game)/asia/iran/tabriz/config')
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
    case 'tashkent': {
      const configModule = await import('@/app/(game)/asia/uzbekistan/tashkent/config')
      return configModule.default
    }
    case 'taw': {
      const configModule = await import('@/app/(game)/europe/uk/taw/config')
      return configModule.default
    }
    case 'tbilisi': {
      const configModule = await import('@/app/(game)/asia/georgia/tbilisi/config')
      return configModule.default
    }
    case 'tehran': {
      const configModule = await import('@/app/(game)/asia/iran/tehran/config')
      return configModule.default
    }
    case 'thessaloniki': {
      const configModule = await import('@/app/(game)/europe/greece/thessaloniki/config')
      return configModule.default
    }
    case 'thsr': {
      const configModule = await import('@/app/(game)/asia/taiwan/thsr/config')
      return configModule.default
    }
    case 'tianjin': {
      const configModule = await import('@/app/(game)/asia/china/tianjin/config')
      return configModule.default
    }
    case 'tianshui': {
      const configModule = await import('@/app/(game)/asia/china/tianshui/config')
      return configModule.default
    }
    case 'tokyo': {
      const configModule = await import('@/app/(game)/asia/japan/tokyo/config')
      return configModule.default
    }
    case 'tokyo-area': {
      const configModule = await import('@/app/(game)/asia/japan/tokyo-area/config')
      return configModule.default
    }
    case 'toronto-waterloo': {
      const configModule = await import('@/app/(game)/north-america/canada/toronto-waterloo/config')
      return configModule.default
    }
    case 'toulouse': {
      const configModule = await import('@/app/(game)/europe/france/toulouse/config')
      return configModule.default
    }
    case 'tra': {
      const configModule = await import('@/app/(game)/asia/taiwan/tra/config')
      return configModule.default
    }
    case 'tren-maya': {
      const configModule = await import('@/app/(game)/north-america/mexico/tren-maya/config')
      return configModule.default
    }
    case 'trenitalia': {
      const configModule = await import('@/app/(game)/europe/italy/trenitalia/config')
      return configModule.default
    }
    case 'tucson': {
      const configModule = await import('@/app/(game)/north-america/usa/tucson/config')
      return configModule.default
    }
    case 'turin': {
      const configModule = await import('@/app/(game)/europe/italy/turin/config')
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
    case 'valencia': {
      const configModule = await import('@/app/(game)/south-america/venezuela/valencia/config')
      return configModule.default
    }
    case 'vancouver': {
      const configModule = await import('@/app/(game)/north-america/canada/vancouver/config')
      return configModule.default
    }
    case 'viarail': {
      const configModule = await import('@/app/(game)/north-america/canada/viarail/config')
      return configModule.default
    }
    case 'vienna': {
      const configModule = await import('@/app/(game)/europe/austria/vienna/config')
      return configModule.default
    }
    case 'volgograd': {
      const configModule = await import('@/app/(game)/europe/russia/volgograd/config')
      return configModule.default
    }
    case 'warsaw': {
      const configModule = await import('@/app/(game)/europe/poland/warsaw/config')
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
    case 'wuhan': {
      const configModule = await import('@/app/(game)/asia/china/wuhan/config')
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
    case 'xian': {
      const configModule = await import('@/app/(game)/asia/china/xian/config')
      return configModule.default
    }
    case 'xishui': {
      const configModule = await import('@/app/(game)/asia/china/xishui/config')
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
    case 'yekaterinburg': {
      const configModule = await import('@/app/(game)/asia/russia/yekaterinburg/config')
      return configModule.default
    }
    case 'yerevan': {
      const configModule = await import('@/app/(game)/asia/armenia/yerevan/config')
      return configModule.default
    }
    case 'yinchuan': {
      const configModule = await import('@/app/(game)/asia/china/yinchuan/config')
      return configModule.default
    }
    case 'yogyakarta': {
      const configModule = await import('@/app/(game)/asia/indonesia/yogyakarta/config')
      return configModule.default
    }
    case 'yokohama': {
      const configModule = await import('@/app/(game)/asia/japan/yokohama/config')
      return configModule.default
    }
    case 'zhangjiakou': {
      const configModule = await import('@/app/(game)/asia/china/zhangjiakou/config')
      return configModule.default
    }
    case 'zhengzhou': {
      const configModule = await import('@/app/(game)/asia/china/zhengzhou/config')
      return configModule.default
    }
    default:
      return null
  }
}
