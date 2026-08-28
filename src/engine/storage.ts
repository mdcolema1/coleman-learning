import type {
  AllowanceRules,
  AppState,
  AdventureProgress,
  KidName,
  KidProgress,
  LearningWindow,
  Subject,
} from '../types'

import { avatarOptions } from '../data/children'
import { defaultMissions, levelFromXP } from '../data/adventure'

const KEY = 'coleman_learning_react_v4'

const OLD = [
  'coleman_learning_react_v3',
  'coleman_learning_react_v2',
  'coleman_learning_react_v1',
]

export const WINDOW_MS = 12 * 60 * 60 * 1000

export const DEFAULT_RULES: AllowanceRules = {
  basePerFirstCorrect: 0.05,
  streakBonus: 0.05,
  streakEvery: 3,
  passThreshold: 0.8,
  incorrectDeduction: 0.05,
  challengeBonus: 0.1,
  progressiveStreak: true,
  maxStreakTier: 4,
}

const emptyWindow = (): LearningWindow => ({
  startedAt: 0,
  earnings: 0,
  subjects: {},
})

function adventure(
  k: KidName,
  xp = 0
): AdventureProgress {
  const level = levelFromXP(xp)

  return {
    xp,
    level,
    zoneId: 'sunlit-shores',
    treasureClaimed: [],
    energy: 0,
    pearls: 0,
    shells: 0,
    currentCheckpoint: 'Explorer Camp',
    storyChapter: 1,
    completedObjectives: [],
    shipwreckRooms: [],
    mapFragments: [],
    missions: defaultMissions(k),
    journal: [],
    knowledgeCards: [],
    cabin: {
      decorations: [],
      equippedDecorations: [],
      trophies: [],
    },
    aquarium: {
      creatures: [],
      food: 0,
    },
    world1Complete: false,
    familyAchievementPoints: 0,
    bossesDefeated: [],
    discoveredNpcs: [],
    weekendTreasureClaims: [],
  }
}

function newKid(
  k: KidName,
  a: string
): KidProgress {
  return {
    bank: 0,
    avatar: a,
    records: [],
    window: emptyWindow(),
    mastery: {},
    seen: [],
    achievements: [],
    goals: [],
    notes: [],
    purchases: [],
    adventure: adventure(k),
    dailyLearningStreak: 0,
    personalBests: {
      accuracy: 0,
      streak: 0,
      questions: 0,
      masteryGain: 0,
    },
    questionCount: 0,
  }
}

export function initialState(): AppState {
  return {
    version: 4,
    contrast: 'bright',
    allowanceRules: {
      ...DEFAULT_RULES,
    },
    parentSettings: {
      sessionTimeoutMinutes: 10,
      backupReminderDays: 7,
      assignedDifficulty: {},
    },
    adventureSettings: {
      music: 0.2,
      effects: 0.6,
      voice: 1,
      graphics: 'standard',
      reducedEffects: false,
    },
    appInstalledAt: Date.now(),
    familyAchievements: [],
    kids: {
      Humberto: newKid(
        'Humberto',
        avatarOptions[1]
      ),
      Harmoni: newKid(
        'Harmoni',
        avatarOptions[3]
      ),
      Faith: newKid(
        'Faith',
        avatarOptions[0]
      ),
      Angel: newKid(
        'Angel',
        avatarOptions[2]
      ),
    },
  }
}

function migrateAdventure(
  k: KidName,
  raw: any,
  count = 0
): AdventureProgress {
  if (raw?.adventure) {
    const a = {
      ...adventure(
        k,
        Number(raw.adventure.xp || 0)
      ),
      ...raw.adventure,
    }

    a.missions = Array.isArray(
      raw.adventure.missions
    )
      ? raw.adventure.missions
      : defaultMissions(k)

    a.journal = Array.isArray(
      raw.adventure.journal
    )
      ? raw.adventure.journal
      : []

    a.knowledgeCards = Array.isArray(
      raw.adventure.knowledgeCards
    )
      ? raw.adventure.knowledgeCards
      : []

    a.cabin = {
      decorations: [],
      equippedDecorations: [],
      trophies: [],
      ...raw.adventure.cabin,
    }

    a.aquarium = {
      creatures: [],
      food: 0,
      ...raw.adventure.aquarium,
    }

    a.bossesDefeated = Array.isArray(
      raw.adventure.bossesDefeated
    )
      ? raw.adventure.bossesDefeated
      : []

    a.discoveredNpcs = Array.isArray(
      raw.adventure.discoveredNpcs
    )
      ? raw.adventure.discoveredNpcs
      : []

    a.weekendTreasureClaims =
      Array.isArray(
        raw.adventure.weekendTreasureClaims
      )
        ? raw.adventure.weekendTreasureClaims
        : []

    return a
  }

  const old = raw?.ocean

  const xp = Number(
    old?.xp ?? count * 25
  )

  const a = adventure(k, xp)

  a.treasureClaimed =
    old?.treasureClaimed ?? []

  a.aquarium.creatures =
    old?.creatures ?? []

  return a
}

