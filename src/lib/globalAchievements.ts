export type GlobalAchievementDefinition = {
  slug: string
  title: string
  description: string
  secretDescription?: string
  order: number
  country?: 'global' | 'secret-fun'
}

export const GLOBAL_ACHIEVEMENTS: GlobalAchievementDefinition[] = [
  {
    slug: 'almost-flawless',
    title: 'Almost Flawless',
    description: 'Complete any city with two or fewer mistakes.',
    order: 10_003,
  },
  {
    slug: 'comeback-kid',
    title: 'Comeback Kid',
    description: 'Recover from under 50% to finish a city.',
    order: 10_004,
  },
  {
    slug: 'explorer-10',
    title: 'Explorer',
    description: 'Complete 10 different cities.',
    order: 10_011,
  },
  {
    slug: 'explorer-50',
    title: 'Ultimate Explorer',
    description: 'Complete 50 different cities.',
    order: 10_013,
  },
  {
    slug: 'twin-city',
    title: 'Twin City',
    description: 'Complete two cities from different continents on the same day.',
    order: 10_040,
  },
  {
    slug: 'big-city-tamer',
    title: 'Big City Tamer',
    description: 'Complete a city with 1,500+ stations.',
    order: 10_043,
  },
  {
    slug: 'marathoner',
    title: 'Marathoner',
    description: 'Find 100,000 stations across all cities.',
    order: 10_046,
  },
  {
    slug: 'typo-free',
    title: 'Typo Free',
    description: 'Complete a city without using backspace or delete.',
    order: 10_048,
  },
  {
    slug: 'perfect-start',
    title: 'Perfect Start',
    description: 'Make 25 correct guesses in a row to start a city.',
    order: 10_049,
  },
  {
    slug: 'never-repeat',
    title: 'Never Repeat',
    description: 'Complete a city without guessing an already-found station.',
    order: 10_050,
  },
  {
    slug: 'underdog',
    title: 'Underdog',
    description: 'Complete a city with fewer than 20 stations.',
    order: 10_054,
  },
  {
    slug: 'golden-ratio',
    title: 'Golden Ratio',
    description: '???',
    secretDescription: 'Reach 61.8% completion in any city.',
    order: 10_101,
    country: 'secret-fun',
  },
  {
    slug: 'the-archivist',
    title: 'The Archivist',
    description: '???',
    secretDescription: 'Open city stats for 10 different cities.',
    order: 10_103,
    country: 'secret-fun',
  },
  {
    slug: 'explorer-100',
    title: 'Centurion Explorer',
    description: 'Complete 100 different cities.',
    order: 10_015,
  },
  {
    slug: 'spotless-record',
    title: 'Spotless Record',
    description: 'Complete 5 different cities with zero mistakes.',
    order: 10_058,
  },
  {
    slug: 'hot-streak',
    title: 'Hot Streak',
    description: 'Make 50 correct guesses in a row.',
    order: 10_059,
  },
  {
    slug: 'night-owl',
    title: 'Night Owl',
    description: '???',
    secretDescription: 'Find a station between midnight and 4 a.m.',
    order: 10_104,
    country: 'secret-fun',
  },
  {
    slug: 'early-bird',
    title: 'Early Bird',
    description: '???',
    secretDescription: 'Find a station between 5 and 7 a.m.',
    order: 10_105,
    country: 'secret-fun',
  },
  {
    slug: 'slice-of-pi',
    title: 'Slice of Pi',
    description: '???',
    secretDescription: 'Reach 31.4% completion in any city.',
    order: 10_106,
    country: 'secret-fun',
  },
  {
    slug: 'halfway-there',
    title: 'Halfway There',
    description: '???',
    secretDescription: 'Reach exactly 50% completion in any city.',
    order: 10_107,
    country: 'secret-fun',
  },
  {
    slug: 'butterfingers',
    title: 'Butterfingers',
    description: '???',
    secretDescription: 'Make 10 wrong guesses in a row.',
    order: 10_108,
    country: 'secret-fun',
  },
  {
    slug: 'deja-vu',
    title: 'Déjà Vu',
    description: '???',
    secretDescription: 'Guess an already-found station 5 times in a row.',
    order: 10_109,
    country: 'secret-fun',
  },
  {
    slug: 'mystery-ticket',
    title: 'Mystery Ticket',
    description: '???',
    secretDescription: 'Use “Play Random City” 5 times.',
    order: 10_110,
    country: 'secret-fun',
  },
  {
    slug: 'unlucky-line',
    title: 'Unlucky Line',
    description: '???',
    secretDescription: 'Find a station on a Friday the 13th.',
    order: 10_112,
    country: 'secret-fun',
  },
  {
    slug: 'first-train-of-the-year',
    title: 'First Train of the Year',
    description: '???',
    secretDescription: "Find a station on New Year's Day.",
    order: 10_113,
    country: 'secret-fun',
  },
]

export const GLOBAL_ACHIEVEMENT_SLUGS = GLOBAL_ACHIEVEMENTS.map((entry) => entry.slug)
