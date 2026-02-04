import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { ArrowLeft, Award, Gamepad2, CheckCircle2, Trophy, RefreshCw, HelpCircle, Download, ExternalLink } from 'lucide-react'

// LearningApps URL - Steuern Grundwissen (Kontext Individualbesteuerung)
const LEARNING_APP_EMBED_URL = 'https://LearningApps.org/show?id=p8z71p6tc26&fullscreen=1'

// H5P Quiz - Multiple Choice zum Eigenmietwert
const H5P_QUIZ_URL = '/h5p-quiz/index.html'

export default function SpielerischPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [totalScore, setTotalScore] = useState(0)
  const [completedSections, setCompletedSections] = useState<Set<string>>(new Set())

  // LearningApp State
  const [learningAppScore, setLearningAppScore] = useState<number | null>(null)
  const [learningAppCompleted, setLearningAppCompleted] = useState(false)

  // H5P State
  const [h5pScore, setH5pScore] = useState<number | null>(null)
  const [h5pCompleted, setH5pCompleted] = useState(false)

  // UI State
  const [showCelebration, setShowCelebration] = useState(false)
  const [celebrationText, setCelebrationText] = useState('')

  const maxPointsLearningApp = 70
  const maxPointsH5P = 30
  const maxPoints = maxPointsLearningApp + maxPointsH5P

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
              setLearningAppCompleted(true)
              setLearningAppScore(data.learningAppScore || 100)
            }
            if (data.completedSections?.includes('h5p')) {
              setH5pCompleted(true)
              setH5pScore(data.h5pScore || 100)
            }
          }
        }
      } catch (e) { console.error(e) }
      setLoading(false)
    }
    load()
  }, [router])

  // PostMessage Listener für beide Quiz-Typen
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      // LearningApps Nachrichten (String-Format)
      if (typeof event.data === 'string' && !learningAppCompleted) {
        const parts = event.data.split('|')
        const messageType = parts[0]

        if (messageType === 'AppSolved' || messageType === 'AppChecked') {
          let score = 100
          if (parts.length >= 3) {
            const parsedScore = parseInt(parts[2])
            if (!isNaN(parsedScore) && parsedScore > 0 && parsedScore <= 100) {
              score = parsedScore
            }
          }

          setLearningAppScore(score)
          setLearningAppCompleted(true)
          setCelebrationText(`LearningApp Quiz mit ${score}% abgeschlossen!`)
          setShowCelebration(true)

          const earnedPoints = Math.round((score / 100) * maxPointsLearningApp)
          await saveProgress('learningapp', earnedPoints, score)

          setTimeout(() => setShowCelebration(false), 3000)
        }
      }

      // H5P Nachrichten (Object-Format)
      if (typeof event.data === 'object' && event.data?.type === 'H5P_COMPLETED' && !h5pCompleted) {
        const score = event.data.score || 100

        setH5pScore(score)
        setH5pCompleted(true)
        setCelebrationText(`H5P Quiz mit ${score}% abgeschlossen!`)
        setShowCelebration(true)

        const earnedPoints = Math.round((score / 100) * maxPointsH5P)
        await saveProgress('h5p', earnedPoints, score)

        setTimeout(() => setShowCelebration(false), 3000)
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [learningAppCompleted, h5pCompleted])

  const saveProgress = async (quizType: 'learningapp' | 'h5p', earnedPoints: number, quizScore: number) => {
    const user = auth.currentUser
    if (!user) return

    try {
      const userRef = doc(db, 'users', user.uid)
      const userDoc = await getDoc(userRef)

      if (userDoc.exists()) {
        const userData = userDoc.data()
        const modules = userData.modules || {}
        const existingData = modules.spielerisch || {}
        const existingCompleted = existingData.completedSections || []

        // Neue completed sections
        const newCompleted = Array.from(new Set([...existingCompleted, quizType]))

        // Scores berechnen
        let newLearningAppScore = quizType === 'learningapp' ? quizScore : (existingData.learningAppScore || 0)
        let newH5pScore = quizType === 'h5p' ? quizScore : (existingData.h5pScore || 0)

        // Punkte berechnen
        const learningAppPoints = newCompleted.includes('learningapp')
          ? Math.round((newLearningAppScore / 100) * maxPointsLearningApp)
          : 0
        const h5pPoints = newCompleted.includes('h5p')
          ? Math.round((newH5pScore / 100) * maxPointsH5P)
          : 0
        const newTotalScore = learningAppPoints + h5pPoints

        const allQuizzesDone = newCompleted.includes('learningapp') && newCompleted.includes('h5p')

        modules.spielerisch = {
          completed: allQuizzesDone,
          score: newTotalScore,
          learningAppScore: newLearningAppScore,
          h5pScore: newH5pScore,
          progress: allQuizzesDone ? 100 : 50,
          completedSections: newCompleted,
          lastUpdated: new Date().toISOString()
        }

        setTotalScore(newTotalScore)
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

  const resetQuiz = async (quizType: 'learningapp' | 'h5p' | 'all') => {
    const user = auth.currentUser
    if (!user) return

    try {
      const userRef = doc(db, 'users', user.uid)
      const userDoc = await getDoc(userRef)

      if (userDoc.exists()) {
        const userData = userDoc.data()
        const modules = userData.modules || {}
        const existingData = modules.spielerisch || {}

        let newCompleted = existingData.completedSections || []
        let newLearningAppScore = existingData.learningAppScore || 0
        let newH5pScore = existingData.h5pScore || 0

        if (quizType === 'learningapp' || quizType === 'all') {
          newCompleted = newCompleted.filter((s: string) => s !== 'learningapp')
          newLearningAppScore = 0
          setLearningAppCompleted(false)
          setLearningAppScore(null)
        }

        if (quizType === 'h5p' || quizType === 'all') {
          newCompleted = newCompleted.filter((s: string) => s !== 'h5p')
          newH5pScore = 0
          setH5pCompleted(false)
          setH5pScore(null)
        }

        // Punkte neu berechnen
        const learningAppPoints = newCompleted.includes('learningapp')
          ? Math.round((newLearningAppScore / 100) * maxPointsLearningApp)
          : 0
        const h5pPoints = newCompleted.includes('h5p')
          ? Math.round((newH5pScore / 100) * maxPointsH5P)
          : 0
        const newTotalScore = learningAppPoints + h5pPoints

        modules.spielerisch = {
          completed: newCompleted.includes('learningapp') && newCompleted.includes('h5p'),
          score: newTotalScore,
          learningAppScore: newLearningAppScore,
          h5pScore: newH5pScore,
          progress: newCompleted.length === 2 ? 100 : (newCompleted.length === 1 ? 50 : 0),
          completedSections: newCompleted,
          lastUpdated: new Date().toISOString()
        }

        setTotalScore(newTotalScore)
        setCompletedSections(new Set(newCompleted))

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

  const allCompleted = learningAppCompleted && h5pCompleted

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-orange-50">
      {/* Celebration Overlay */}
      {showCelebration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-fade-in">
          <div className="bg-white rounded-2xl p-8 text-center shadow-2xl animate-bounce-in max-w-md mx-4">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Geschafft!</h2>
            <p className="text-gray-600 mb-4">{celebrationText}</p>
            <div className="flex items-center justify-center gap-2 text-lg font-semibold text-green-600">
              <Trophy className="h-6 w-6" />
              <span>Punkte gesammelt!</span>
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
              {allCompleted && (
                <div className="flex items-center gap-1 text-sm bg-green-400/30 px-2 py-1 rounded-full">
                  <CheckCircle2 className="h-3 w-3" />
                  <span className="text-xs">Komplett</span>
                </div>
              )}
            </div>
          </div>
          <h1 className="text-xl font-bold mt-2">5. Spielerisch lernen</h1>
          <p className="text-pink-200 text-sm">Interaktive Quizze zur Individualbesteuerung</p>
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
              <h3 className="font-bold text-gray-900 mb-2">Zwei interaktive Quizze</h3>
              <p className="text-gray-700">
                Testen Sie Ihr Wissen mit zwei verschiedenen Quiz-Formaten.
                Sammeln Sie bis zu <strong>{maxPoints} Punkte</strong>!
              </p>
              <div className="flex gap-4 mt-3 text-sm">
                <span className="flex items-center gap-1 text-pink-600">
                  <Gamepad2 className="h-4 w-4" /> Quiz 1: {maxPointsLearningApp}P
                </span>
                <span className="flex items-center gap-1 text-purple-600">
                  <HelpCircle className="h-4 w-4" /> Quiz 2: {maxPointsH5P}P
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Fortschrittsanzeige */}
        {(learningAppCompleted || h5pCompleted) && (
          <div className={`rounded-xl p-6 text-white ${allCompleted ? 'bg-gradient-to-r from-green-500 to-emerald-600' : 'bg-gradient-to-r from-amber-500 to-orange-500'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-white/20 p-3 rounded-xl">
                  <Trophy className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">
                    {allCompleted ? 'Alle Quizze abgeschlossen!' : 'Fortschritt'}
                  </h3>
                  <p className="text-white/80">
                    {learningAppCompleted && <span>Quiz 1: {learningAppScore}% ✓</span>}
                    {learningAppCompleted && h5pCompleted && <span> • </span>}
                    {h5pCompleted && <span>Quiz 2: {h5pScore}% ✓</span>}
                    {!learningAppCompleted && <span>Quiz 1: ausstehend</span>}
                    {!h5pCompleted && learningAppCompleted && <span> • Quiz 2: ausstehend</span>}
                  </p>
                  <p className="font-bold mt-1">Total: {totalScore}/{maxPoints} Punkte</p>
                </div>
              </div>
              <button
                onClick={() => resetQuiz('all')}
                className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Zurücksetzen</span>
              </button>
            </div>
          </div>
        )}

        {/* Quiz 1: LearningApp */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="bg-pink-50 p-4 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-pink-600 p-2 rounded-lg">
                  <Gamepad2 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Quiz 1: Steuern - Grundwissen</h3>
                  <p className="text-sm text-gray-500">LearningApps • max. {maxPointsLearningApp} Punkte</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {learningAppCompleted && (
                  <>
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      {Math.round((learningAppScore || 0) / 100 * maxPointsLearningApp)}P
                    </span>
                    <button
                      onClick={() => resetQuiz('learningapp')}
                      className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                    >
                      <RefreshCw className="h-3 w-3" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="relative" style={{ paddingBottom: '75%', height: 0 }}>
            <iframe
              src={LEARNING_APP_EMBED_URL}
              className="absolute top-0 left-0 w-full h-full border-0"
              allow="fullscreen"
              title="Steuern - Grundwissen (LearningApp)"
            />
          </div>

          <div className="p-3 bg-gray-50 border-t">
            <p className="text-xs text-gray-500 text-center">
              💡 Lösen Sie alle Aufgaben. Ergebnisse werden automatisch erfasst.
            </p>
          </div>
        </div>

        {/* Quiz 2: H5P Multiple Choice */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="bg-purple-50 p-4 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-purple-600 p-2 rounded-lg">
                  <HelpCircle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Quiz 2: Eigenmietwert</h3>
                  <p className="text-sm text-gray-500">Multiple Choice • max. {maxPointsH5P} Punkte</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {h5pCompleted && (
                  <>
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      {Math.round((h5pScore || 0) / 100 * maxPointsH5P)}P
                    </span>
                    <button
                      onClick={() => resetQuiz('h5p')}
                      className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                    >
                      <RefreshCw className="h-3 w-3" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* H5P Content - besser formatiert */}
          <div className="p-6 bg-gradient-to-b from-purple-50/50 to-white">
            <div className="max-w-2xl mx-auto">
              <div className="bg-white rounded-xl shadow-md border border-purple-100 overflow-hidden">
                <iframe
                  src={H5P_QUIZ_URL}
                  className="w-full border-0"
                  style={{ minHeight: '350px', height: 'auto' }}
                  allow="fullscreen"
                  title="Eigenmietwert Multiple Choice (H5P)"
                />
              </div>
            </div>
          </div>

          {/* Footer mit Hinweis und Download */}
          <div className="p-4 bg-gray-50 border-t">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-xs text-gray-500">
                💡 Wählen Sie die korrekten Antworten aus. Ergebnisse werden automatisch erfasst.
              </p>
              <div className="flex items-center gap-2">
                <a
                  href="/h5p-quiz/index.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-800 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
                >
                  <ExternalLink className="h-3 w-3" />
                  <span>Im neuen Tab öffnen</span>
                </a>
                <a
                  href="/h5p-quiz-download/eigenmietwert-quiz.h5p"
                  download="eigenmietwert-quiz.h5p"
                  className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-800 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
                >
                  <Download className="h-3 w-3" />
                  <span>H5P herunterladen</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Abschluss-Button */}
        {allCompleted && (
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
