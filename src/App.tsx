import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import HomeScreen from './components/HomeScreen'
import SubjectScreen from './components/SubjectScreen'
import QuizSelect from './components/QuizSelect'
import QuizScreen from './components/QuizScreen'
import type {
  AllowanceRules,
  AppState,
  AttemptResult,
  KidName,
  ParentGoal,
  Subject,
} from './types'
import {
  ensureWindowStarted,
  importState,
  loadState,
  resetExpiredWindow,
  saveState,
  subjectCompleted,
  updateDailyStreak,
} from './engine/storage'
import { generateQuiz, quizCountFor } from './engine/quizEngine'
import { scoreResults } from './engine/scoring'
import { updateSkill, masteryAverage } from './engine/mastery'
import { evaluateAchievements } from './engine/achievements'
import {
  completeObjective,
  applyLearningAdventure,
  claimMission,
  spendEnergy,
  defeatBoss,
  advanceZoneIfReady,
} from './engine/adventure'
import { evaluateFamilyAchievements } from './engine/familyAchievements'
import { levelFromXP, zoneById } from './data/adventure'
import { playSfx } from './engine/audio'

const ParentPortal = lazy(() => import('./components/ParentPortal'))
const Storefront = lazy(() => import('./components/Storefront'))
const AdventureHub = lazy(() => import('./components/AdventureHub'))
const AdventureGame = lazy(() => import('./components/AdventureGame'))
const WorldMap = lazy(() => import('./components/WorldMap'))
const KnowledgeBank = lazy(() => import('./components/KnowledgeBank'))
const Aquarium = lazy(() => import('./components/Aquarium'))
const ExplorerCabin = lazy(() => import('./components/ExplorerCabin'))
const AdventureJournal = lazy(() => import('./components/AdventureJournal'))
const AdventureSettingsPanel = lazy(
  () => import('./components/AdventureSettingsPanel')
)
const SkillTree = lazy(() => import('./components/SkillTree'))

export const BUILD = '9.0.0'

type Screen =
  | 'home'
  | 'subjects'
  | 'quizzes'
  | 'quiz'
  | 'parent'
  | 'result'
  | 'store'
  | 'adventureHub'
  | 'adventureGame'
  | 'worldMap'
  | 'knowledge'
  | 'aquarium'
  | 'cabin'
  | 'journal'
  | 'adventureSettings'
  | 'skillTree'

