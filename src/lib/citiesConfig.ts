import { AVAILABLE_CITY_SLUGS } from './availableCityData'
import { getCityOpenGraphImagePath } from './cityAssets'

export interface ICity {
  name: string
  image: string
  link: string
  continent: string
  disabled?: boolean
  hideInStats?: boolean
  keywords?: string[]
}

type CityBase = Omit<ICity, 'image'>

const isExplicitlyEnabled = (city: CityBase | ICity): boolean =>
  city.disabled === false || city.hideInStats === false

const normalizeAvailability = <T extends CityBase | ICity>(city: T): T => {
  if (isExplicitlyEnabled(city)) {
    return { ...city, disabled: false, hideInStats: false }
  }
  return city
}

const rawCities: CityBase[] = [
  // North America
  {
    name: 'Albuquerque, NM',
    link: '/north-america/usa/albuquerque',
    continent: 'North America',
  },
  {
    name: 'Amtrak, USA',
    link: '/north-america/usa/amtrak',
    continent: 'North America',
    disabled: false,
    hideInStats: false,
  },
  {
    name: 'Atlanta, GA',
    link: '/north-america/usa/atlanta',
    continent: 'North America',
  },
  {
    name: 'Austin, TX',
    link: '/north-america/usa/austin',
    continent: 'North America',
  },
  {
    name: 'California State, USA',
    link: '/north-america/usa/california-state',
    continent: 'North America',
    keywords: [
      'San Francisco',
      'Los Angeles',
      'San Diego',
      'Sacramento',
      'BART',
      'Muni',
      'LA Metro',
      'MTS',
    ],
  },
  {
    name: 'Boston, MA',
    link: '/north-america/usa/boston',
    continent: 'North America',
  },
  {
    name: 'Buffalo, NY',
    link: '/north-america/usa/buffalo',
    continent: 'North America',
  },
  {
    name: 'Calgary, AB',
    link: '/north-america/canada/calgary',
    continent: 'North America',
  },
  {
    name: 'Charlotte, NC',
    link: '/north-america/usa/charlotte',
    continent: 'North America',
  },
  {
    name: 'Nashville, TN',
    link: '/north-america/usa/nashville',
    continent: 'North America',
  },
  {
    name: 'Chicago, IL—Kenosha, WI',
    link: '/north-america/usa/chicago',
    keywords: ['Chicago', 'Kenosha'],
    continent: 'North America',
  },
  {
    name: 'Cincinnati, OH',
    link: '/north-america/usa/cincinnati',
    continent: 'North America',
  },
  {
    name: 'Cleveland, OH',
    link: '/north-america/usa/cleveland',
    continent: 'North America',
  },
  {
    name: 'Dallas—Fort Worth, TX',
    link: '/north-america/usa/dallas',
    continent: 'North America',
    hideInStats: true,
  },
  {
    name: 'Denver, CO',
    link: '/north-america/usa/denver',
    continent: 'North America',
  },
  {
    name: 'Detroit, MI',
    link: '/north-america/usa/detroit',
    continent: 'North America',
  },
  {
    name: 'Edmonton, AB',
    link: '/north-america/canada/edmonton',
    continent: 'North America',
  },
  {
    name: 'El Paso, TX',
    link: '/north-america/usa/elpaso',
    continent: 'North America',
  },
  {
    name: 'Galveston, TX',
    link: '/north-america/usa/galveston',
    continent: 'North America',
  },
  // Africa
  {
    name: 'Algiers, DZ',
    link: '/africa/algeria/algiers',
    continent: 'Africa',
    keywords: ['Alger', 'Algérie'],
  },
  {
    name: 'Cairo (القاهرة), EG',
    link: '/africa/egypt/cairo',
    continent: 'Africa',
  },
  {
    name: 'Lagos, NG',
    link: '/africa/nigeria/lagos',
    continent: 'Africa',
  },
  {
    name: 'Metrorail, ZA',
    link: '/africa/south-africa/metrorail',
    continent: 'Africa',
  },
  // South America
  {
    name: 'Belo Horizonte, BR',
    link: '/south-america/brazil/belo-horizonte',
    continent: 'South America',
  },
  {
    name: 'Brasília, BR',
    link: '/south-america/brazil/brasilia',
    continent: 'South America',
  },
  {
    name: 'Buenos Aires, AR',
    link: '/south-america/argentina/buenos-aires',
    continent: 'South America',
  },
  {
    name: 'Caracas, VE',
    link: '/south-america/venezuela/caracas',
    continent: 'South America',
  },
  {
    name: 'Fortaleza, BR',
    link: '/south-america/brazil/fortaleza',
    continent: 'South America',
  },
  {
    name: 'Lima, PE',
    link: '/south-america/peru/lima',
    continent: 'South America',
  },
  {
    name: 'Maracaibo, VE',
    link: '/south-america/venezuela/maracaibo',
    continent: 'South America',
    keywords: ['Zulia', 'Venezuela', 'Lago de Maracaibo'],
  },
  {
    name: 'Medellín, CO',
    link: '/south-america/colombia/medellin',
    continent: 'South America',
  },
  {
    name: 'Porto Alegre, BR',
    link: '/south-america/brazil/porto-alegre',
    continent: 'South America',
  },
  {
    name: 'Quito, EC',
    link: '/south-america/ecuador/quito',
    continent: 'South America',
  },
  {
    name: 'Recife, BR',
    link: '/south-america/brazil/recife',
    continent: 'South America',
  },
  {
    name: 'Rio de Janeiro, BR',
    link: '/south-america/brazil/rio-de-janeiro',
    continent: 'South America',
  },
  {
    name: 'Salvador, BR',
    link: '/south-america/brazil/salvador',
    continent: 'South America',
  },
  {
    name: 'Santiago, CL',
    link: '/south-america/chile/santiago',
    continent: 'South America',
  },
  {
    name: 'São Paulo, BR',
    link: '/south-america/brazil/sao-paulo',
    continent: 'South America',
  },
  {
    name: 'Valencia, VE',
    link: '/south-america/venezuela/valencia',
    continent: 'South America',
  },
  {
    name: 'Honolulu, HI',
    link: '/north-america/usa/honolulu',
    continent: 'North America',
  },
  {
    name: 'Houston, TX',
    link: '/north-america/usa/houston',
    continent: 'North America',
  },
  {
    name: 'Kansas City, MO',
    link: '/north-america/usa/kc',
    continent: 'North America',
  },
  {
    name: 'Las Vegas, NV',
    link: '/north-america/usa/lv',
    continent: 'North America',
  },
  {
    name: 'Little Rock, AR',
    link: '/north-america/usa/lr',
    continent: 'North America',
  },
  {
    name: 'Memphis, TN',
    link: '/north-america/usa/memphis',
    continent: 'North America',
  },
  {
    name: 'Mexico City, CMX',
    link: '/north-america/mexico/mexico-city',
    continent: 'North America',
  },
  {
    name: 'Guadalajara, JAL',
    link: '/north-america/mexico/guadalajara',
    continent: 'North America',
  },
  {
    name: 'Monterrey, NLE',
    link: '/north-america/mexico/monterrey',
    continent: 'North America',
  },
  {
    name: 'Florida State, USA',
    link: '/north-america/usa/florida-state',
    keywords: ['Florida', 'Miami', 'Orlando', 'Tampa', 'Jacksonville'],
    continent: 'North America',
  },
  {
    name: 'Panama City, PA',
    link: '/north-america/panama/panama-city',
    continent: 'North America',
  },
  {
    name: 'San Juan, PR',
    link: '/north-america/usa/san-juan',
    keywords: ['Puerto Rico', 'Tren Urbano'],
    continent: 'North America',
  },
  {
    name: 'Milwaukee, WI',
    link: '/north-america/usa/milwaukee',
    continent: 'North America',
  },
  {
    name: 'Minneapolis—St. Paul, MN',
    link: '/north-america/usa/twincities',
    continent: 'North America',
  },
  {
    name: 'Montréal, QC',
    link: '/north-america/canada/montreal',
    continent: 'North America',
  },
  {
    name: 'Morgantown, WV',
    link: '/north-america/usa/morgantown',
    continent: 'North America',
  },
  {
    name: 'New Orleans, LA',
    link: '/north-america/usa/neworleans',
    continent: 'North America',
  },
  {
    name: 'New York—New Jersey—Connecticut',
    link: '/north-america/usa/nyc',
    keywords: ['New York City', 'NYC', 'Big Apple'],
    continent: 'North America',
  },
  {
    name: 'Norfolk, VA',
    link: '/north-america/usa/norfolk',
    continent: 'North America',
  },
  {
    name: 'Oklahoma City, OK',
    link: '/north-america/usa/okc',
    continent: 'North America',
  },
  // {
  //   name: 'Omaha, NE',
  //   image: omaha,
  //   link: '/north-america/usa/omaha',
  //   continent: 'North America',
  // },
  {
    name: 'Ottawa, ON',
    link: '/north-america/canada/ottawa',
    continent: 'North America',
  },
  {
    name: 'Philadelphia, PA',
    link: '/north-america/usa/philly',
    keywords: ['Philadelphia', 'Philly'],
    continent: 'North America',
  },
  {
    name: 'Phoenix–Tempe, AZ',
    link: '/north-america/usa/phoenix',
    continent: 'North America',
  },
  {
    name: 'Pittsburgh, PA',
    link: '/north-america/usa/pittsburgh',
    continent: 'North America',
  },
  {
    name: 'Portland, OR',
    link: '/north-america/usa/portland',
    continent: 'North America',
  },
  {
    name: 'Salt Lake City, UT',
    link: '/north-america/usa/slc',
    continent: 'North America',
  },
  {
    name: 'Santo Domingo, DO',
    link: '/north-america/dominican-republic/santo-domingo',
    continent: 'North America',
  },
  {
    name: 'Seattle—Tacoma, WA',
    link: '/north-america/usa/seattle',
    continent: 'North America',
  },
  {
    name: 'St. Louis, MO',
    link: '/north-america/usa/stl',
    continent: 'North America',
  },
  {
    name: 'Toronto—Waterloo, ON',
    link: '/north-america/canada/toronto-waterloo',
    continent: 'North America',
  },
  {
    name: 'Tren Maya, MX',
    link: '/north-america/mexico/tren-maya',
    continent: 'North America',
  },
  {
    name: 'Tucson, AZ',
    link: '/north-america/usa/tucson',
    keywords: ['Sun Link', 'Tucson Streetcar'],
    continent: 'North America',
  },
  {
    name: 'Vancouver, BC',
    link: '/north-america/canada/vancouver',
    continent: 'North America',
  },
  {
    name: 'Via Rail, CAN',
    link: '/north-america/canada/viarail',
    continent: 'North America',
  },
  {
    name: 'Washington DC—Baltimore, DC/MD',
    link: '/north-america/usa/dc',
    continent: 'North America',
  },
  // Europe
  {
    name: 'Adana, TR',
    link: '/europe/turkey/adana',
    continent: 'Europe',
  },
  {
    name: 'Amsterdam, NL',
    link: '/europe/netherlands/amsterdam',
    continent: 'Europe',
  },
  {
    name: 'Ankara, TR',
    link: '/europe/turkey/ankara',
    continent: 'Europe',
  },
  {
    name: 'Athens (Αθήνα), GR',
    link: '/europe/greece/athens',
    continent: 'Europe',
  },
  {
    name: 'Barcelona, CT',
    link: '/europe/spain/barcelona',
    continent: 'Europe',
  },
  {
    name: 'Berlin, BE',
    link: '/europe/germany/berlin',
    continent: 'Europe',
  },
  {
    name: 'Bilbao, ES',
    link: '/europe/spain/bilbao',
    continent: 'Europe',
  },
  {
    name: 'Blackpool, ENG',
    link: '/europe/uk/blackpool',
    continent: 'Europe',
  },
  {
    name: 'Brescia, IT',
    link: '/europe/italy/brescia',
    continent: 'Europe',
  },
  {
    name: 'Brussels, BE',
    link: '/europe/belgium/brussels',
    continent: 'Europe',
  },
  {
    name: 'Bucharest, RO',
    link: '/europe/romania/bucharest',
    continent: 'Europe',
  },
  {
    name: 'Budapest, HU',
    link: '/europe/hungary/budapest',
    continent: 'Europe',
  },
  {
    name: 'Bursa, TR',
    link: '/europe/turkey/bursa',
    continent: 'Europe',
  },
  {
    name: 'Catania, IT',
    link: '/europe/italy/catania',
    continent: 'Europe',
  },
  {
    name: 'Copenhagen, DK',
    link: '/europe/denmark/copenhagen',
    continent: 'Europe',
  },
  {
    name: 'Dnipro (Дніпро), UA',
    link: '/europe/ukraine/dnipro',
    continent: 'Europe',
  },
  {
    name: 'Dresden, SN',
    link: '/europe/germany/dresden',
    continent: 'Europe',
  },
  {
    name: 'Dublin, IE',
    link: '/europe/ireland/dublin',
    continent: 'Europe',
  },
  {
    name: 'Edinburgh, SCT',
    link: '/europe/uk/edinburgh',
    continent: 'Europe',
  },
  {
    name: 'Genoa, IT',
    link: '/europe/italy/genoa',
    continent: 'Europe',
  },
  {
    name: 'Glasgow, SCT',
    link: '/europe/uk/glasgow',
    continent: 'Europe',
  },
  {
    name: 'Hamburg, HH',
    link: '/europe/germany/hamburg',
    continent: 'Europe',
  },
  {
    name: 'Helsinki, FI',
    link: '/europe/finland/helsinki',
    continent: 'Europe',
  },
  {
    name: 'Intercity-Express (ICE), DE',
    link: '/europe/germany/ice',
    continent: 'Europe',
  },
  {
    name: 'Istanbul, TR',
    link: '/europe/turkey/istanbul',
    continent: 'Europe',
  },
  {
    name: 'İzmir, TR',
    link: '/europe/turkey/izmir',
    continent: 'Europe',
  },
  {
    name: 'Karlsruhe, BW',
    link: '/europe/germany/karlsruhe',
    continent: 'Europe',
  },
  {
    name: 'Kazan (Казань), RU',
    link: '/europe/russia/kazan',
    continent: 'Europe',
  },
  {
    name: 'Kharkiv (Харків), UA',
    link: '/europe/ukraine/kharkiv',
    continent: 'Europe',
  },
  {
    name: 'Kryvyi Rih (Кривий Ріг), UA',
    link: '/europe/ukraine/kryvyi-rih',
    continent: 'Europe',
  },
  {
    name: 'Kyiv (Київ), UA',
    link: '/europe/ukraine/kyiv',
    continent: 'Europe',
  },
  {
    name: 'Lausanne, CH',
    link: '/europe/switzerland/lausanne',
    continent: 'Europe',
  },
  {
    name: 'Lille, FR',
    link: '/europe/france/lille',
    continent: 'Europe',
  },
  {
    name: 'Lisbon, PT',
    link: '/europe/portugal/lisbon',
    continent: 'Europe',
  },
  {
    name: 'Liverpool, ENG',
    link: '/europe/uk/liverpool',
    continent: 'Europe',
  },
  {
    name: 'London, ENG',
    link: '/europe/uk/london',
    continent: 'Europe',
  },
  {
    name: 'Lyon, FR',
    link: '/europe/france/lyon',
    continent: 'Europe',
  },
  {
    name: 'Madrid, MD',
    link: '/europe/spain/madrid',
    continent: 'Europe',
  },
  {
    name: 'Marseille, FR',
    link: '/europe/france/marseille',
    continent: 'Europe',
  },
  {
    name: 'Milan, IT',
    link: '/europe/italy/milan',
    continent: 'Europe',
  },
  {
    name: 'Minsk (Мінск), BY',
    link: '/europe/belarus/minsk',
    continent: 'Europe',
  },
  {
    name: 'Moscow (Москва), RU',
    link: '/europe/russia/moscow',
    continent: 'Europe',
  },
  {
    name: 'Naples, IT',
    link: '/europe/italy/naples',
    continent: 'Europe',
  },
  {
    name: 'National Rail, GB',
    link: '/europe/uk/national-rail',
    continent: 'Europe',
  },
  {
    name: 'Nizhny Novgorod (Нижний Новгород), RU',
    link: '/europe/russia/nizhny-novgorod',
    continent: 'Europe',
  },
  {
    name: 'Nuremberg, BY',
    link: '/europe/germany/nuremberg',
    continent: 'Europe',
  },
  {
    name: 'Oslo, NO',
    link: '/europe/norway/oslo',
    continent: 'Europe',
  },
  {
    name: 'Prague, CZ',
    link: '/europe/czechia/prague',
    continent: 'Europe',
  },
  {
    name: 'Rennes, FR',
    link: '/europe/france/rennes',
    continent: 'Europe',
  },
  {
    name: 'Rome, IT',
    link: '/europe/italy/rome',
    continent: 'Europe',
  },
  {
    name: 'Manchester, ENG',
    link: '/europe/uk/manchester',
    continent: 'Europe',
  },
  {
    name: 'Munich, BY',
    link: '/europe/germany/munich',
    continent: 'Europe',
    keywords: ['Muenchen', 'München'],
  },
  {
    name: 'Nottingham, ENG',
    link: '/europe/uk/nottingham',
    continent: 'Europe',
  },
  {
    name: 'Paris, FR',
    link: '/europe/france/paris',
    continent: 'Europe',
  },
  {
    name: 'Potsdam, BB',
    link: '/europe/germany/potsdam',
    continent: 'Europe',
  },
  {
    name: 'Rotterdam, NL',
    link: '/europe/netherlands/rotterdam',
    continent: 'Europe',
  },
  {
    name: 'Russian Railways (РЖД), RU',
    link: '/europe/russia/russian-railways',
    continent: 'Europe',
  },
  {
    name: 'Saint Petersburg (Санкт-Петербург), RU',
    link: '/europe/russia/saint-petersburg',
    continent: 'Europe',
  },
  {
    name: 'Samara (Самара), RU',
    link: '/europe/russia/samara',
    continent: 'Europe',
  },
  {
    name: 'Sheffield, ENG',
    link: '/europe/uk/sheffield',
    continent: 'Europe',
  },
  {
    name: 'SNCF (TGV & Intercités), FR',
    link: '/europe/france/sncf',
    continent: 'Europe',
  },
  {
    name: 'Sofia (София), BG',
    link: '/europe/bulgaria/sofia',
    continent: 'Europe',
  },
  {
    name: 'Stockholm, SE',
    link: '/europe/sweden/stockholm',
    continent: 'Europe',
  },
  {
    name: 'Thessaloniki (Θεσσαλονίκη), GR',
    link: '/europe/greece/thessaloniki',
    continent: 'Europe',
  },
  {
    name: 'Toulouse, FR',
    link: '/europe/france/toulouse',
    continent: 'Europe',
  },
  {
    name: 'Trenitalia (Frecce & Intercity), IT',
    link: '/europe/italy/trenitalia',
    continent: 'Europe',
  },
  {
    name: 'Turin, IT',
    link: '/europe/italy/turin',
    continent: 'Europe',
  },
  {
    name: 'Tyne and Wear, ENG',
    link: '/europe/uk/taw',
    continent: 'Europe',
  },
  {
    name: 'Vienna, AT',
    link: '/europe/austria/vienna',
    continent: 'Europe',
  },
  {
    name: 'Volgograd (Волгоград), RU',
    link: '/europe/russia/volgograd',
    continent: 'Europe',
  },
  {
    name: 'Warsaw, PL',
    link: '/europe/poland/warsaw',
    continent: 'Europe',
  },
  {
    name: 'West Midlands, ENG',
    link: '/europe/uk/wm',
    continent: 'Europe',
    keywords: ['Birmingham', 'TfWM', 'West Midlands Metro'],
  },

  // Asia
  {
    name: 'Agra (आगरा), IN',
    link: '/asia/india/agra',
    continent: 'Asia',
  },
  {
    name: 'Ahmedabad (અમદાવાદ), IN',
    link: '/asia/india/ahmedabad',
    continent: 'Asia',
  },
  {
    name: 'Almaty (Алматы), KZ',
    link: '/asia/kazakhstan/almaty',
    continent: 'Asia',
  },
  {
    name: 'Astana (Астана), KZ',
    link: '/asia/kazakhstan/astana',
    continent: 'Asia',
  },
  {
    name: 'Baku, AZ',
    link: '/asia/azerbaijan/baku',
    continent: 'Asia',
  },
  {
    name: 'Bengaluru (ಬೆಂಗಳೂರು), IN',
    link: '/asia/india/bengaluru',
    continent: 'Asia',
  },
  {
    name: 'Bhopal (भोपाल), IN',
    link: '/asia/india/bhopal',
    continent: 'Asia',
  },
  {
    name: 'Chennai (சென்னை), IN',
    link: '/asia/india/chennai',
    continent: 'Asia',
  },
  {
    name: 'China Railway High-speed (中国高铁), CN',
    link: '/asia/china/china-railway',
    continent: 'Asia',
  },
  {
    name: 'Delhi NCR (दिल्ली), IN',
    link: '/asia/india/delhi',
    continent: 'Asia',
  },
  {
    name: 'Dhaka (ঢাকা), BD',
    link: '/asia/bangladesh/dhaka',
    continent: 'Asia',
  },
  {
    name: 'Doha (الدوحة), QA',
    link: '/asia/qatar/doha',
    continent: 'Asia',
  },
  {
    name: 'Dubai (دبي), AE',
    link: '/asia/uae/dubai',
    continent: 'Asia',
  },
  {
    name: 'Greater Tokyo (首都圏), TKY',
    link: '/asia/japan/tokyo-area',
    continent: 'Asia',
  },
  {
    name: 'Guangdong–Hong Kong–Macao Greater Bay Area (粤港澳大湾区), GD/HK/MO',
    link: '/asia/china/gba',
    continent: 'Asia',
    keywords: [
      'Hong Kong',
      'Shenzhen',
      'Dongguan',
      'Guangzhou',
      'Foshan',
      'Macau',
      'Macao',
      'Canton',
      'GBA',
      'Greater Bay Area',
    ],
  },
  {
    name: 'Beijing (北京), BJ',
    link: '/asia/china/beijing',
    continent: 'Asia',
  },
  {
    name: 'Changzhou (常州), JS',
    link: '/asia/china/changzhou',
    continent: 'Asia',
  },
  {
    name: 'Guiyang (贵阳), GZ',
    link: '/asia/china/guiyang',
    continent: 'Asia',
    hideInStats: true,
  },
  {
    name: 'Hyderabad (హైదరాబాద్), IN',
    link: '/asia/india/hyderabad',
    continent: 'Asia',
  },
  {
    name: 'Indore (इंदौर), IN',
    link: '/asia/india/indore',
    continent: 'Asia',
  },
  {
    name: 'Isfahan (اصفهان), IR',
    link: '/asia/iran/isfahan',
    continent: 'Asia',
  },
  {
    name: 'Jaipur (जयपुर), IN',
    link: '/asia/india/jaipur',
    continent: 'Asia',
  },
  {
    name: 'Kanpur (कानपुर), IN',
    link: '/asia/india/kanpur',
    continent: 'Asia',
  },
  {
    name: 'Karaj (کرج), IR',
    link: '/asia/iran/karaj',
    continent: 'Asia',
  },
  {
    name: 'Kochi (കൊച്ചി), IN',
    link: '/asia/india/kochi',
    continent: 'Asia',
  },
  {
    name: 'Kolkata (কলকাতা), IN',
    link: '/asia/india/kolkata',
    continent: 'Asia',
  },
  {
    name: 'Korail (코레일), KR',
    link: '/asia/south-korea/korail',
    continent: 'Asia',
  },
  {
    name: 'Korean State Railway (조선철도), KP',
    link: '/asia/north-korea/korean-state-railway',
    continent: 'Asia',
  },
  {
    name: 'KTM Komuter Northern, MY',
    link: '/asia/malaysia/komuter-utara',
    continent: 'Asia',
  },
  {
    name: 'Lahore (لاہور), PK',
    link: '/asia/pakistan/lahore',
    continent: 'Asia',
  },
  {
    name: 'Lucknow (लखनऊ), IN',
    link: '/asia/india/lucknow',
    continent: 'Asia',
  },
  {
    name: 'Mashhad (مشهد), IR',
    link: '/asia/iran/mashhad',
    continent: 'Asia',
  },
  {
    name: 'Mecca (مكة), SA',
    link: '/asia/saudi-arabia/mecca',
    continent: 'Asia',
  },
  {
    name: 'Meerut (मेरठ), IN',
    link: '/asia/india/meerut',
    continent: 'Asia',
  },
  {
    name: 'Mumbai (मुंबई), IN',
    link: '/asia/india/mumbai',
    continent: 'Asia',
  },
  {
    name: 'Nagpur (नागपूर), IN',
    link: '/asia/india/nagpur',
    continent: 'Asia',
  },
  {
    name: 'Novosibirsk (Новосибирск), RU',
    link: '/asia/russia/novosibirsk',
    continent: 'Asia',
  },
  {
    name: 'Patna (पटना), IN',
    link: '/asia/india/patna',
    continent: 'Asia',
  },
  {
    name: 'Pune (पुणे), IN',
    link: '/asia/india/pune',
    continent: 'Asia',
  },
  {
    name: 'Pyongyang (평양), KP',
    link: '/asia/north-korea/pyongyang',
    continent: 'Asia',
  },
  {
    name: 'Harbin (哈尔滨), HL',
    link: '/asia/china/harbin',
    continent: 'Asia',
  },
  {
    name: 'Hohhot (呼和浩特), NM',
    link: '/asia/china/hohhot',
    continent: 'Asia',
  },
  {
    name: 'Jinhua (金华), ZJ',
    link: '/asia/china/jinhua',
    continent: 'Asia',
  },
  {
    name: 'Lanzhou (兰州), GS',
    link: '/asia/china/lanzhou',
    continent: 'Asia',
  },
  {
    name: 'Luoyang (洛阳), HA',
    link: '/asia/china/luoyang',
    continent: 'Asia',
    hideInStats: true,
  },
  {
    name: 'Riyadh (الرياض), SA',
    link: '/asia/saudi-arabia/riyadh',
    continent: 'Asia',
  },
  {
    name: 'Seoul (서울), SE',
    link: '/asia/south-korea/seoul',
    continent: 'Asia',
  },
  {
    name: 'Shanghai (上海), SH',
    link: '/asia/china/shanghai',
    continent: 'Asia',
  },
  {
    name: 'Nanning (南宁), GX',
    link: '/asia/china/nanning',
    continent: 'Asia',
  },
  {
    name: 'Nantong (南通), JS',
    link: '/asia/china/nantong',
    continent: 'Asia',
    hideInStats: true,
  },
  {
    name: 'Shijiazhuang (石家庄), HE',
    link: '/asia/china/shijiazhuang',
    continent: 'Asia',
    hideInStats: true,
  },
  {
    name: 'Shinkansen (新幹線), JP',
    link: '/asia/japan/shinkansen',
    continent: 'Asia',
  },
  {
    name: 'Shiraz (شیراز), IR',
    link: '/asia/iran/shiraz',
    continent: 'Asia',
  },
  {
    name: 'Tabriz (تبریز), IR',
    link: '/asia/iran/tabriz',
    continent: 'Asia',
  },
  {
    name: 'Taiwan Railway (臺鐵), TW',
    link: '/asia/taiwan/tra',
    continent: 'Asia',
  },
  {
    name: 'Taiyuan (太原), SX',
    link: '/asia/china/taiyuan',
    continent: 'Asia',
    hideInStats: true,
  },
  {
    name: 'Taizhou (台州), ZJ',
    link: '/asia/china/taizhou',
    continent: 'Asia',
    hideInStats: true,
  },
  {
    name: 'Tashkent, UZ',
    link: '/asia/uzbekistan/tashkent',
    continent: 'Asia',
  },
  {
    name: 'Tbilisi (თბილისი), GE',
    link: '/asia/georgia/tbilisi',
    continent: 'Asia',
  },
  {
    name: 'Tehran (تهران), IR',
    link: '/asia/iran/tehran',
    continent: 'Asia',
  },
  {
    name: 'Wenzhou (温州), ZJ',
    link: '/asia/china/wenzhou',
    continent: 'Asia',
    hideInStats: true,
  },
  {
    name: 'Wuhu (芜湖), AH',
    link: '/asia/china/wuhu',
    continent: 'Asia',
    hideInStats: true,
  },
  {
    name: 'Xiamen (厦门), FJ',
    link: '/asia/china/xiamen',
    continent: 'Asia',
    hideInStats: true,
  },
  {
    name: 'Nanchang (南昌), JX',
    link: '/asia/china/nanchang',
    continent: 'Asia',
    hideInStats: true,
  },
  {
    name: 'Xuzhou (徐州), JS',
    link: '/asia/china/xuzhou',
    continent: 'Asia',
    hideInStats: true,
  },
  {
    name: 'Shenyang (沈阳), LN',
    link: '/asia/china/shenyang',
    continent: 'Asia',
    hideInStats: true,
  },
  {
    name: 'Wuxi (无锡), JS',
    link: '/asia/china/wuxi',
    continent: 'Asia',
    hideInStats: true,
  },
  {
    name: 'Changchun (长春), JL',
    link: '/asia/china/changchun',
    continent: 'Asia',
    hideInStats: true,
  },
  {
    name: 'Dalian (大连), LN',
    link: '/asia/china/dalian',
    continent: 'Asia',
    hideInStats: true,
  },
  {
    name: 'Fuzhou (福州), FJ',
    link: '/asia/china/fuzhou',
    continent: 'Asia',
  },
  {
    name: 'Hefei (合肥), AH',
    link: '/asia/china/hefei',
    continent: 'Asia',
  },
  {
    name: 'Jinan (济南), SD',
    link: '/asia/china/jinan',
    continent: 'Asia',
  },
  {
    name: 'Kunming (昆明), YN',
    link: '/asia/china/kunming',
    continent: 'Asia',
  },
  {
    name: 'Changsha (长沙), HN',
    link: '/asia/china/changsha',
    continent: 'Asia',
  },
  {
    name: 'Ningbo (宁波), ZJ',
    link: '/asia/china/ningbo',
    continent: 'Asia',
  },
  {
    name: 'Qingdao (青岛), SD',
    link: '/asia/china/qingdao',
    continent: 'Asia',
  },
  {
    name: 'Suzhou (苏州), JS',
    link: '/asia/china/suzhou',
    continent: 'Asia',
  },
  {
    name: 'Chongqing (重庆), CQ',
    link: '/asia/china/chongqing',
    continent: 'Asia',
  },
  {
    name: 'Yekaterinburg (Екатеринбург), RU',
    link: '/asia/russia/yekaterinburg',
    continent: 'Asia',
  },
  {
    name: 'Yerevan (Երևան), AM',
    link: '/asia/armenia/yerevan',
    continent: 'Asia',
  },
  {
    name: 'Yogyakarta–Solo, ID',
    link: '/asia/indonesia/yogyakarta',
    continent: 'Asia',
  },
  {
    name: 'Yokohama (横浜), KNG',
    link: '/asia/japan/yokohama',
    continent: 'Asia',
  },
  {
    name: 'Zhengzhou (郑州), HA',
    link: '/asia/china/zhengzhou',
    continent: 'Asia',
  },
  {
    name: 'Wuhan (武汉), HB',
    link: '/asia/china/wuhan',
    continent: 'Asia',
  },
  {
    name: 'Hangzhou-Shaoxing (杭州-绍兴), ZJ',
    link: '/asia/china/hangzhou',
    continent: 'Asia',
  },
  {
    name: 'Nanjing (南京), JS',
    link: '/asia/china/nanjing',
    continent: 'Asia',
  },
  {
    name: 'Tianjin (天津), TJ',
    link: '/asia/china/tianjin',
    continent: 'Asia',
  },
  {
    name: "Xi'an (西安), SN",
    link: '/asia/china/xian',
    continent: 'Asia',
  },
  {
    name: 'Chengdu–Dujiangyan (成都-都江堰), SC',
    link: '/asia/china/chengdu',
    continent: 'Asia',
  },
  {
    name: 'Fukuoka (福岡), FKO',
    link: '/asia/japan/fukuoka',
    continent: 'Asia',
    disabled: false,
    hideInStats: false,
  },
  {
    name: 'Hiroshima (広島), HRS',
    link: '/asia/japan/hiroshima',
    continent: 'Asia',
  },
  {
    name: 'Nagoya (名古屋), AIC',
    link: '/asia/japan/nagoya',
    continent: 'Asia',
  },
  {
    name: 'Okayama (岡山), OKY',
    link: '/asia/japan/okayama',
    continent: 'Asia',
    disabled: false,
    hideInStats: false,
  },
  {
    name: 'Osaka–Kobe (大阪・神戸), OSK-HYG',
    link: '/asia/japan/osaka-kobe',
    continent: 'Asia',
  },
  {
    name: 'Kyoto (京都), KYT',
    link: '/asia/japan/kyoto',
    continent: 'Asia',
    disabled: false,
    hideInStats: false,
  },
  {
    name: 'Sapporo (札幌), HKD',
    link: '/asia/japan/sapporo',
    continent: 'Asia',
  },
  {
    name: 'Sendai (仙台), MYG',
    link: '/asia/japan/sendai',
    continent: 'Asia',
    disabled: false,
    hideInStats: false,
  },
  {
    name: 'Daegu (대구), DG',
    link: '/asia/south-korea/daegu',
    continent: 'Asia',
    disabled: false,
    hideInStats: false,
  },
  {
    name: 'Daejeon (대전), DJ',
    link: '/asia/south-korea/daejeon',
    continent: 'Asia',
    disabled: false,
    hideInStats: false,
  },
  {
    name: 'Busan (부산), BS',
    link: '/asia/south-korea/busan',
    continent: 'Asia',
    disabled: false,
    hideInStats: false,
  },
  {
    name: 'Gwangju (광주), GJ',
    link: '/asia/south-korea/gwangju',
    continent: 'Asia',
    disabled: false,
    hideInStats: false,
  },
  {
    name: 'Kuala Lumpur, MY',
    link: '/asia/malaysia/kuala-lumpur',
    continent: 'Asia',
    disabled: false,
    hideInStats: false,
  },
  {
    name: 'Bangkok (กรุงเทพฯ), TH',
    link: '/asia/thailand/bangkok',
    continent: 'Asia',
    disabled: false,
    hideInStats: false,
  },
  {
    name: 'Jakarta, JK',
    link: '/asia/indonesia/jakarta',
    continent: 'Asia',
    disabled: false,
    hideInStats: false,
  },
  {
    name: 'Manila, PH',
    link: '/asia/philippines/manila',
    continent: 'Asia',
    disabled: false,
    hideInStats: false,
  },
  {
    name: 'Palembang, SS',
    link: '/asia/indonesia/palembang',
    continent: 'Asia',
    disabled: false,
    hideInStats: false,
  },
  {
    name: "Guang'an (广安), SC",
    link: '/asia/china/guangan',
    continent: 'Asia',
    hideInStats: true,
  },
  {
    name: "Huai'an (淮安), JS",
    link: '/asia/china/huaian',
    continent: 'Asia',
  },
  {
    name: 'Huangshi (黄石), HB',
    link: '/asia/china/huangshi',
    continent: 'Asia',
  },
  {
    name: 'Mengzhi (蒙自), YN',
    link: '/asia/china/mengzhi',
    continent: 'Asia',
  },
  {
    name: 'Jiaxing (嘉兴), ZJ',
    link: '/asia/china/jiaxing',
    continent: 'Asia',
  },
  {
    name: 'Sanya (三亚), HI',
    link: '/asia/china/sanya',
    continent: 'Asia',
    disabled: false,
    hideInStats: false,
  },
  {
    name: 'Tianshui (天水), GS',
    link: '/asia/china/tianshui',
    continent: 'Asia',
  },
  {
    name: 'Qiubei (丘北), YN',
    link: '/asia/china/qiubei',
    continent: 'Asia',
  },
  {
    name: 'Nanping (南平), FJ',
    link: '/asia/china/nanping',
    continent: 'Asia',
  },
  {
    name: 'Zhangjiakou (张家口), HE',
    link: '/asia/china/zhangjiakou',
    continent: 'Asia',
  },
  {
    name: 'Lijiang (丽江), YN',
    link: '/asia/china/lijiang',
    continent: 'Asia',
    hideInStats: false,
  },
  {
    name: 'Zhangye (张掖), GS',
    link: '/asia/china/zhangye',
    continent: 'Asia',
    hideInStats: true,
  },
  {
    name: 'Fenghuang (凤凰), HN',
    link: '/asia/china/fenghuang',
    continent: 'Asia',
  },
  {
    name: 'Xishui (习水), GZ',
    link: '/asia/china/xishui',
    continent: 'Asia',
  },
  {
    name: 'Yinchuan (银川), NX',
    link: '/asia/china/yinchuan',
    continent: 'Asia',
  },
  {
    name: 'Liupanshui (六盘水), GZ',
    link: '/asia/china/liupanshui',
    continent: 'Asia',
  },
  {
    name: 'Guilin (桂林), GX',
    link: '/asia/china/guilin',
    continent: 'Asia',
    hideInStats: true,
  },
  {
    name: 'Jining (济宁), SD',
    link: '/asia/china/jining',
    continent: 'Asia',
    hideInStats: true,
  },
  {
    name: 'Bengbu (蚌埠), AH',
    link: '/asia/china/bengbu',
    continent: 'Asia',
    hideInStats: true,
  },
  {
    name: 'Ürümqi (乌鲁木齐), XJ',
    link: '/asia/china/urumqi',
    continent: 'Asia',
  },
  {
    name: 'Singapore, SG',
    link: '/asia/singapore',
    continent: 'Asia',
  },
  {
    name: 'Tokyo (東京), TKY',
    link: '/asia/japan/tokyo',
    continent: 'Asia',
  },
  {
    name: 'Taiwan High Speed Rail (THSR), TW',
    link: '/asia/taiwan/thsr',
    continent: 'Asia',
  },
  {
    name: 'Kaohsiung (高雄), KHH',
    link: '/asia/taiwan/kaohsiung',
    continent: 'Asia',
  },
  {
    name: 'Taipei—New Taipei City—Taoyuan (臺北／新北／桃園), TPE/NWT/TAO',
    link: '/asia/taiwan/taipei',
    continent: 'Asia',
    disabled: false,
    hideInStats: false,
  },
  {
    name: 'Taichung (臺中), TXG',
    link: '/asia/taiwan/taichung',
    continent: 'Asia',
  },
  {
    name: 'Ho Chi Minh City (Thành phố Hồ Chí Minh), HCM',
    link: '/asia/vietnam/hochiminhcity',
    continent: 'Asia',
  },
  {
    name: 'Hanoi (Hà Nội), HAN',
    link: '/asia/vietnam/hanoi',
    continent: 'Asia',
  },

  // Oceania
  {
    name: 'Adelaide, SA',
    link: '/oceania/australia/adelaide',
    continent: 'Oceania',
  },
  {
    name: 'Auckland, AUK',
    link: '/oceania/new-zealand/auckland',
    continent: 'Oceania',
  },
  {
    name: 'Brisbane, QLD',
    link: '/oceania/australia/brisbane',
    continent: 'Oceania',
  },
  {
    name: 'Canberra, ACT',
    link: '/oceania/australia/canberra',
    continent: 'Oceania',
  },
  {
    name: 'Gold Coast, QLD',
    link: '/oceania/australia/goldcoast',
    continent: 'Oceania',
  },
  {
    name: 'KiwiRail, NZ',
    link: '/oceania/new-zealand/kiwirail',
    continent: 'Oceania',
  },
  {
    name: 'Melbourne, VIC',
    link: '/oceania/australia/melbourne',
    continent: 'Oceania',
  },
  {
    name: 'Newcastle, NSW',
    link: '/oceania/australia/newcastle',
    continent: 'Oceania',
  },
  {
    name: 'Perth, WA',
    link: '/oceania/australia/perth',
    continent: 'Oceania',
  },
  {
    name: 'Sydney, NSW',
    link: '/oceania/australia/sydney',
    continent: 'Oceania',
  },
  {
    name: 'Wellington, WGN',
    link: '/oceania/new-zealand/wellington',
    continent: 'Oceania',
  },
  {
    name: 'Yarra, VIC',
    link: '/oceania/australia/yarra',
    continent: 'Oceania',
  },
]

