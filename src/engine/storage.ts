import type { AppState, ChildKey, ChildProgress } from '../types'
import { children } from '../data/children'
import { adventure } from './adventure'

const STORAGE_KEY = 'coleman_learning_react_v3'
const LEGACY_KEYS = ['coleman_learning_react_v2', 'coleman_learning_react_v1']

function migrateProgress(k: ChildKey, raw: any): ChildProgress {
  const count = Number(raw?.questionsCompleted ?? raw?.totalAnswered ?? 0)
  const old = raw?.ocean
  const xp = Number(old?.xp ?? count * 25)
  const a = adventure(k, xp)

  return {
    childKey: k,
    questionsCompleted: count,
    totalCorrect: Number(raw?.totalCorrect ?? 0),
    firstAttemptCorrect: Number(raw?.firstAttemptCorrect ?? 0),
    firstAttemptTotal: Number(raw?.firstAttemptTotal ?? 0),
    currentStreak: Number(raw?.currentStreak ?? 0),
    bestStreak: Number(raw?.bestStreak ?? 0),
    dailyStreak: Number(raw?.dailyStreak ?? 0),
    lastLearningDate: raw?.lastLearningDate ?? null,
    mastery: raw?.mastery ?? {},
    subjectProgress: raw?.subjectProgress ?? {},
    quizHistory: raw?.quizHistory ?? [],
    recentQuestionIds: raw?.recentQuestionIds ?? [],
    completedQuizzes: raw?.completedQuizzes ?? {},
    failedAllowanceQuizzes: raw?.failedAllowanceQuizzes ?? {},
    allowanceWindowStartedAt: raw?.allowanceWindowStartedAt ?? null,
    allowanceEarned: Number(raw?.allowanceEarned ?? 0),
    suggestedDeduction: Number(raw?.suggestedDeduction ?? 0),
    adventure: {
      ...a,
      ...(raw?.adventure ?? {}),
      xp: Number(raw?.adventure?.xp ?? xp),
      level: Number(raw?.adventure?.level ?? a.level),
      energy: Number(raw?.adventure?.energy ?? a.energy),
      pearls: Number(raw?.adventure?.pearls ?? a.pearls),
      shells: Number(raw?.adventure?.shells ?? a.shells),
      currentRegionId:
        raw?.adventure?.currentRegionId ??
        a.currentRegionId,
      completedRegions:
        raw?.adventure?.completedRegions ?? [],
      completedCheckpoints:
        raw?.adventure?.completedCheckpoints ?? [],
      discoveredTreasures:
        raw?.adventure?.discoveredTreasures ?? [],
      discoveredNpcs:
        raw?.adventure?.discoveredNpcs ?? [],
      completedBosses:
        raw?.adventure?.completedBosses ?? [],
      mapFragments:
        raw?.adventure?.mapFragments ?? [],
      inventory:
        raw?.adventure?.inventory ?? [],
      equipped:
        raw?.adventure?.equipped ?? {},
      aquarium:
        raw?.adventure?.aquarium ?? [],
      cabin:
        raw?.adventure?.cabin ?? [],
      achievements:
        raw?.adventure?.achievements ?? [],
      journal:
        raw?.adventure?.journal ?? [],
      dailyMissions:
        raw?.adventure?.dailyMissions ?? [],
      weeklyMissions:
        raw?.adventure?.weeklyMissions ?? [],
    },
  }
}

function createInitialState(): AppState {
  const progress = {} as Record<ChildKey, ChildProgress>

  for (const child of children) {
    progress[child.key] = migrateProgress(child.key, {})
  }

  return {
    version: 3,
    selectedChild: null,
    progress,
    parent: {
      allowancePerFirstAttemptCorrect: 0.05,
      streakBonus: 0.05,
      streakEvery: 3,
      maxStreakBonusTier: 5,
      deductionPerIncorrectFirstAttempt: 0.05,
      notes: {},
      goals: {},
      difficultyOverrides: {},
      adminLastActiveAt: null,
    },
    familyAchievements: [],
  }
}

function normalizeState(raw: any): AppState {
  const initial = createInitialState()

  const progress = {} as Record<ChildKey, ChildProgress>

  for (const child of children) {
    progress[child.key] = migrateProgress(
      child.key,
      raw?.progress?.[child.key] ?? {}
    )
  }

  return {
    ...initial,
    ...raw,
    version: 3,
    selectedChild: raw?.selectedChild ?? null,
    progress,
    parent: {
      ...initial.parent,
      ...(raw?.parent ?? {}),
      notes: raw?.parent?.notes ?? {},
      goals: raw?.parent?.goals ?? {},
      difficultyOverrides:
        raw?.parent?.difficultyOverrides ?? {},
    },
    familyAchievements:
      raw?.familyAchievements ?? [],
  }
}

export function loadState(): AppState {
  try {
    const current = localStorage.getItem(STORAGE_KEY)

    if (current) {
      return normalizeState(JSON.parse(current))
    }

    for (const key of LEGACY_KEYS) {
      const legacy = localStorage.getItem(key)

      if (legacy) {
        const migrated = normalizeState(JSON.parse(legacy))
        saveState(migrated)
        return migrated
      }
    }
  } catch (error) {
    console.error('Failed to load Coleman Learning state:', error)
  }

  return createInitialState()
}

export function saveState(state: AppState): void {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ...state,
        version: 3,
      })
    )
  } catch (error) {
    console.error('Failed to save Coleman Learning state:', error)
  }
}

export function resetState(): AppState {
  const state = createInitialState()
  saveState(state)
  return state
}

export function exportState(state: AppState): string {
  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      app: 'Coleman Family Learning Adventure',
      version: 3,
      state,
    },
    null,
    2
  )
}

export function importState(json: string): AppState {
  const parsed = JSON.parse(json)
  const raw = parsed?.state ?? parsed

  const state = normalizeState(raw)
  saveState(state)

  return state
}

export function clearStoredState(): void {
  localStorage.removeItem(STORAGE_KEY)
}
