import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { signOut } from 'firebase/auth'
import { doc, getDoc, collection, getDocs } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { BookOpen, Trophy, LogOut, Award, ChevronRight, CheckCircle2, TrendingUp, Users, Star, Info, HelpCircle, X, ArrowRight, Lightbulb } from 'lucide-react'
import { learningAreas, getAreaProgress, moduleData } from '@/lib/abstimmungModuleContent'

// Tutorial Steps Definition
const TUTORIAL_STEPS: { id: string; title: string; description: string; highlight: string | null; position: string }[] = [
  {
    id: 'welcome',
    title: 'Willkommen zur Lernumgebung! 👋',
    description: 'Diese kurze Einführung zeigt Ihnen, wie Sie die Plattform optimal nutzen können. Sie können jederzeit über den Hilfe-Button unten rechts hierher zurückkehren.',
    highlight: null,
    position: 'center'
  },
  {
    id: 'progress',
    title: '📊 Ihr Fortschritt',
    description: 'Hier sehen Sie Ihren aktuellen Lernfortschritt in Prozent und die gesammelten Punkte. Bearbeiten Sie alle Module, um 100% zu erreichen!',
    highlight: 'progress-card',
    position: 'bottom-right'
  },
  {
    id: 'community',
    title: '👥 Gemeinschaft',
    description: 'Sehen Sie, wie viele andere Lernende ebenfalls teilnehmen und wie viele Badges insgesamt vergeben wurden.',
    highlight: 'community-card',
    position: 'bottom-left'
  },
  {
    id: 'modules',
    title: '📚 Lernsets',
    description: 'Hier sehen Sie die fünf Lernmodule. Klicken Sie auf ein Modul, um es zu starten. Grüne Haken zeigen abgeschlossene Module an.',
    highlight: 'modules-card',
    position: 'top'
  },
  {
    id: 'badges',
    title: '🏅 Badges & Zertifikate',
    description: 'Für jedes abgeschlossene Modul mit mindestens 60% erhalten Sie ein Badge. Bei 3 Modulen mit 60% Durchschnitt erhalten Sie ein Zertifikat!',
    highlight: 'badges-section',
    position: 'top'
  },
  {
    id: 'done',
    title: 'Bereit zum Lernen! 🎉',
    description: 'Klicken Sie auf das erste Modul «1. Ausgangslage», um zu beginnen. Viel Erfolg bei Ihrer Vorbereitung auf die Abstimmung!',
    highlight: null,
    position: 'center'
  }
]

interface UserData {
  lernname: string
  code: string
  totalPoints: number
  overallProgress: number
  modules: {
    [key: string]: { completed: boolean; score: number; progress: number }
  }
  badges?: {
    [moduleId: string]: {
      moduleId: string
      moduleName: string
      lerncode: string
      issuedAt: string
    }
  }
  overallFeedback?: {
    [areaId: string]: {
      overallSatisfaction: number
      favoriteModule: string
      wouldRecommend: number
      submittedAt: string
    }
  }
}

interface Statistics {
  avgPoints: number
  avgSatisfaction: number
  favoriteModule: string
  recommendRate: number
  totalUsers: number
}

interface RegistrationStats {
  totalRegistered: number
  totalBadges: number
  totalCertificates: number
}