const getPathFromLink = (link: string): string | null => {
  if (!link.startsWith('/')) {
    return null
  }
  return link.replace(/^\//, '').split(/[?#]/)[0]
}

export const getSlugFromLink = (link: string): string | null => {
  const path = getPathFromLink(link)
  if (!path) {
    return null
  }
  const segments = path.split('/').filter(Boolean)
  return segments.length ? segments[segments.length - 1] : null
}

const PLACEHOLDER_CITY_PATHS = new Set([
  'asia/china/bengbu',
  'asia/china/delingha',
  'asia/china/guangan',
  'asia/china/guilin',
  'asia/china/jining',
  'asia/china/zhangye',
  'asia/indonesia/jakarta',
  'asia/malaysia/kuala-lumpur',
  'north-america/canada/toronto',
])

const getCityImagePath = (link: string): string => {
  const slug = getSlugFromLink(link)
  return getCityOpenGraphImagePath(slug)
}

const applyPlaceholderFlags = (city: CityBase): CityBase => {
  const path = getPathFromLink(city.link)
  if (!path) {
    return city
  }
  if (PLACEHOLDER_CITY_PATHS.has(path) && !isExplicitlyEnabled(city)) {
    return { ...city, disabled: true }
  }
  return city
}

const withImages = (city: CityBase): ICity => ({
  ...city,
  image: getCityImagePath(city.link),
})

export const cities: ICity[] = rawCities
  .map(normalizeAvailability)
  .map(applyPlaceholderFlags)
  .map(withImages)

const getCityAvailabilitySlug = (city: Pick<ICity, 'link'>): string | null =>
  getSlugFromLink(city.link)

const isCityAvailable = (city: Pick<ICity, 'link'>): boolean => {
  const slug = getCityAvailabilitySlug(city)
  return slug ? AVAILABLE_CITY_SLUGS.has(slug) : false
}

export const isCityExplicitlyEnabled = (
  city: Pick<ICity, 'disabled' | 'hideInStats' | 'link'>,
): boolean =>
  city.disabled === false || city.hideInStats === false || isCityAvailable(city)

export const isCityDisabled = (
  city: Pick<ICity, 'disabled' | 'hideInStats' | 'link'>,
): boolean => city.disabled === true

export const getCityBaseName = (slug: string): string | null => {
  const city = cities.find((entry) => getSlugFromLink(entry.link) === slug)
  if (!city) {
    return null
  }
  return city.name.split(',')[0]
}