function migrateKid(
  k: KidName,
  raw: any,
  base: KidProgress
): KidProgress {
  const p = {
    ...base,
    ...raw,
  }

  p.mastery =
    raw?.mastery ?? {}

  p.seen = Array.isArray(raw?.seen)
    ? raw.seen
    : []

  p.achievements = Array.isArray(
    raw?.achievements
  )
    ? raw.achievements
    : []

  p.goals = Array.isArray(raw?.goals)
    ? raw.goals
    : []

  p.notes = Array.isArray(raw?.notes)
    ? raw.notes
    : []

  p.purchases = Array.isArray(
    raw?.purchases
  )
    ? raw.purchases
    : []

  p.records = Array.isArray(
    raw?.records
  )
    ? raw.records
    : []

  p.adventure = migrateAdventure(
    k,
    raw,
    p.records.length
  )

  p.dailyLearningStreak = Number(
    raw?.dailyLearningStreak || 0
  )

  p.personalBests = {
    accuracy: 0,
    streak: 0,
    questions: 0,
    masteryGain: 0,
    ...raw?.personalBests,
  }

  p.questionCount = Number(
    raw?.questionCount ??
      p.records.reduce(
        (a: number, r: any) =>
          a +
          Number(
            r.totalQuestions || 0
          ),
        0
      )
  )

  return p
}

export function loadState(): AppState {
  try {
    const fresh = initialState()

    let text =
      localStorage.getItem(KEY)

    if (!text) {
      for (const x of OLD) {
        text =
          localStorage.getItem(x)

        if (text) {
          break
        }
      }
    }

    if (text) {
      const parsed =
        JSON.parse(text)

      const next = {
        ...fresh,
        ...parsed,
        version: 4,

        allowanceRules: {
          ...DEFAULT_RULES,
          ...parsed.allowanceRules,
        },

        parentSettings: {
          ...fresh.parentSettings,
          ...parsed.parentSettings,
        },

        adventureSettings: {
          ...fresh.adventureSettings,
          ...parsed.adventureSettings,
        },

        kids: {
          ...fresh.kids,
        },

        familyAchievements:
          Array.isArray(
            parsed.familyAchievements
          )
            ? parsed.familyAchievements
            : [],

        lastMigrationAt:
          Date.now(),
      } as AppState

      ;(
        [
          'Humberto',
          'Harmoni',
          'Faith',
          'Angel',
        ] as KidName[]
      ).forEach((k) => {
        next.kids[k] =
          migrateKid(
            k,
            parsed.kids?.[k],
            fresh.kids[k]
          )
      })

      refreshMissions(next)

      return next
    }

    return fresh
  } catch {
    return initialState()
  }
}

export const saveState = (
  s: AppState
) => {
  refreshMissions(s)

  localStorage.setItem(
    KEY,
    JSON.stringify(s)
  )
}

export function resetExpiredWindow(
  state: AppState,
  kid: KidName
) {
  const n =
    structuredClone(state)

  const w = n.kids[kid].window

  if (
    w.startedAt &&
    Date.now() - w.startedAt >=
      WINDOW_MS
  ) {
    n.kids[kid].window =
      emptyWindow()
  }

  return n
}

export function ensureWindowStarted(
  state: AppState,
  kid: KidName
) {
  const n =
    resetExpiredWindow(
      state,
      kid
    )

  if (
    !n.kids[kid].window.startedAt
  ) {
    n.kids[
      kid
    ].window.startedAt =
      Date.now()
  }

  return n
}

export const subjectCompleted = (
  s: AppState,
  k: KidName,
  sub: Subject
) =>
  s.kids[k].window.subjects[sub]
    ?.completedQuizzes ?? []

export function remainingWindowMs(
  s: AppState,
  k: KidName
) {
  const st =
    s.kids[k].window.startedAt

  return st
    ? Math.max(
        0,
        WINDOW_MS -
          (Date.now() - st)
      )
    : WINDOW_MS
}

export const exportState = (
  s: AppState
) =>
  JSON.stringify(
    {
      ...s,
      exportedAt:
        new Date().toISOString(),
      format:
        'ColemanLearning-v9',
    },
    null,
    2
  )

