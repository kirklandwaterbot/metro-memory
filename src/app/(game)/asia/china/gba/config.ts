
import { Config, Line, LineGroup } from '@/lib/types'
import type { MapboxOptions } from 'mapbox-gl'
import { Metadata } from 'next'
import linesData from './data/lines.json'

// Import existing line groups to combine them
// We can't easily import them if they are not exported as data, but let's see. 
// Ideally we would reconstruct the groups.
// For now, let's create a single large group or try to re-use the structure.
// Since we don't have a "merged" structure for groups in our script, we'll manually define them here for the key cities.

export const LINES = linesData as { [name: string]: Line }

export const METADATA: Metadata = {
  icons: {
    icon: '/api/city-icon/gba',
    apple: '/api/city-icon/gba',
  },
  title: 'Greater Bay Area Metro Memory',
  description: 'How many stations in the Greater Bay Area can you name?',
  openGraph: {
    title: 'Greater Bay Area Metro Memory',
    description: 'How many stations in the Greater Bay Area can you name?',
    type: 'website',
    locale: 'en_US',
    url: 'https://metro-memory.xyz/asia/china/gba',
  },
}

export const MAP_CONFIG: MapboxOptions = {
  container: 'map',
  // Using the HK style as a base or a generic one
  style: 'mapbox://styles/mapbox/light-v11',
  bounds: [
    [113.0, 22.0], // Southwest
    [114.6, 23.2], // Northeast
  ],
  maxBounds: [
    [112.5, 21.5],
    [115.0, 24.0],
  ],
  minZoom: 8,
  fadeDuration: 50,
}

export const CITY_NAME = 'gba'
export const LOCALE = 'en'
export const MAP_FROM_DATA = true
export const MAP_RENDER_CULLING = {
  enabled: true,
  paddingFactor: 0.5,
}