export default function App() {
  const [state, setState] = useState<AppState>(() => loadState())

  const [pendingBoss, setPendingBoss] = useState<string | null>(null)

  const [screen, setScreen] = useState<Screen>('home')

  const [kid, setKid] = useState<KidName | null>(null)

  const [subject, setSubject] = useState<Subject | null>(null)

  const [quiz, setQuiz] = useState(1)

  const [result, setResult] = useState<{
    accuracy: number
    earned: number
    passed: boolean
    incorrect: number
    xp: number
    masteryDelta: number
    goalBonus: number
    zone: string
    energy: number
    pearls: number
    bossConquered?: string
  } | null>(null)

  useEffect(() => {
    saveState(state)
  }, [state])

  const mutate = (fn: (s: AppState) => AppState) => {
    setState((currentState) => {
      const nextState = fn(structuredClone(currentState))

      evaluateFamilyAchievements(nextState)

      return nextState
    })
  }

  const questions = useMemo(() => {
    if (!kid || !subject || screen !== 'quiz') {
      return []
    }

    return generateQuiz(kid, subject, quiz, {
      mastery: state.kids[kid].mastery,
      seen: state.kids[kid].seen,
      difficultyOverride:
        state.parentSettings.assignedDifficulty[kid]?.[subject],
    })
  }, [kid, subject, quiz, screen, state])

  const selectKid = (k: KidName) => {
    let next = resetExpiredWindow(state, k)
    next = ensureWindowStarted(next, k)

    setState(next)
    setKid(k)
    setScreen('subjects')
  }

  const selectSubject = (s: Subject) => {
    setSubject(s)
    setScreen('quizzes')
  }

  const startQuiz = (q: number) => {
    if (!kid || !subject) {
      return
    }

    const done = subjectCompleted(state, kid, subject)
    const count = quizCountFor(subject)
    const cycleDone = done.length >= count

    if (done.includes(q) && !cycleDone) {
      return
    }

    setQuiz(q)
    setResult(null)
    setScreen('quiz')
  }

  const finish = (
    results: AttemptResult[],
    bonus: number,
    total: number
  ) => {
    if (!kid || !subject) {
      return
    }

    const rules = state.allowanceRules
    const scored = scoreResults(results, bonus, rules)
    const now = Date.now()

    let next = ensureWindowStarted(structuredClone(state), kid)
    const p = next.kids[kid]

    const completed =
      p.window.subjects[subject]?.completedQuizzes ?? []

    const count = quizCountFor(subject)
    const cycleDone = completed.length >= count

    const firstCompletion =
      !completed.includes(quiz) && !cycleDone

    const beforeMastery = masteryAverage(p.mastery)

    const masteredBefore = new Set(
      Object.values(p.mastery)
        .filter((m) => m.status === 'Mastered')
        .map((m) => m.skill)
    )

    for (const r of results) {
      if (r.challenge && !r.firstAttemptCorrect) {
        continue
      }

      p.mastery[r.skill] = updateSkill(
        p.mastery[r.skill],
        r
      )
    }

    const afterMastery = masteryAverage(p.mastery)
    const masteryDelta = afterMastery - beforeMastery

    for (const m of Object.values(p.mastery)) {
      if (
        m.status === 'Mastered' &&
        !masteredBefore.has(m.skill) &&
        !p.adventure.knowledgeCards.some(
          (c) => c.skill === m.skill
        )
      ) {
        p.adventure.knowledgeCards.push({
          id: `knowledge-${Date.now()}-${m.skill}`,
          skill: m.skill,
          title: m.skill,
          summary:
            'Mastered through repeated retrieval and review.',
          icon: '🧠',
          masteredAt: Date.now(),
          reviewDueAt: m.nextReviewAt,
        })

        p.adventure.journal.unshift({
          id: `skill-${Date.now()}-${m.skill}`,
          createdAt: Date.now(),
          title: 'Skill Mastered',
          text: `${kid} mastered ${m.skill}.`,
          icon: '🌟',
          kind: 'skill',
        })
      }
    }

    const firstCorrect = results.filter(
      (r) => r.firstAttemptCorrect && !r.challenge
    ).length

    const challengeCount = results.filter(
      (r) => r.challenge && r.firstAttemptCorrect
    ).length

    const xp = Math.max(
      12,
      Math.round(
        18 +
          firstCorrect * 2 +
          (scored.passed ? 24 : 0) +
          challengeCount * 8
      )
    )

    p.adventure.xp += xp
    p.adventure.level = levelFromXP(p.adventure.xp)

    applyLearningAdventure(
      p,
      subject,
      firstCorrect,
      scored.passed
    )

    updateDailyStreak(p, now)

    p.questionCount += total

    p.personalBests.accuracy = Math.max(
      p.personalBests.accuracy,
      scored.accuracy
    )

    p.personalBests.questions = Math.max(
      p.personalBests.questions,
      total
    )

    p.personalBests.masteryGain = Math.max(
      p.personalBests.masteryGain,
      masteryDelta
    )

    p.seen = [
      ...p.seen,
      ...results.map((r) => ({
        id: r.questionId.startsWith('REM-')
          ? r.questionId.replace(/^REM-\d+-/, '')
          : r.questionId,
        seenAt: now,
      })),
    ]
      .filter((x) => now - x.seenAt < 45 * 86400000)
      .slice(-1600)

    let earned = 0

    if (firstCompletion) {
      p.window.subjects[subject] = {
        completedQuizzes: [...completed, quiz].sort(
          (a, b) => a - b
        ),
      }

      if (scored.passed) {
        earned = scored.earned

        p.bank = Number(
          (p.bank + earned).toFixed(2)
        )

        p.window.earnings = Number(
          (p.window.earnings + earned).toFixed(2)
        )
      }
    }

    let goalBonus = 0

    for (const g of p.goals) {
      if (!g.active) {
        continue
      }

      if (g.subject && g.subject !== subject) {
        continue
      }

      g.progress = Math.min(
        g.target,
        g.progress + 1
      )

      if (g.progress >= g.target) {
        g.active = false
        goalBonus += g.reward

        p.bank = Number(
          (p.bank + g.reward).toFixed(2)
        )

        p.window.earnings = Number(
          (p.window.earnings + g.reward).toFixed(2)
        )
      }
    }

    const recovered = results.filter(
      (r) =>
        !r.firstAttemptCorrect &&
        r.eventuallyCorrect
    ).length

    const wrongFirst = results.filter(
      (r) =>
        !r.firstAttemptCorrect &&
        !r.challenge
    ).length

    const timedResults = results.filter(
      (r) => r.responseMs
    )

    const avgMs = Math.round(
      results.reduce(
        (a, r) => a + (r.responseMs || 0),
        0
      ) / Math.max(1, timedResults.length)
    )

    p.records.push({
      id: `${kid}-${subject}-${quiz}-${now}`,
      child: kid,
      subject,
      quiz,
      completedAt: now,
      firstAttemptAccuracy: scored.accuracy,
      incorrectFirstAttempts: scored.incorrect,
      earned,
      passedAllowanceRule:
        scored.passed && firstCompletion,
      totalQuestions: total,
      xp,
      masteryDelta,
      secondAttemptRecovery: wrongFirst
        ? recovered / wrongFirst
        : 0,
      averageResponseMs: avgMs,
      challengeCorrect: challengeCount,
    })

    evaluateAchievements(p)

    let bossConquered: string | undefined

    if (pendingBoss && scored.passed) {
      if (defeatBoss(p, pendingBoss, kid)) {
        bossConquered =
          zoneById(pendingBoss).boss?.name
      }
    }

    setPendingBoss(null)

    evaluateAchievements(p)
    evaluateFamilyAchievements(next)

    setState(next)

    setResult({
      accuracy: scored.accuracy,
      earned,
      passed: scored.passed,
      incorrect: scored.incorrect,
      xp,
      masteryDelta,
      goalBonus,
      zone: zoneById(
        p.adventure.zoneId
      ).name,
      energy: p.adventure.energy,
      pearls: p.adventure.pearls,
      bossConquered,
    })

    setScreen('result')
  }

  const buy = (
    itemId: string,
    price: number,
    value: string,
    category: string
  ) => {
    if (!kid) {
      return
    }

    mutate((s) => {
      const p = s.kids[kid]

      const owned = p.purchases.some(
        (x) => x.id === itemId
      )

      if (!owned) {
        if (p.bank < price) {
          return s
        }

        p.bank = Number(
          (p.bank - price).toFixed(2)
        )

        p.purchases.push({
          id: itemId,
          purchasedAt: Date.now(),
        })

        playSfx(
          'purchase',
          s.adventureSettings.effects * 0.25
        )
      }

      if (category === 'Avatar') {
        p.avatar = value
      }

      if (category === 'Accessory') {
        p.equippedAccessory = value
      }

      if (category === 'Theme') {
        p.equippedTheme = value
      }

      if (
        category === 'Aquarium' &&
        !p.adventure.aquarium.creatures.includes(value)
      ) {
        p.adventure.aquarium.creatures.push(value)
      }

      if (
        category === 'Cabin' &&
        !p.adventure.cabin.decorations.includes(value)
      ) {
        p.adventure.cabin.decorations.push(value)
      }

      if (category === 'Companion') {
        p.equippedCompanion = value
      }

      if (category === 'Vehicle') {
        p.equippedVehicle = value
      }

      if (category === 'Effect') {
        p.equippedTrail = value
      }

      if (category === 'Frame') {
        p.equippedFrame = value
      }

      return s
    })
  }

  const adventureObjective = (
    id: string,
    title: string
  ) => {
    if (!kid) {
      return
    }

    mutate((s) => {
      const p = s.kids[kid]

      if (
        p.adventure.completedObjectives.includes(id)
      ) {
        return s
      }

      if (!spendEnergy(p, 1)) {
        return s
      }

      completeObjective(
        p,
        id,
        title,
        kid,
        28,
        4
      )

      p.adventure.currentCheckpoint = title

      return s
    })
  }

  const searchTreasure = () => {
    if (!kid) {
      return
    }

    mutate((s) => {
      const p = s.kids[kid]
      const zone = zoneById(p.adventure.zoneId)

      const t = zone.treasures.find(
        (x) =>
          p.adventure.level >= x.requiresLevel &&
          !p.adventure.treasureClaimed.includes(x.id)
      )

      if (!t || !spendEnergy(p, 1)) {
        return s
      }

      p.adventure.treasureClaimed.push(t.id)

      p.adventure.xp += t.rewardXP
      p.adventure.pearls += t.rewardPearls
      p.adventure.level = levelFromXP(
        p.adventure.xp
      )

      advanceZoneIfReady(p)

      if (t.rewardAccessory) {
        p.equippedAccessory =
          t.rewardAccessory
      }

      for (
        let i = 0;
        i < (t.mapFragments || 0);
        i++
      ) {
        const f = `${t.id}-fragment-${i + 1}`

        if (
          !p.adventure.mapFragments.includes(f)
        ) {
          p.adventure.mapFragments.push(f)
        }
      }

      p.adventure.journal.unshift({
        id: `treasure-${Date.now()}`,
        createdAt: Date.now(),
        title: t.name,
        text:
          `Treasure found in ${zone.name}: ` +
          `+${t.rewardXP} XP and ` +
          `+${t.rewardPearls} pearls.`,
        icon: t.icon,
        kind: 'treasure',
      })

      playSfx(
        'treasure',
        s.adventureSettings.effects * 0.35
      )

      return s
    })
  }

  const claimMissionReward = (
    id: string
  ) => {
    if (!kid) {
      return
    }

    mutate((s) => {
      claimMission(s.kids[kid], id)
      return s
    })
  }

  const addGoal = (
    k: KidName,
    g: ParentGoal
  ) => {
    mutate((s) => {
      s.kids[k].goals.push(g)
      return s
    })
  }

  const addNote = (
    k: KidName,
    text: string
  ) => {
    mutate((s) => {
      s.kids[k].notes.push({
        id: `note-${Date.now()}`,
        text,
        createdAt: Date.now(),
      })

      return s
    })
  }

  return (
    <Suspense
      fallback={
        <main className="page-shell">
          <section className="loading-card">
            🌊 Loading this area…
          </section>
        </main>
      }
    >
      <div
        className={`app ${state.contrast} ${
          state.adventureSettings.graphics === 'low'
            ? 'performance-low'
            : ''
        } ${
          state.adventureSettings.reducedEffects
            ? 'reduced-effects'
            : ''
        }`}
      >
        {screen === 'home' && (
          <HomeScreen
            state={state}
            onSelect={selectKid}
            onAvatar={(k, a) =>
              mutate((s) => {
                s.kids[k].avatar = a
                return s
              })
            }
            onParent={() =>
              setScreen('parent')
            }
            onToggleContrast={() =>
              mutate((s) => {
                s.contrast =
                  s.contrast === 'dark'
                    ? 'bright'
                    : 'dark'

                return s
              })
            }
            onStore={(k) => {
              setKid(k)
              setScreen('store')
            }}
            onAdventure={(k) => {
              setKid(k)
              setScreen('adventureHub')
            }}
          />
        )}

        {screen === 'subjects' && kid && (
          <SubjectScreen
            state={state}
            kid={kid}
            onSubject={selectSubject}
            onHome={() =>
              setScreen('home')
            }
            onStore={() =>
              setScreen('store')
            }
            onOcean={() =>
              setScreen('adventureHub')
            }
          />
        )}

        {screen === 'quizzes' &&
          kid &&
          subject && (
            <QuizSelect
              state={state}
              kid={kid}
              subject={subject}
              onStart={startQuiz}
              onBack={() =>
                setScreen('subjects')
              }
            />
          )}

        {screen === 'quiz' &&
          kid &&
          subject && (
            <QuizScreen
              kid={kid}
              subject={subject}
              quiz={quiz}
              questions={questions}
              voiceName={state.preferredVoice}
              rules={state.allowanceRules}
              mastery={state.kids[kid].mastery}
              seen={state.kids[kid].seen}
              onExit={() =>
                setScreen('quizzes')
              }
              onFinish={finish}
            />
          )}

        {screen === 'store' && kid && (
          <Storefront
            kid={kid}
            progress={state.kids[kid]}
            onBuy={buy}
            onClose={() =>
              setScreen('home')
            }
          />
        )}

        {screen === 'adventureHub' &&
          kid && (
            <AdventureHub
              kid={kid}
              progress={state.kids[kid]}
              onPlay={() =>
                setScreen('adventureGame')
              }
              onBack={() =>
                setScreen('home')
              }
              onMap={() =>
                setScreen('worldMap')
              }
              onKnowledge={() =>
                setScreen('knowledge')
              }
              onAquarium={() =>
                setScreen('aquarium')
              }
              onCabin={() =>
                setScreen('cabin')
              }
              onJournal={() =>
                setScreen('journal')
              }
              onSettings={() =>
                setScreen('adventureSettings')
              }
              onSkills={() =>
                setScreen('skillTree')
              }
              onClaimMission={
                claimMissionReward
              }
            />
          )}

        {screen === 'adventureGame' &&
          kid && (
            <AdventureGame
              kid={kid}
              progress={state.kids[kid]}
              settings={
                state.adventureSettings
              }
              onObjective={
                adventureObjective
              }
              onTreasure={
                searchTreasure
              }
              onBoss={() => {
                if (!kid) {
                  return
                }

                setPendingBoss(
                  state.kids[kid].adventure
                    .zoneId
                )

                setSubject(
                  'MasterChallenge'
                )

                setQuiz(5)
                setResult(null)
                setScreen('quiz')
              }}
              onExit={() =>
                setScreen('adventureHub')
              }
            />
          )}

        {screen === 'worldMap' && kid && (
          <WorldMap
            kid={kid}
            progress={state.kids[kid]}
            onClose={() =>
              setScreen('adventureHub')
            }
          />
        )}

        {screen === 'knowledge' &&
          kid && (
            <KnowledgeBank
              kid={kid}
              progress={state.kids[kid]}
              onClose={() =>
                setScreen('adventureHub')
              }
            />
          )}

        {screen === 'aquarium' &&
          kid && (
            <Aquarium
              kid={kid}
              progress={state.kids[kid]}
              onFeed={() =>
                mutate((s) => {
                  const a =
                    s.kids[kid].adventure
                      .aquarium

                  if (a.food > 0) {
                    a.food--
                    a.lastFed =
                      Date.now()
                  }

                  return s
                })
              }
              onClose={() =>
                setScreen('adventureHub')
              }
            />
          )}

        {screen === 'cabin' && kid && (
          <ExplorerCabin
            kid={kid}
            progress={state.kids[kid]}
            onEquip={(id) =>
              mutate((s) => {
                const p =
                  s.kids[kid]

                const value =
                  id.includes('map')
                    ? '🗺️'
                    : id.includes('lamp')
                      ? '🏮'
                      : '🐚'

                if (
                  !p.adventure.cabin
                    .equippedDecorations
                    .includes(value)
                ) {
                  p.adventure.cabin
                    .equippedDecorations
                    .push(value)
                }

                return s
              })
            }
            onClose={() =>
              setScreen('adventureHub')
            }
          />
        )}

        {screen === 'journal' &&
          kid && (
            <AdventureJournal
              kid={kid}
              progress={state.kids[kid]}
              onClose={() =>
                setScreen('adventureHub')
              }
            />
          )}

        {screen === 'skillTree' &&
          kid && (
            <SkillTree
              kid={kid}
              progress={state.kids[kid]}
              onClose={() =>
                setScreen('adventureHub')
              }
            />
          )}

        {screen ===
          'adventureSettings' && (
          <AdventureSettingsPanel
            settings={
              state.adventureSettings
            }
            onChange={(v) =>
              mutate((s) => {
                s.adventureSettings = v
                return s
              })
            }
            onClose={() =>
              setScreen('adventureHub')
            }
          />
        )}

        {screen === 'parent' && (
          <ParentPortal
            state={state}
            build={BUILD}
            onClose={() =>
              setScreen('home')
            }
            onVoice={(v) =>
              mutate((s) => {
                s.preferredVoice = v
                return s
              })
            }
            onRules={(
              r: AllowanceRules
            ) =>
              mutate((s) => {
                s.allowanceRules = r
                return s
              })
            }
            onGoal={addGoal}
            onNote={addNote}
            onImport={(text) => {
              try {
                setState(
                  importState(text)
                )

                alert(
                  'Family backup restored.'
                )
              } catch (e) {
                alert(
                  e instanceof Error
                    ? e.message
                    : 'Backup could not be restored.'
                )
              }
            }}
            onDifficulty={(
              k,
              sub,
              value
            ) =>
              mutate((s) => {
                s.parentSettings
                  .assignedDifficulty[k] = {
                  ...(
                    s.parentSettings
                      .assignedDifficulty[
                      k
                    ] || {}
                  ),
                  [sub]: value,
                }

                return s
              })
            }
            onDeduct={(k, a) =>
              mutate((s) => {
                s.kids[k].bank =
                  Math.max(
                    0,
                    Number(
                      (
                        s.kids[k].bank -
                        a
                      ).toFixed(2)
                    )
                  )

                return s
              })
            }
          />
        )}

        {screen === 'result' &&
          result &&
          kid && (
            <main className="result-shell">
              <section className="result-card animated-pop">
                <div className="result-emoji">
                  {result.passed
                    ? '🏆'
                    : '📘'}
                </div>

                <h1>
                  {result.passed
                    ? 'Learning Goal Met'
                    : 'Practice Complete'}
                </h1>

                <p className="result-score">
                  {Math.round(
                    result.accuracy * 100
                  )}
                  % first-attempt accuracy
                </p>

                <div className="result-grid">
                  <span>
                    Allowance
                    <strong>
                      $
                      {result.earned.toFixed(
                        2
                      )}
                    </strong>
                  </span>

                  <span>
                    XP
                    <strong>
                      +{result.xp}
                    </strong>
                  </span>

                  <span>
                    Adventure Energy
                    <strong>
                      ⚡ {result.energy}/12
                    </strong>
                  </span>

                  <span>
                    Pearls
                    <strong>
                      🦪 {result.pearls}
                    </strong>
                  </span>

                  <span>
                    Mastery change
                    <strong>
                      {result.masteryDelta >=
                      0
                        ? '+'
                        : ''}
                      {result.masteryDelta.toFixed(
                        1
                      )}
                    </strong>
                  </span>

                  <span>
                    World 1 area
                    <strong>
                      {result.zone}
                    </strong>
                  </span>
                </div>

                {result.goalBonus > 0 && (
                  <p>
                    🎯 Parent goal
                    completed! +$
                    {result.goalBonus.toFixed(
                      2
                    )}{' '}
                    bonus.
                  </p>
                )}

                {result.bossConquered && (
                  <p className="boss-win">
                    🏆 World 1 mastery
                    trial conquered:{' '}
                    <strong>
                      {
                        result.bossConquered
                      }
                    </strong>
                    ! +150 XP and +30
                    pearls.
                  </p>
                )}

                <p>
                  {result.passed
                    ? `You met the ${Math.round(
                        state
                          .allowanceRules
                          .passThreshold *
                          100
                      )}% first-attempt allowance rule.`
                    : `${Math.round(
                        state
                          .allowanceRules
                          .passThreshold *
                          100
                      )}% first-attempt accuracy is required for quiz allowance. XP, mastery, and Adventure Energy still count.`}
                </p>

                <button
                  className="primary"
                  onClick={() =>
                    setScreen('quizzes')
                  }
                >
                  Continue Learning
                </button>

                <button
                  className="secondary"
                  onClick={() =>
                    setScreen(
                      'adventureHub'
                    )
                  }
                >
                  🧭 Adventure Hub
                </button>
              </section>
            </main>
          )}

        <div className="build-tag">
          v{BUILD}
        </div>
      </div>
    </Suspense>
  )
}