export const exportKid = (
  s: AppState,
  k: KidName
) =>
  JSON.stringify(
    {
      format:
        'ColemanLearningKid-v9',
      kid: k,
      progress: s.kids[k],
      exportedAt:
        new Date().toISOString(),
    },
    null,
    2
  )

export function importState(
  text: string
): AppState {
  const p = JSON.parse(text)

  if (!p?.kids) {
    throw new Error(
      'This backup does not contain Coleman Learning family data.'
    )
  }

  localStorage.setItem(
    KEY,
    JSON.stringify({
      ...p,
      version: 4,
    })
  )

  return loadState()
}

export function importKid(
  s: AppState,
  text: string
) {
  const p = JSON.parse(text)

  if (
    !p?.kid ||
    !p?.progress
  ) {
    throw new Error(
      'This is not a Coleman Learning child backup.'
    )
  }

  const k =
    p.kid as KidName

  const n =
    structuredClone(s)

  n.kids[k] = migrateKid(
    k,
    p.progress,
    n.kids[k]
  )

  return n
}

export function dayKey(
  ts = Date.now()
) {
  const d = new Date(ts)

  return `${d.getFullYear()}-${String(
    d.getMonth() + 1
  ).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`
}

export function updateDailyStreak(
  p: KidProgress,
  when = Date.now()
) {
  const today = dayKey(when)

  if (
    p.lastLearningDay === today
  ) {
    return
  }

  const y = dayKey(
    when - 86400000
  )

  p.dailyLearningStreak =
    p.lastLearningDay === y
      ? p.dailyLearningStreak + 1
      : 1

  p.lastLearningDay =
    today
}

export function storageSizeKB() {
  try {
    return (
      Math.round(
        (localStorage.getItem(KEY)
          ?.length || 0) / 102.4
      ) / 10
    )
  } catch {
    return 0
  }
}

export function refreshMissions(
  state: AppState
) {
  const today = dayKey()

  const now = new Date()

  const weekStart =
    new Date(now)

  weekStart.setHours(
    0,
    0,
    0,
    0
  )

  weekStart.setDate(
    now.getDate() -
      ((now.getDay() + 6) % 7)
  )

  const week = dayKey(
    weekStart.getTime()
  )

  if (
    state.lastMissionRefresh ===
    today
  ) {
    return state
  }

  for (const k of Object.keys(
    state.kids
  ) as KidName[]) {
    const p = state.kids[k]

    const old =
      p.adventure.missions

    const story =
      old.filter(
        (m) =>
          m.kind === 'story' ||
          m.kind === 'npc'
      )

    const daily =
      defaultMissions(k)
        .filter(
          (m) =>
            m.kind === 'daily'
        )
        .map((m) => ({
          ...m,
          id: m.id.replace(
            /\d{4}-\d{2}-\d{2}$/,
            today
          ),
        }))

    const priorWeekly =
      old.find(
        (m) =>
          m.kind === 'weekly' &&
          m.id.includes(week)
      )

    const weekly =
      priorWeekly
        ? [priorWeekly]
        : defaultMissions(k)
            .filter(
              (m) =>
                m.kind ===
                'weekly'
            )
            .map((m) => ({
              ...m,
              id: `weekly-${week}`,
            }))

    p.adventure.missions = [
      ...daily,
      ...weekly,
      ...story.filter(
        (m, i, a) =>
          a.findIndex(
            (x) =>
              x.id === m.id
          ) === i
      ),
    ]
  }

  state.lastMissionRefresh =
    today

  return state
}

const SNAP =
  'coleman_learning_snapshots_v9'

export interface SaveSnapshot {
  id: string
  createdAt: number
  label: string
  state: AppState
}

export function createSnapshot(
  state: AppState,
  label = 'Manual Save'
) {
  const items =
    getSnapshots()

  items.unshift({
    id: `snap-${Date.now()}`,
    createdAt: Date.now(),
    label,
    state:
      structuredClone(state),
  })

  localStorage.setItem(
    SNAP,
    JSON.stringify(
      items.slice(0, 5)
    )
  )

  return items.slice(0, 5)
}

export function getSnapshots(): SaveSnapshot[] {
  try {
    return JSON.parse(
      localStorage.getItem(
        SNAP
      ) || '[]'
    )
  } catch {
    return []
  }
}

export function restoreSnapshot(
  id: string
) {
  const item =
    getSnapshots().find(
      (x) => x.id === id
    )

  if (!item) {
    throw new Error(
      'Save snapshot not found.'
    )
  }

  localStorage.setItem(
    KEY,
    JSON.stringify({
      ...item.state,
      version: 4,
    })
  )

  return loadState()
}