export const LINE_GROUPS: LineGroup[] = [
    {
        title: 'Guangzhou Metro',
        titleImage: 'GZMetro.png',
        items: [
            {
                type: 'lines',
                lines: [
                    'gzline1',
                    'gzline2',
                    'gzline3',
                    'gzline4',
                    'gzline5',
                    'gzline6',
                    'gzline7',
                    'gzline8',
                    'gzline9',
                    'gzline10',
                    'gzline11',
                    'gzline12',
                    'gzline13',
                    'gzline14',
                    'gzline18',
                    'gzline21',
                    'gzline22',
                    'gzline24',
                    'gzline28',
                    'gzapm'
                ]
            }
        ]
    },
    {
        items: [{ type: 'separator' }]
    },
    {
        title: 'Guangzhou Tram',
        titleImage: 'GZMetro.png',
        items: [
            {
                type: 'lines',
                lines: ['gzt_thp1', 'gzt_thp2', 'gzt_thz1']
            }
        ]
    },
    {
        items: [{ type: 'separator' }]
    },
    {
        title: 'Foshan Metro',
        titleImage: 'FSMetro.png',
        items: [
            {
                type: 'lines',
                lines: ['fs_guangfo', 'fs_line2', 'fs_line3', 'fs_line4', 'fs_line11', 'fs_tnh1', 'fs_tnh2']
            }
        ]
    },
    {
        items: [{ type: 'separator' }]
    },
    {
        title: 'Shenzhen Metro',
        titleImage: 'SZMetro.png',
        items: [
            {
                type: 'lines',
                lines: [
                    'szline1', 'szline2', 'szline3', 'szline4', 'szline5', 'szline6', 'szline6b', 'szline7', 'szline8',
                    'szline9', 'szline10', 'szline11', 'szline12', 'szline13', 'szline14', 'szline15', 'szline16',
                    'szline17', 'szline19', 'szline20', 'szline22', 'szline25', 'szline27', 'szline29', 'szline32'
                ]
            }
        ]
    },
    {
        items: [{ type: 'separator' }]
    },
    {
        title: 'Shenzhen Trams',
        titleImage: 'SZTrams.png',
        items: [
            {
                type: 'lines',
                lines: ['sztram1', 'sztram2']
            }
        ]
    },
    {
        items: [{ type: 'separator' }]
    },
    {
        title: 'BYD',
        titleImage: 'BYD.png',
        items: [
            {
                type: 'lines',
                lines: ['szbyd1']
            }
        ]
    },
    {
        items: [{ type: 'separator' }]
    },
    {
        title: 'Shenzhen Airport Co., Ltd.',
        titleImage: 'ShenzhenAirport.png',
        items: [
            {
                type: 'lines',
                lines: ['szairportapm']
            }
        ]
    },
    {
        items: [{ type: 'separator' }]
    },
    {
        title: 'Dongguan Rail Transit',
        titleImage: 'DGRT.png',
        items: [
            {
                type: 'lines',
                lines: ['dongguanline1', 'dongguanline2']
            }
        ]
    },
    {
        items: [{ type: 'separator' }]
    },
    {
        title: 'Mass Transit Railway (MTR)',
        titleImage: 'HKMTR.png',
        items: [
            {
                type: 'lines',
                title: 'Heavy Rail',
                titleImage: 'MTRHeavyRail.png',
                lines: ['EAL', 'TML', 'NOL', 'AEL', 'TCL', 'TWL', 'ISL', 'KTL', 'TKL', 'SIL', 'SILW', 'DRL', 'XRL', 'HKWRL']
            },
            {
                type: 'lines',
                title: 'Light Rail',
                titleImage: 'HKLR.png',
                lines: ['MTR505', 'MTR507', 'MTR610', 'MTR614', 'MTR614P', 'MTR615', 'MTR615P', 'MTR705', 'MTR706', 'MTR751', 'MTR751P', 'MTR761P']
            },
            {
                type: 'lines',
                title: 'Ngong Ping 360',
                titleImage: 'NgongPing360.png',
                lines: ['HKNP360']
            },
            {
                type: 'lines',
                title: 'Hong Kong International Airport Automated People Mover (APM)',
                titleImage: 'HKA.png',
                lines: ['HKAPMT1', 'HKAPMT2', 'HKAPMSKY']
            }
        ]
    },
    {
        items: [{ type: 'separator' }]
    },
    {
        title: 'Smart and Green Mass Transit (planned)',
        items: [
            {
                type: 'lines',
                lines: ['EKSG', 'KTSG']
            }
        ]
    },
    {
        items: [{ type: 'separator' }]
    },
    {
        title: 'RATP Dev Transdev Asia',
        titleImage: 'RATP.png',
        items: [
            {
                type: 'lines',
                lines: ['HKT']
            }
        ]
    },
    {
        items: [{ type: 'separator' }]
    },
    {
        title: 'Hongkong and Shanghai Hotels (HSH)',
        titleImage: 'HKSH.png',
        items: [
            {
                type: 'lines',
                lines: ['HKTPT']
            }
        ]
    },
    {
        items: [{ type: 'separator' }]
    },
    {
        title: 'Ocean Park Corporation (OPC)',
        titleImage: 'OceanPark.png',
        items: [
            {
                type: 'lines',
                lines: ['HKOEX', 'HKOCC']
            }
        ]
    },
    {
        items: [{ type: 'separator' }]
    },
    {
        title: 'Macao Light Rapid Transit (Macao LRT)',
        titleImage: 'MOLRT.png',
        items: [
            {
                type: 'lines',
                lines: ['TPA', 'HNQ', 'SPV', 'moeast']
            }
        ]
    },
    {
        items: [{ type: 'separator' }]
    },
    {
        title: 'Wynn Resorts Limited',
        titleImage: 'Wynn.png',
        items: [
            {
                type: 'lines',
                lines: ['wynnskycab']
            }
        ]
    },
    {
        items: [{ type: 'separator' }]
    },
    {
        title: 'Municipal Affairs Bureau',
        titleImage: 'MAB.png',
        items: [
            {
                type: 'lines',
                lines: ['mab_guia']
            }
        ]
    },
    {
        items: [{ type: 'separator' }]
    },

    {
        title: 'Intercity Rail',
        titleImage: 'IntercityRail.png',
        items: [
            {
                type: 'lines',
                lines: [
                    'prdir_guangzhu',
                    'prdir_suishen',
                    'prdir_zhuji',
                    'prdir_guanghui',
                    'prdir_guangzhao',
                    'prdir_guangqing',
                    'prdir_guangforing',
                    'prdir_guangshen',
                    'prdir_shenshan'
                ]
            }
        ]
    },
    {
        items: [{ type: 'separator' }]
    },
    {
        title: 'Qingyuan Maglev Transportation Co., Ltd',
        items: [
            {
                type: 'lines',
                lines: ['qymaglev']
            }
        ]
    },
    {
        items: [{ type: 'separator' }]
    },
    {
        title: 'Guangzhou Chimelong Safari Park',
        titleImage: 'Chimelong.png',
        items: [
            {
                type: 'lines',
                lines: ['gzsp_cable']
            }
        ]
    },
    {
        items: [{ type: 'separator' }]
    },
    {
        title: 'Baiyun Mountain Cableway',
        items: [
            {
                type: 'lines',
                lines: ['gzcw_cable']
            }
        ]
    }
]

// Filter out lines that don't exist in the data to avoid crashes
const VALID_LINE_GROUPS = LINE_GROUPS.map(group => ({
    ...group,
    items: group.items.map(item => {
        if (item.type === 'lines' && item.lines) {
            return {
                ...item,
                lines: item.lines.filter(l => LINES[l])
            }
        }
        return item
    }).filter(item => item.type !== 'lines' || (item.lines && item.lines.length > 0))
})).filter(group => group.items.length > 0)


const config: Config = {
  LOCALE,
  CITY_NAME,
  MAP_CONFIG,
  METADATA,
  LINES,
  MAP_FROM_DATA,
  MAP_RENDER_CULLING,
  LINE_GROUPS: VALID_LINE_GROUPS,
}

export default config