export default function AbstimmungDashboard() {
  const router = useRouter()
  const [userData, setUserData] = useState<UserData | null>(null)
  const [statistics, setStatistics] = useState<Statistics | null>(null)
  const [registrationStats, setRegistrationStats] = useState<RegistrationStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [showTutorial, setShowTutorial] = useState(false)
  const [tutorialStep, setTutorialStep] = useState(0)

  useEffect(() => {
    const loadData = async () => {
      const user = auth.currentUser
      if (!user) {
        router.push('/')
        return
      }

      // Load user data
      const userDoc = await getDoc(doc(db, 'users', user.uid))
      if (userDoc.exists()) {
        const data = userDoc.data() as UserData

        // Check if user is new (no progress yet) - show tutorial
        const isNewUser = !data.modules || Object.values(data.modules).every(
          m => !m.completed && m.score === 0 && m.progress === 0
        )
        if (isNewUser) {
          // Check localStorage to not show tutorial again
          const tutorialSeen = localStorage.getItem('dashboard_tutorial_seen')
          if (!tutorialSeen) {
            setShowTutorial(true)
          }
        }

        // Initialize modules if they don't exist
        if (!data.modules) {
          data.modules = {
            ausgangslage: { completed: false, score: 0, progress: 0 },
            grundlagen: { completed: false, score: 0, progress: 0 },
            procontra: { completed: false, score: 0, progress: 0 },
            vertiefung: { completed: false, score: 0, progress: 0 },
            spielerisch: { completed: false, score: 0, progress: 0 }
          }
        }
        
        // Ensure all required modules exist
        const requiredModules = ['ausgangslage', 'grundlagen', 'procontra', 'vertiefung', 'spielerisch']
        requiredModules.forEach(moduleId => {
          if (!data.modules[moduleId]) {
            data.modules[moduleId] = { completed: false, score: 0, progress: 0 }
          }
        })
        
        setUserData(data)
        
        // Load statistics if user has given feedback
        if (data.overallFeedback?.abstimmung2026) {
          await loadStatistics()
        }
        
        // Always load registration statistics
        await loadRegistrationStats()
      }

      setLoading(false)
    }

    loadData()
  }, [router])

  const loadRegistrationStats = async () => {
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'))
      const totalRegistered = usersSnapshot.size

      const allUsers = usersSnapshot.docs.map(doc => doc.data() as UserData)

      // Zertifikate: User mit mindestens 3 Modulen und 60% Durchschnitt
      const totalCertificates = allUsers.filter(user => {
        if (!user.modules) return false
        const mainModules = ['ausgangslage', 'grundlagen', 'procontra', 'vertiefung', 'spielerisch']
        let totalScore = 0
        let completedCount = 0
        mainModules.forEach(moduleId => {
          if (user.modules[moduleId]?.completed) {
            completedCount++
            totalScore += user.modules[moduleId].score || 0
          }
        })
        const avgProgress = Math.round((totalScore / 500) * 100)
        return completedCount >= 3 && avgProgress >= 60
      }).length

      // Badges: Zähle Module mit ≥60% Score pro User
      let totalBadges = 0
      const moduleMaxPoints: { [key: string]: number } = {
        ausgangslage: 100,
        grundlagen: 100,
        procontra: 100,
        vertiefung: 100,
        spielerisch: 100
      }

      allUsers.forEach(user => {
        if (user.modules) {
          Object.keys(user.modules).forEach(moduleId => {
            const moduleScore = user.modules[moduleId]?.score || 0
            const maxPts = moduleMaxPoints[moduleId] || 100
            const pct = maxPts > 0 ? Math.round((moduleScore / maxPts) * 100) : 0
            if (pct >= 60) {
              totalBadges++
            }
          })
        }
      })

      setRegistrationStats({
        totalRegistered,
        totalBadges,
        totalCertificates
      })
    } catch (error) {
      console.error('Error loading registration stats:', error)
    }
  }

  const loadStatistics = async () => {
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'))
      const allUsers = usersSnapshot.docs.map(doc => doc.data() as UserData)
      
      const usersWithFeedback = allUsers.filter(
        u => u.overallFeedback?.abstimmung2026
      )
      
      if (usersWithFeedback.length === 0) {
        return
      }

      const calculateUserPoints = (user: UserData) => {
        if (!user.modules) return 0
        
        const mainModules = ['ausgangslage', 'grundlagen', 'procontra', 'vertiefung', 'spielerisch']
        let userTotal = 0
        
        mainModules.forEach(moduleId => {
          if (user.modules[moduleId]) {
            const score = user.modules[moduleId].score || 0
            userTotal += score
          }
        })
        
        return Math.min(userTotal, 500)
      }

      const totalPoints = usersWithFeedback.reduce((sum, u) => sum + calculateUserPoints(u), 0)
      const avgPoints = Math.round(totalPoints / usersWithFeedback.length)

      const totalSatisfaction = usersWithFeedback.reduce(
        (sum, u) => sum + (u.overallFeedback?.abstimmung2026?.overallSatisfaction || 0),
        0
      )
      const avgSatisfaction = totalSatisfaction / usersWithFeedback.length

      const moduleCounts: { [key: string]: number } = {}
      usersWithFeedback.forEach(u => {
        const fav = u.overallFeedback?.abstimmung2026?.favoriteModule
        if (fav) {
          moduleCounts[fav] = (moduleCounts[fav] || 0) + 1
        }
      })
      const favoriteModule = Object.keys(moduleCounts).reduce((a, b) =>
        moduleCounts[a] > moduleCounts[b] ? a : b
      , '')

      const recommendCount = usersWithFeedback.filter(
        u => (u.overallFeedback?.abstimmung2026?.wouldRecommend || 0) >= 4
      ).length
      const recommendRate = Math.round((recommendCount / usersWithFeedback.length) * 100)

      setStatistics({
        avgPoints,
        avgSatisfaction,
        favoriteModule,
        recommendRate,
        totalUsers: usersWithFeedback.length
      })
    } catch (error) {
      console.error('Error loading statistics:', error)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut(auth)
      router.push('/')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  // Scroll to highlighted element when tutorial step changes
  // This useEffect MUST be before any conditional returns!
  useEffect(() => {
    if (showTutorial) {
      const step = TUTORIAL_STEPS[tutorialStep]
      if (step?.highlight) {
        // Delay to ensure DOM elements are rendered
        const timeoutId = setTimeout(() => {
          const element = document.getElementById(step.highlight as string)
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }
        }, 100)
        return () => clearTimeout(timeoutId)
      }
    }
  }, [showTutorial, tutorialStep])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-teal-600 font-semibold">Lade Dashboard...</p>
        </div>
      </div>
    )
  }

  if (!userData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 font-semibold">Keine Benutzerdaten gefunden</p>
        </div>
      </div>
    )
  }

  const areaProgress = getAreaProgress(userData.modules, 'abstimmung2026')

  const closeTutorial = () => {
    setShowTutorial(false)
    setTutorialStep(0)
    localStorage.setItem('dashboard_tutorial_seen', 'true')
  }

  const nextTutorialStep = () => {
    if (tutorialStep < TUTORIAL_STEPS.length - 1) {
      setTutorialStep(tutorialStep + 1)
    } else {
      closeTutorial()
    }
  }

  const prevTutorialStep = () => {
    if (tutorialStep > 0) {
      setTutorialStep(tutorialStep - 1)
    }
  }

  const currentTutorialStep = TUTORIAL_STEPS[tutorialStep] || TUTORIAL_STEPS[0]

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50">
      {/* Tutorial Styles */}
      {showTutorial && (
        <style dangerouslySetInnerHTML={{ __html: `
          .tutorial-highlight {
            position: relative;
            z-index: 45;
            box-shadow: 0 0 0 4px #14b8a6, 0 0 0 8px rgba(20, 184, 166, 0.3), 0 0 30px rgba(20, 184, 166, 0.4);
            border-radius: 12px;
            animation: pulse-highlight 2s ease-in-out infinite;
          }
          @keyframes pulse-highlight {
            0%, 100% { box-shadow: 0 0 0 4px #14b8a6, 0 0 0 8px rgba(20, 184, 166, 0.3), 0 0 30px rgba(20, 184, 166, 0.4); }
            50% { box-shadow: 0 0 0 4px #14b8a6, 0 0 0 12px rgba(20, 184, 166, 0.2), 0 0 40px rgba(20, 184, 166, 0.5); }
          }
        `}} />
      )}

      {/* Tutorial Overlay */}
      {showTutorial && (
        <div className="fixed inset-0 z-40 pointer-events-none">
          {/* Semi-transparent overlay - allows clicking through except on the card */}
          <div
            className="absolute inset-0 bg-black/50 pointer-events-auto"
            onClick={closeTutorial}
          />

          {/* Tutorial Card - positioned based on highlighted element */}
          <div
            className={`fixed z-50 max-w-md w-full pointer-events-auto transition-all duration-300 ${
              currentTutorialStep.position === 'bottom-right'
                ? 'top-[45%] right-4 md:right-8'
                : currentTutorialStep.position === 'bottom-left'
                ? 'top-[45%] left-4 md:left-8'
                : currentTutorialStep.position === 'top'
                ? 'bottom-8 left-1/2 -translate-x-1/2 px-4'
                : 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4'
            }`}
          >
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
              {/* Progress bar */}
              <div className="h-1.5 bg-gray-200">
                <div
                  className="h-full bg-gradient-to-r from-teal-500 to-cyan-500 transition-all duration-300"
                  style={{ width: `${((tutorialStep + 1) / TUTORIAL_STEPS.length) * 100}%` }}
                />
              </div>

              <div className="p-6">
                {/* Close button */}
                <button
                  onClick={closeTutorial}
                  className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 z-10"
                >
                  <X className="h-5 w-5" />
                </button>

                {/* Step number badge */}
                <div className="absolute top-4 left-4 bg-teal-100 text-teal-700 text-xs font-bold px-2 py-1 rounded-full">
                  {tutorialStep + 1} / {TUTORIAL_STEPS.length}
                </div>

                {/* Icon */}
                <div className="flex justify-center mb-4 mt-2">
                  <div className="bg-gradient-to-br from-teal-100 to-cyan-100 p-4 rounded-full">
                    <Lightbulb className="h-8 w-8 text-teal-600" />
                  </div>
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold text-gray-900 text-center mb-3">
                  {currentTutorialStep.title}
                </h3>
                <p className="text-gray-600 text-center mb-6">
                  {currentTutorialStep.description}
                </p>

                {/* Arrow indicator for highlighted elements */}
                {currentTutorialStep.highlight && (
                  <div className="flex justify-center mb-4">
                    <div className="bg-teal-50 border border-teal-200 rounded-lg px-3 py-2 text-sm text-teal-700 flex items-center gap-2">
                      <span>👆</span>
                      <span>Schauen Sie auf den markierten Bereich</span>
                    </div>
                  </div>
                )}

                {/* Step indicator dots */}
                <div className="flex justify-center gap-2 mb-6">
                  {TUTORIAL_STEPS.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setTutorialStep(index)}
                      className={`h-2 rounded-full transition-all ${
                        index === tutorialStep
                          ? 'bg-teal-500 w-6'
                          : index < tutorialStep
                          ? 'bg-teal-300 w-2'
                          : 'bg-gray-300 w-2'
                      }`}
                    />
                  ))}
                </div>

                {/* Navigation buttons */}
                <div className="flex gap-3">
                  {tutorialStep > 0 && (
                    <button
                      onClick={prevTutorialStep}
                      className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-colors"
                    >
                      Zurück
                    </button>
                  )}
                  <button
                    onClick={nextTutorialStep}
                    className="flex-1 py-3 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2"
                  >
                    {tutorialStep === TUTORIAL_STEPS.length - 1 ? (
                      <>Los geht's!</>
                    ) : (
                      <>
                        Weiter
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </div>

                {/* Skip button */}
                <button
                  onClick={closeTutorial}
                  className="w-full mt-3 py-2 text-sm text-gray-500 hover:text-gray-700"
                >
                  Tutorial überspringen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Help Button (always visible) */}
      <button
        onClick={() => {
          setTutorialStep(0)
          setShowTutorial(true)
        }}
        className="fixed bottom-6 right-6 z-40 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all group"
        title="Hilfe & Tutorial"
      >
        <HelpCircle className="h-6 w-6" />
        <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-sm px-3 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          Hilfe anzeigen
        </span>
      </button>

      {/* Header */}
      <header className="bg-white shadow-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-br from-teal-500 to-cyan-600 p-3 rounded-xl shadow-lg">
                <BookOpen className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Abstimmungs-Lernumgebung</h1>
                <p className="text-sm text-gray-600">Willkommen, {userData.lernname}</p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Abmelden</span>
            </button>
          </div>
        </div>
      </header>

      {/* Abstimmungs-Banner */}
      <div className="bg-gradient-to-r from-red-600 via-red-500 to-orange-500 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-3 rounded-lg">
                <span className="text-3xl">🗳️</span>
              </div>
              <div>
                <div className="text-sm font-medium text-red-100 uppercase tracking-wide">Eidgenössische Volksabstimmung</div>
                <h2 className="text-2xl font-bold">Individualbesteuerung</h2>
                <p className="text-red-100 text-sm mt-1">Sollen Ehepaare künftig getrennt besteuert werden?</p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold">8.</div>
                <div className="text-sm text-red-100">März 2026</div>
              </div>
              <div className="hidden md:block h-12 w-px bg-white/30"></div>
              <div className="text-center hidden md:block">
                <div className="text-lg font-semibold">🇨🇭</div>
                <div className="text-xs text-red-100">Schweizweit</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistik-Karten */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Fortschritt */}
          <div
            id="progress-card"
            className={`bg-white rounded-xl shadow-md p-6 transition-all ${
              showTutorial && currentTutorialStep.highlight === 'progress-card' ? 'tutorial-highlight' : ''
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Ihr Fortschritt</h3>
              <TrendingUp className="h-6 w-6 text-teal-600" />
            </div>
            <div className="text-4xl font-bold text-teal-600 mb-2">{areaProgress.progress}%</div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-teal-500 to-cyan-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${areaProgress.progress}%` }}
              />
            </div>
            <p className="text-sm text-gray-600 mt-2">{areaProgress.points} / {areaProgress.maxPoints} Punkte</p>
          </div>

          {/* Abgeschlossene Module */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Lernsets</h3>
              <CheckCircle2 className="h-6 w-6 text-teal-600" />
            </div>
            <div className="text-4xl font-bold text-teal-600 mb-2">
              {areaProgress.completed} / {areaProgress.total}
            </div>
            <p className="text-sm text-gray-600">abgeschlossen</p>
          </div>

          {/* Teilnehmer (wenn Statistiken verfügbar) */}
          {registrationStats && (
            <div
              id="community-card"
              className={`bg-white rounded-xl shadow-md p-6 transition-all ${
                showTutorial && currentTutorialStep.highlight === 'community-card' ? 'tutorial-highlight' : ''
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Gemeinschaft</h3>
                <Users className="h-6 w-6 text-teal-600" />
              </div>
              <div className="text-4xl font-bold text-teal-600 mb-2">{registrationStats.totalRegistered}</div>
              <p className="text-sm text-gray-600">Teilnehmer:innen</p>
              <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
                🏆 {registrationStats.totalBadges} Badges vergeben
              </div>
            </div>
          )}
        </div>

        {/* Vergleichsstatistiken - nur sichtbar wenn Feedback abgegeben wurde */}
        {statistics && userData.overallFeedback?.abstimmung2026 && (
          <div className="bg-gradient-to-r from-teal-500 to-cyan-600 rounded-xl shadow-lg p-8 mb-8 text-white">
            <div className="flex items-center gap-3 mb-6">
              <Star className="h-7 w-7" />
              <h2 className="text-2xl font-bold">Ihr Feedback im Vergleich</h2>
            </div>
            <p className="text-teal-100 mb-6">
              Sie haben Feedback abgegeben! Hier sehen Sie, wie Ihre Bewertung im Vergleich zu anderen Teilnehmer:innen steht.
              <span className="text-xs ml-2 opacity-80">({statistics.totalUsers} Teilnehmer:innen haben Feedback abgegeben)</span>
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Persönliche Statistiken */}
              <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-6 border border-white border-opacity-20">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <span>👤</span> Ihre Bewertungen
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-teal-100 mb-1">Gesamtpunkte</div>
                    <div className="text-3xl font-bold">{areaProgress.points} Punkte</div>
                    <div className="text-xs text-teal-100 mt-1">
                      von max. {areaProgress.maxPoints} Punkten
                    </div>
                  </div>
                  <div className="pt-4 border-t border-white border-opacity-20">
                    <div className="text-sm text-teal-100 mb-1">Zufriedenheit</div>
                    <div className="text-3xl font-bold">
                      {userData.overallFeedback.abstimmung2026.overallSatisfaction.toFixed(1)} / 5
                    </div>
                    <div className="flex gap-1 mt-2">
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star
                          key={star}
                          className={`h-5 w-5 ${
                            star <= userData.overallFeedback!.abstimmung2026.overallSatisfaction
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-white text-opacity-30'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="pt-4 border-t border-white border-opacity-20">
                    <div className="text-sm text-teal-100 mb-1">Lieblingsmodul</div>
                    <div className="text-lg font-semibold">
                      {moduleData[userData.overallFeedback.abstimmung2026.favoriteModule]?.title || 'Nicht angegeben'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Durchschnittsstatistiken */}
              <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-6 border border-white border-opacity-20">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Users className="h-5 w-5" /> Durchschnittswerte
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-teal-100 mb-1">Durchschnittliche Punkte</div>
                    <div className="text-3xl font-bold">{statistics.avgPoints} Punkte</div>
                    <div className="text-xs text-teal-100 mt-1">
                      {areaProgress.points > statistics.avgPoints 
                        ? '✅ Sie liegen über dem Durchschnitt!' 
                        : areaProgress.points === statistics.avgPoints
                        ? '→ Sie liegen im Durchschnitt'
                        : '→ Verbesserungspotenzial vorhanden'}
                    </div>
                  </div>
                  <div className="pt-4 border-t border-white border-opacity-20">
                    <div className="text-sm text-teal-100 mb-1">Durchschnittliche Zufriedenheit</div>
                    <div className="text-3xl font-bold">{statistics.avgSatisfaction.toFixed(1)} / 5</div>
                    <div className="text-xs text-teal-100 mt-1">
                      {userData.overallFeedback.abstimmung2026.overallSatisfaction > statistics.avgSatisfaction 
                        ? '✅ Sie sind zufriedener als der Durchschnitt' 
                        : userData.overallFeedback.abstimmung2026.overallSatisfaction === statistics.avgSatisfaction
                        ? '→ Ihre Bewertung entspricht dem Durchschnitt'
                        : '→ Andere bewerten höher'}
                    </div>
                  </div>
                  <div className="pt-4 border-t border-white border-opacity-20">
                    <div className="text-sm text-teal-100 mb-1">Beliebtestes Modul</div>
                    <div className="text-lg font-semibold">
                      {moduleData[statistics.favoriteModule]?.title || 'Nicht ermittelbar'}
                    </div>
                    <div className="text-xs text-teal-100 mt-1">
                      {userData.overallFeedback.abstimmung2026.favoriteModule === statistics.favoriteModule 
                        ? '✅ Stimmt mit Ihrer Wahl überein' 
                        : '→ Sie bevorzugen: ' + (moduleData[userData.overallFeedback.abstimmung2026.favoriteModule]?.title || '')}
                    </div>
                  </div>
                  <div className="pt-4 border-t border-white border-opacity-20">
                    <div className="text-sm text-teal-100 mb-1">Weiterempfehlung</div>
                    <div className="text-2xl font-bold">{statistics.recommendRate}%</div>
                    <div className="text-xs text-teal-100 mt-1">
                      würden weiterempfehlen
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-white border-opacity-20 text-center text-sm text-teal-100">
              💬 Vielen Dank für Ihr Feedback! Diese Statistiken helfen uns, die Lernplattform zu verbessern.
            </div>
          </div>
        )}

        {/* Lernbereich: Abstimmung 2026 */}
        <div
          id="modules-card"
          className={`max-w-4xl mx-auto transition-all ${
            showTutorial && currentTutorialStep.highlight === 'modules-card' ? 'tutorial-highlight' : ''
          }`}
        >
          <LearningAreaCard
            area={learningAreas.abstimmung2026}
            progress={areaProgress}
            modules={userData.modules}
            userData={userData}
            onModuleClick={(moduleId) => {
              // All modules use custom pages now
              router.push(`/custom-modules/${moduleId}`)
            }}
            onCertificateClick={() => router.push('/certificate')}
            router={router}
            showTutorial={showTutorial}
            tutorialHighlight={currentTutorialStep.highlight}
          />
        </div>
      </main>
    </div>
  )
}

// Komponente für Lernbereich-Karte
interface LearningAreaCardProps {
  area: typeof learningAreas.abstimmung2026
  progress: ReturnType<typeof getAreaProgress>
  modules: UserData['modules']
  userData: UserData
  onModuleClick: (moduleId: string) => void
  onCertificateClick: () => void
  router: ReturnType<typeof useRouter>
  showTutorial?: boolean
  tutorialHighlight?: string | null
}

function LearningAreaCard({ area, progress, modules, userData, onModuleClick, onCertificateClick, router, showTutorial, tutorialHighlight }: LearningAreaCardProps) {
  const modulesList = area.modules.map(moduleId => {
    const moduleData = modules[moduleId as keyof typeof modules]
    return {
      id: moduleId,
      completed: moduleData?.completed || false,
      score: moduleData?.score || 0,
      progress: moduleData?.progress || 0
    }
  })

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      {/* Header - Türkis statt Blau */}
      <div className="bg-gradient-to-r from-teal-600 to-cyan-500 p-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold">{area.title}</h2>
            <p className="text-teal-100 mt-2">{area.description}</p>
          </div>
          <BookOpen className="h-8 w-8 text-teal-200" />
        </div>
        
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-teal-100">Fortschritt</span>
            <span className="text-lg font-bold">{progress.progress}%</span>
          </div>
          <div className="w-full bg-teal-400 rounded-full h-3 overflow-hidden">
            <div
              className="bg-white h-full rounded-full transition-all duration-500"
              style={{ width: `${progress.progress}%` }}
            />
          </div>
          <div className="mt-2 text-sm text-teal-100">
            {progress.points} / {progress.maxPoints} Punkte
          </div>
        </div>
      </div>

      {/* Module Liste */}
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Lernsets</h3>
        <p className="text-sm text-gray-500 mb-4">Abstimmung vom 8. März 2026 – Individualbesteuerung</p>
        <div className="space-y-3">
          {modulesList.map((module) => (
            <ModuleButton
              key={module.id}
              moduleId={module.id}
              moduleTitle={moduleData[module.id]?.title || 'Unbekanntes Lernset'}
              completed={module.completed}
              score={module.score}
              progress={module.progress}
              onClick={() => onModuleClick(module.id)}
            />
          ))}
        </div>

        {/* Modul-Badges - für Module mit ≥60% Lernerfolg */}
        <div
          id="badges-section"
          className={`mt-6 pt-6 border-t border-gray-200 transition-all rounded-lg ${
            showTutorial && tutorialHighlight === 'badges-section' ? 'tutorial-highlight p-4 -m-4' : ''
          }`}
        >
          {(() => {
            // Berechne welche Module einen Badge verdient haben (≥60%)
            const modulesWithBadge = modulesList.filter(m => {
              const maxPts = moduleData[m.id]?.maxPoints || 100
              const pct = maxPts > 0 ? Math.round((m.score / maxPts) * 100) : 0
              return pct >= 60
            })

            if (modulesWithBadge.length > 0) {
              return (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">🏅 Meine Modul-Badges ({modulesWithBadge.length})</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {modulesWithBadge.map((m) => {
                      const maxPts = moduleData[m.id]?.maxPoints || 100
                      const pct = Math.round((m.score / maxPts) * 100)
                      const level = pct >= 90 ? '🥇' : pct >= 75 ? '🥈' : '🥉'
                      return (
                        <button
                          key={m.id}
                          onClick={() => router.push(`/badges/${m.id}`)}
                          className="flex items-center gap-2 p-3 rounded-lg bg-gradient-to-r from-yellow-50 to-amber-50 hover:from-yellow-100 hover:to-amber-100 border border-yellow-200 transition-all text-left"
                        >
                          <span className="text-xl">{level}</span>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 text-xs truncate">{moduleData[m.id]?.title.split('.')[1]?.trim() || m.id}</p>
                            <p className="text-xs text-gray-500">{pct}%</p>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            }
            return null
          })()}

          {/* Zertifikat-Button */}
          {(() => {
            // Zertifikat-Anforderung: mindestens 3 Module UND 60% Durchschnitt
            const certificateUnlocked = progress.completed >= 3 && progress.progress >= 60
            const hasFeedback = userData.overallFeedback?.abstimmung2026

            return (
              <button
                onClick={() => {
                  if (certificateUnlocked && !hasFeedback) {
                    router.push('/feedback')
                  } else if (certificateUnlocked) {
                    router.push('/certificate')
                  }
                }}
                disabled={!certificateUnlocked}
                className={`w-full flex items-center justify-between p-4 rounded-lg transition-all ${
                  certificateUnlocked
                    ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 hover:from-yellow-500 hover:to-yellow-600 shadow-lg'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Award className="h-6 w-6" />
                  <div className="text-left">
                    <div className="font-semibold">
                      {certificateUnlocked
                        ? (hasFeedback ? 'Zertifikat anzeigen' : 'Zertifikat abholen')
                        : 'Zertifikat (noch nicht freigeschaltet)'}
                    </div>
                    {!certificateUnlocked && (
                      <div className="text-xs text-gray-500 mt-1">
                        Mind. 3 Module ({progress.completed}/3) und 60% Durchschnitt ({progress.progress}%)
                      </div>
                    )}
                    {certificateUnlocked && !hasFeedback && (
                      <div className="text-xs text-gray-700 mt-1">
                        Kurze Umfrage ausfüllen
                      </div>
                    )}
                  </div>
                </div>
                {certificateUnlocked && <ChevronRight className="h-5 w-5" />}
              </button>
            )
          })()}
        </div>
      </div>
    </div>
  )
}

// Komponente für Modul-Button
interface ModuleButtonProps {
  moduleId: string
  moduleTitle: string
  completed: boolean
  score: number
  progress: number
  onClick: () => void
}

function ModuleButton({ moduleId, moduleTitle, completed, score, progress, onClick }: ModuleButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
        completed
          ? 'border-green-500 bg-green-50 hover:bg-green-100'
          : progress > 0
          ? 'border-teal-500 bg-teal-50 hover:bg-teal-100'
          : 'border-gray-200 bg-white hover:bg-gray-50'
      }`}
    >
      <div className="flex items-center gap-4">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
            completed
              ? 'bg-green-500 text-white'
              : progress > 0
              ? 'bg-teal-500 text-white'
              : 'bg-gray-200 text-gray-600'
          }`}
        >
          {completed ? <CheckCircle2 className="h-6 w-6" /> : <BookOpen className="h-5 w-5" />}
        </div>
        <div className="text-left">
          <div className="font-semibold text-gray-900">{moduleTitle}</div>
          <div className="text-sm text-gray-600">
            {completed ? `Abgeschlossen - ${score} Punkte` : progress > 0 ? `In Bearbeitung - ${progress}%` : 'Noch nicht begonnen'}
          </div>
        </div>
      </div>
      <ChevronRight className="h-5 w-5 text-gray-400" />
    </button>
  )
}
