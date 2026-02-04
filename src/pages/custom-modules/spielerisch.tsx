import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/router'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { ArrowLeft, Award, Gamepad2, CheckCircle2, Star, Trophy, RefreshCw } from 'lucide-react'

// LearningApps URL - Steuern Grundwissen (Kontext Individualbesteuerung)
const LEARNING_APP_URL = 'https://LearningApps.org/watch?v=p8z71p6tc26'
const LEARNING_APP_EMBED_URL = 'https://LearningApps.org/show?id=p8z71p6tc26&fullscreen=1'

export default function SpielerischPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [totalScore, setTotalScore] = useState(0)
  const [completedSections, setCompletedSections] = useState<Set<string>>(new Set())
  const [appScore, setAppScore] = useState<number | null>(null)
  const [appCompleted, setAppCompleted] = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)

  const maxPoints = 100

  // Laden des Fortschritts
  useEffect(() => {
    const load = async () => {
      const user = auth.currentUser
      if (!user) { router.push('/'); return }

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid))
        if (userDoc.exists()) {
          const data = userDoc.data().modules?.spielerisch
          if (data) {
            setTotalScore(data.score || 0)
            setCompletedSections(new Set(data.completedSections || []))
            if (data.completedSections?.includes('learningapp')) {
              setAppCompleted(true)
              setAppScore(data.appScore || 100)
            }
          }
        }
      } catch (e) { console.error(e) }
      setLoading(false)
    }
    load()
  }, [router])

  // PostMessage Listener für LearningApps Ergebnisse
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      // Nur LearningApps Nachrichten verarbeiten
      if (typeof event.data !== 'string') return

      const parts = event.data.split('|')
      const messageType = parts[0]

      // AppSolved oder AppChecked bedeutet, dass die App abgeschlossen wurde
      if ((messageType === 'AppSolved' || messageType === 'AppChecked') && !appCompleted) {
        let score = 100

        // Score aus der Nachricht extrahieren falls vorhanden
        if (parts.length >= 3) {
          const parsedScore = parseInt(parts[2])
          if (!isNaN(parsedScore) && parsedScore > 0 && parsedScore <= 100) {
            score = parsedScore
          }
        }

        setAppScore(score)
        setAppCompleted(true)
        setShowCelebration(true)

        // Punkte berechnen (max 100 Punkte basierend auf Score)
        const earnedPoints = Math.round((score / 100) * maxPoints)

        // Fortschritt speichern
        await saveProgress(earnedPoints, score)

        // Celebration nach 3 Sekunden ausblenden
        setTimeout(() => setShowCelebration(false), 3000)
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [appCompleted])

  const saveProgress = async (score: number, appScoreValue: number) => {
    const user = auth.currentUser
    if (!user) return

    try {
      const userRef = doc(db, 'users', user.uid)
      const userDoc = await getDoc(userRef)

      if (userDoc.exists()) {
        const userData = userDoc.data()
        const modules = userData.modules || {}

        const newCompleted = ['learningapp']

        modules.spielerisch = {
          completed: true,
          score,
          appScore: appScoreValue,
          progress: 100,
          completedSections: newCompleted,
          lastUpdated: new Date().toISOString()
        }

        setTotalScore(score)
        setCompletedSections(new Set(newCompleted))

        // Gesamtpunkte berechnen
        let totalPoints = 0
        let totalBonus = 0
        Object.keys(modules).forEach(k => {
          if (modules[k].score) totalPoints += modules[k].score
          if (modules[k].bonusScore) totalBonus += modules[k].bonusScore
        })

        const allModules = ['ausgangslage', 'grundlagen', 'procontra', 'vertiefung', 'spielerisch']
        const overallProgress = Math.round((allModules.filter(id => modules[id]?.completed).length / allModules.length) * 100)

        await updateDoc(userRef, { modules, totalPoints, totalBonus, overallProgress })
      }
    } catch (e) { console.error(e) }
  }

  const resetApp = async () => {
    setAppCompleted(false)
    setAppScore(null)
    setTotalScore(0)
    setCompletedSections(new Set())

    // Fortschritt zurücksetzen in Firebase
    const user = auth.currentUser
    if (!user) return

    try {
      const userRef = doc(db, 'users', user.uid)
      const userDoc = await getDoc(userRef)

      if (userDoc.exists()) {
        const userData = userDoc.data()
        const modules = userData.modules || {}

        modules.spielerisch = {
          completed: false,
          score: 0,
          appScore: null,
          progress: 0,
          completedSections: [],
          lastUpdated: new Date().toISOString()
        }

        // Gesamtpunkte neu berechnen
        let totalPoints = 0
        let totalBonus = 0
        Object.keys(modules).forEach(k => {
          if (modules[k].score) totalPoints += modules[k].score
          if (modules[k].bonusScore) totalBonus += modules[k].bonusScore
        })

        const allModules = ['ausgangslage', 'grundlagen', 'procontra', 'vertiefung', 'spielerisch']
        const overallProgress = Math.round((allModules.filter(id => modules[id]?.completed).length / allModules.length) * 100)

        await updateDoc(userRef, { modules, totalPoints, totalBonus, overallProgress })
      }
    } catch (e) { console.error(e) }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-orange-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-orange-50">
      {/* Celebration Overlay */}
      {showCelebration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-fade-in">
          <div className="bg-white rounded-2xl p-8 text-center shadow-2xl animate-bounce-in max-w-md mx-4">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Geschafft!</h2>
            <p className="text-gray-600 mb-4">
              Sie haben das Quiz mit <span className="font-bold text-pink-600">{appScore}%</span> abgeschlossen!
            </p>
            <div className="flex items-center justify-center gap-2 text-lg font-semibold text-green-600">
              <Trophy className="h-6 w-6" />
              <span>+{Math.round((appScore || 0) / 100 * maxPoints)} Punkte</span>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-gradient-to-r from-pink-600 to-rose-600 text-white sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <button onClick={() => router.push('/dashboard')} className="flex items-center gap-1 text-white/80 hover:text-white text-sm">
              <ArrowLeft className="h-5 w-5" /><span>Dashboard</span>
            </button>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm bg-white/20 px-3 py-1 rounded-full">
                <Award className="h-4 w-4" />
                <span className="font-semibold">{totalScore} / {maxPoints}</span>
              </div>
              {appCompleted && (
                <div className="flex items-center gap-1 text-sm bg-green-400/30 px-2 py-1 rounded-full">
                  <CheckCircle2 className="h-3 w-3" />
                  <span className="text-xs">Abgeschlossen</span>
                </div>
              )}
            </div>
          </div>
          <h1 className="text-xl font-bold mt-2">5. Spielerisch lernen</h1>
          <p className="text-pink-200 text-sm">Steuern - Grundwissen im Kontext der Individualbesteuerung</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Einleitung */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-start gap-4">
            <div className="bg-pink-100 p-3 rounded-xl">
              <Gamepad2 className="h-6 w-6 text-pink-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-2">Interaktives Quiz</h3>
              <p className="text-gray-700">
                Testen Sie Ihr Wissen über Steuern und die Individualbesteuerung mit diesem
                interaktiven Quiz. Lösen Sie alle Aufgaben, um <strong>bis zu {maxPoints} Punkte</strong> zu sammeln!
              </p>
            </div>
          </div>
        </div>

        {/* Status-Anzeige wenn abgeschlossen */}
        {appCompleted && (
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-white/20 p-3 rounded-xl">
                  <Trophy className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Quiz abgeschlossen!</h3>
                  <p className="text-green-100">
                    Ergebnis: <span className="font-bold">{appScore}%</span> •
                    Punkte: <span className="font-bold">{totalScore}/{maxPoints}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={resetApp}
                className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Nochmal</span>
              </button>
            </div>
          </div>
        )}

        {/* LearningApp Embed */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="bg-pink-50 p-4 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-pink-600 p-2 rounded-lg">
                  <Gamepad2 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Steuern - Grundwissen</h3>
                  <p className="text-sm text-gray-500">Interaktives LearningApps-Quiz</p>
                </div>
              </div>
              {appCompleted && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  +{totalScore}P
                </span>
              )}
            </div>
          </div>

          {/* iframe Container */}
          <div className="relative" style={{ paddingBottom: '75%', height: 0 }}>
            <iframe
              src={LEARNING_APP_EMBED_URL}
              className="absolute top-0 left-0 w-full h-full border-0"
              allow="fullscreen"
              title="Steuern - Grundwissen (Kontext Individualbesteuerung)"
            />
          </div>

          <div className="p-4 bg-gray-50 border-t">
            <p className="text-sm text-gray-500 text-center">
              💡 Lösen Sie alle Aufgaben im Quiz. Ihre Ergebnisse werden automatisch erfasst.
            </p>
          </div>
        </div>

        {/* Abschluss-Button */}
        {appCompleted && (
          <div className="bg-gradient-to-r from-pink-500 to-rose-600 rounded-xl p-6 text-white text-center">
            <div className="text-4xl mb-3">🎉</div>
            <h3 className="text-xl font-bold mb-2">Modul abgeschlossen!</h3>
            <p className="text-pink-100 mb-4">
              Sie haben {totalScore} von {maxPoints} Punkten erreicht.
            </p>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-6 py-2 bg-white text-pink-600 rounded-lg font-semibold hover:bg-pink-50"
            >
              Zurück zum Dashboard
            </button>
          </div>
        )}
      </main>

      {/* Custom Styles für Animationen */}
      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes bounce-in {
          0% { transform: scale(0.5); opacity: 0; }
          70% { transform: scale(1.05); }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
        .animate-bounce-in {
          animation: bounce-in 0.5s ease-out;
        }
      `}</style>
    </div>
  )
}
