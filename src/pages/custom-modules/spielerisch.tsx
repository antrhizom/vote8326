import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/router'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'
import { auth, db } from '@/lib/firebase'
import { ArrowLeft, Award, Gamepad2, CheckCircle2, Trophy, RefreshCw, ClipboardCheck, Glasses, X } from 'lucide-react'
import MillionenSpiel from '@/components/MillionenSpiel'
import Lernkontrolle from '@/components/Lernkontrolle'

export default function SpielerischPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [totalScore, setTotalScore] = useState(0)
  const [completedSections, setCompletedSections] = useState<Set<string>>(new Set())
  const [userId, setUserId] = useState<string | null>(null)

  // Millionenspiel State
  const [millionenspielScore, setMillionenspielScore] = useState<number | null>(null)
  const [millionenspielCompleted, setMillionenspielCompleted] = useState(false)

  // Lernkontrolle State
  const [lernkontrolleScore, setLernkontrolleScore] = useState<number | null>(null)
  const [lernkontrolleCompleted, setLernkontrolleCompleted] = useState(false)

  // UI State
  const [showCelebration, setShowCelebration] = useState(false)
  const [celebrationText, setCelebrationText] = useState('')

  // Lesehilfe State
  const [readingHelpActive, setReadingHelpActive] = useState(false)
  const [currentReadingIndex, setCurrentReadingIndex] = useState(0)
  const [readingHelpPosition, setReadingHelpPosition] = useState<{ top: number } | null>(null)

  // Ref um userId in Callbacks zu verwenden
  const userIdRef = useRef<string | null>(null)

  const maxPointsMillionenspiel = 50
  const maxPointsLernkontrolle = 50
  const maxPoints = maxPointsMillionenspiel + maxPointsLernkontrolle

  // Lesehilfe Targets
  const READING_TARGETS = [
    { id: 'intro-text', label: '📖 Einführung', description: 'Modul-Überblick' },
    { id: 'millionenspiel-card', label: '🎮 Aufgabe 1', description: 'Millionenspiel' },
    { id: 'lernkontrolle-card', label: '📝 Aufgabe 2', description: 'Lernkontrolle' },
  ]

  const navigateReadingHelp = () => {
    if (!readingHelpActive) {
      setReadingHelpActive(true)
      setCurrentReadingIndex(0)
      scrollToReadingTarget(0)
    } else {
      const nextIndex = (currentReadingIndex + 1) % READING_TARGETS.length
      setCurrentReadingIndex(nextIndex)
      scrollToReadingTarget(nextIndex)
    }
  }

  const scrollToReadingTarget = (index: number) => {
    const target = READING_TARGETS[index]
    if (target) {
      const element = document.getElementById(target.id)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }
  }

  const closeReadingHelp = () => {
    setReadingHelpActive(false)
    setCurrentReadingIndex(0)
    setReadingHelpPosition(null)
  }

  // Navigation mit Lesehilfe-Check
  const handleNavigate = (path: string) => {
    if (readingHelpActive) {
      closeReadingHelp()
      alert('Lesehilfe wurde geschlossen. Klicken Sie erneut, um zu navigieren.')
      return
    }
    router.push(path)
  }

  useEffect(() => {
    const updatePosition = () => {
      if (readingHelpActive && READING_TARGETS[currentReadingIndex]) {
        const element = document.getElementById(READING_TARGETS[currentReadingIndex].id)
        if (element) {
          const rect = element.getBoundingClientRect()
          const targetTop = rect.top + (rect.height / 2) - 30
          const clampedTop = Math.max(80, Math.min(targetTop, window.innerHeight - 100))
          setReadingHelpPosition({ top: clampedTop })
        }
      } else {
        setReadingHelpPosition(null)
      }
    }
    updatePosition()
    if (readingHelpActive) {
      window.addEventListener('scroll', updatePosition)
      return () => window.removeEventListener('scroll', updatePosition)
    }
  }, [readingHelpActive, currentReadingIndex])

  // Lesehilfe Styles
  const readingHelpStyles = `
    .reading-highlight-box {
      position: relative;
      box-shadow: 0 0 0 4px #f59e0b, 0 0 20px rgba(245, 158, 11, 0.4) !important;
      border-radius: 12px;
      animation: reading-pulse 2s ease-in-out infinite;
    }
    .reading-highlight-box::before {
      content: attr(data-reading-label);
      position: absolute;
      top: -12px;
      left: 12px;
      background: linear-gradient(135deg, #f59e0b, #d97706);
      color: white;
      font-size: 11px;
      font-weight: 700;
      padding: 4px 12px;
      border-radius: 6px;
      z-index: 10;
      white-space: nowrap;
    }
    @keyframes reading-pulse {
      0%, 100% { box-shadow: 0 0 0 4px #f59e0b, 0 0 20px rgba(245, 158, 11, 0.4); }
      50% { box-shadow: 0 0 0 6px #f59e0b, 0 0 35px rgba(245, 158, 11, 0.6); }
    }
  `

  // Auth State Listener - wartet auf Authentifizierung
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/')
        return
      }

      setUserId(user.uid)
      userIdRef.current = user.uid

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid))
        if (userDoc.exists()) {
          const data = userDoc.data().modules?.spielerisch
          if (data) {
            setTotalScore(data.score || 0)
            setCompletedSections(new Set(data.completedSections || []))

            if (data.completedSections?.includes('millionenspiel')) {
              setMillionenspielCompleted(true)
              setMillionenspielScore(data.millionenspielScore || 100)
            }
            if (data.completedSections?.includes('quizslides')) {
              setLernkontrolleCompleted(true)
              setLernkontrolleScore(data.lernkontrolleScore || 100)
            }
          }
        }
      } catch (e) { console.error('Fehler beim Laden der Daten:', e) }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [router])

  const handleMillionenspielComplete = async (score: number) => {
    if (!millionenspielCompleted || score !== millionenspielScore) {
      setMillionenspielScore(score)
      setMillionenspielCompleted(true)
      setCelebrationText(`Millionenspiel mit ${score}% abgeschlossen!`)
      setShowCelebration(true)

      const earnedPoints = Math.round((score / 100) * maxPointsMillionenspiel)
      await saveProgress('millionenspiel', earnedPoints, score)

      setTimeout(() => setShowCelebration(false), 3000)
    }
  }

  const handleLernkontrolleComplete = async (score: number) => {
    if (!lernkontrolleCompleted || score !== lernkontrolleScore) {
      setLernkontrolleScore(score)
      setLernkontrolleCompleted(true)
      setCelebrationText(`Lernkontrolle mit ${score}% abgeschlossen!`)
      setShowCelebration(true)

      const earnedPoints = Math.round((score / 100) * maxPointsLernkontrolle)
      await saveProgress('quizslides', earnedPoints, score)

      setTimeout(() => setShowCelebration(false), 3000)
    }
  }

  const saveProgress = async (quizType: 'millionenspiel' | 'quizslides', earnedPoints: number, quizScore: number) => {
    const currentUserId = userIdRef.current || auth.currentUser?.uid
    if (!currentUserId) {
      console.error('Kein Benutzer angemeldet - kann Fortschritt nicht speichern')
      return
    }

    console.log('Speichere Fortschritt für Quiz:', quizType, 'Score:', quizScore, 'User:', currentUserId)

    try {
      const userRef = doc(db, 'users', currentUserId)
      const userDoc = await getDoc(userRef)

      if (userDoc.exists()) {
        const userData = userDoc.data()
        const modules = userData.modules || {}
        const existingData = modules.spielerisch || {}
        const existingCompleted = existingData.completedSections || []

        // Neue completed sections
        const newCompleted = Array.from(new Set([...existingCompleted, quizType]))

        // Scores berechnen
        let newMillionenspielScore = quizType === 'millionenspiel' ? quizScore : (existingData.millionenspielScore || 0)
        let newLernkontrolleScore = quizType === 'quizslides' ? quizScore : (existingData.lernkontrolleScore || 0)

        // Punkte berechnen
        const millionenspielPoints = newCompleted.includes('millionenspiel')
          ? Math.round((newMillionenspielScore / 100) * maxPointsMillionenspiel)
          : 0
        const lernkontrollePoints = newCompleted.includes('quizslides')
          ? Math.round((newLernkontrolleScore / 100) * maxPointsLernkontrolle)
          : 0
        const newTotalScore = millionenspielPoints + lernkontrollePoints

        const allQuizzesDone = newCompleted.includes('millionenspiel') && newCompleted.includes('quizslides')

        modules.spielerisch = {
          completed: allQuizzesDone,
          score: newTotalScore,
          millionenspielScore: newMillionenspielScore,
          lernkontrolleScore: newLernkontrolleScore,
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
        console.log('Fortschritt erfolgreich in Firebase gespeichert!')
      }
    } catch (e) {
      console.error('Fehler beim Speichern des Fortschritts:', e)
    }
  }

  const resetQuiz = async (quizType: 'millionenspiel' | 'quizslides' | 'all') => {
    const currentUserId = userIdRef.current || auth.currentUser?.uid
    if (!currentUserId) return

    try {
      const userRef = doc(db, 'users', currentUserId)
      const userDoc = await getDoc(userRef)

      if (userDoc.exists()) {
        const userData = userDoc.data()
        const modules = userData.modules || {}
        const existingData = modules.spielerisch || {}

        let newCompleted = existingData.completedSections || []
        let newMillionenspielScore = existingData.millionenspielScore || 0
        let newLernkontrolleScore = existingData.lernkontrolleScore || 0

        if (quizType === 'millionenspiel' || quizType === 'all') {
          newCompleted = newCompleted.filter((s: string) => s !== 'millionenspiel')
          newMillionenspielScore = 0
          setMillionenspielCompleted(false)
          setMillionenspielScore(null)
        }

        if (quizType === 'quizslides' || quizType === 'all') {
          newCompleted = newCompleted.filter((s: string) => s !== 'quizslides')
          newLernkontrolleScore = 0
          setLernkontrolleCompleted(false)
          setLernkontrolleScore(null)
        }

        // Punkte neu berechnen
        const millionenspielPoints = newCompleted.includes('millionenspiel')
          ? Math.round((newMillionenspielScore / 100) * maxPointsMillionenspiel)
          : 0
        const lernkontrollePoints = newCompleted.includes('quizslides')
          ? Math.round((newLernkontrolleScore / 100) * maxPointsLernkontrolle)
          : 0
        const newTotalScore = millionenspielPoints + lernkontrollePoints

        modules.spielerisch = {
          completed: newCompleted.includes('millionenspiel') && newCompleted.includes('quizslides'),
          score: newTotalScore,
          millionenspielScore: newMillionenspielScore,
          lernkontrolleScore: newLernkontrolleScore,
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

  const allCompleted = millionenspielCompleted && lernkontrolleCompleted

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-orange-50">
      <style dangerouslySetInnerHTML={{ __html: readingHelpStyles }} />

      {/* Lesehilfe Button */}
      <div
        className="fixed z-30 right-4 transition-all duration-300 ease-out"
        style={{
          top: readingHelpActive && readingHelpPosition ? `${readingHelpPosition.top}px` : 'auto',
          bottom: readingHelpActive && readingHelpPosition ? 'auto' : '2rem'
        }}
      >
        <div className="relative">
          <button
            onClick={navigateReadingHelp}
            className={`p-4 rounded-full shadow-lg hover:shadow-xl transition-all ${
              readingHelpActive
                ? 'bg-amber-500 hover:bg-amber-600 text-white ring-4 ring-amber-300'
                : 'bg-white hover:bg-amber-50 text-amber-600 border-2 border-amber-300'
            }`}
          >
            <Glasses className="h-6 w-6" />
          </button>
          {readingHelpActive && (
            <>
              <div className="absolute -top-2 -right-2 bg-amber-600 text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[2.5rem] text-center shadow-md animate-pulse">
                {currentReadingIndex + 1}/{READING_TARGETS.length}
              </div>
              <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-amber-600 text-white text-sm px-3 py-2 rounded-lg shadow-lg max-w-[180px]">
                <div className="font-semibold text-xs">{READING_TARGETS[currentReadingIndex]?.label}</div>
                <div className="text-[10px] text-amber-200 mt-0.5">{READING_TARGETS[currentReadingIndex]?.description}</div>
                <div className="text-[10px] text-amber-300 mt-1">Klicken → weiter</div>
                <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full">
                  <div className="border-8 border-transparent border-l-amber-600"></div>
                </div>
              </div>
              <button onClick={(e) => { e.stopPropagation(); closeReadingHelp(); }} className="absolute -top-1 -left-1 bg-gray-700 hover:bg-gray-800 text-white rounded-full p-1 shadow-md">
                <X className="h-3 w-3" />
              </button>
            </>
          )}
        </div>
      </div>

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
            <button onClick={() => handleNavigate('/dashboard')} className="flex items-center gap-1 text-white/80 hover:text-white text-sm">
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
        {/* Lesehilfe Banner */}
        {readingHelpActive && (
          <div className="bg-amber-100 border border-amber-300 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Glasses className="h-6 w-6 text-amber-600" />
              <div>
                <p className="text-amber-800 font-semibold text-sm">
                  Lesehilfe: <span className="bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full ml-1">{currentReadingIndex + 1}/{READING_TARGETS.length}</span>
                </p>
                <p className="text-amber-700 text-xs">{READING_TARGETS[currentReadingIndex]?.label} — {READING_TARGETS[currentReadingIndex]?.description}</p>
              </div>
            </div>
            <button onClick={closeReadingHelp} className="text-amber-600 hover:text-amber-800"><X className="h-5 w-5" /></button>
          </div>
        )}

        {/* Einleitung */}
        <div
          id="intro-text"
          className={`bg-white rounded-xl shadow-sm p-6 transition-all ${readingHelpActive && currentReadingIndex === 0 ? 'reading-highlight-box' : ''}`}
          data-reading-label="📖 Einführung"
        >
          <div className="flex items-start gap-4">
            <div className="bg-pink-100 p-3 rounded-xl">
              <Gamepad2 className="h-6 w-6 text-pink-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-2">Zwei interaktive Quizze</h3>
              <p className="text-gray-700 mb-2">
                Testen Sie Ihr Wissen zur Individualbesteuerung mit zwei verschiedenen Quiz-Formaten.
                Sammeln Sie bis zu <strong>{maxPoints} Punkte</strong>! Beide Quizze fragen Wissen aus allen
                bisherigen Modulen ab – eine ideale Vorbereitung auf die Abstimmung.
              </p>
              <p className="text-gray-700 mb-3">
                Das <strong>Millionenspiel</strong> fordert Sie mit 7 Fragen mit steigendem Schwierigkeitsgrad heraus –
                nutzen Sie die Joker ab Stufe 3, um schwierige Fragen zu meistern! Die <strong>Lernkontrolle</strong> 
                 testet Ihr Wissen mit 10 Fragen und bietet ausführliche Erklärungen zu jeder Antwort – so lernen Sie
                auch aus Fehlern.
              </p>
              <p className="text-gray-700 text-sm italic">
                <strong>Beispiel-Frage:</strong> Wie viele zusätzliche Steuererklärungen würde es bei einer Annahme geben?
                A) 500'000 B) 1,7 Millionen C) 3 Millionen D) 140'000 – Tipp: Es sind mehr als eine Million!
              </p>
              <div className="flex gap-4 mt-3 text-sm">
                <span className="flex items-center gap-1 text-purple-600">
                  <Gamepad2 className="h-4 w-4" /> Millionenspiel: {maxPointsMillionenspiel}P
                </span>
                <span className="flex items-center gap-1 text-teal-600">
                  <ClipboardCheck className="h-4 w-4" /> Lernkontrolle: {maxPointsLernkontrolle}P
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Fortschrittsanzeige */}
        {(millionenspielCompleted || lernkontrolleCompleted) && (
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
                    {millionenspielCompleted && <span>Millionenspiel: {millionenspielScore}% ✓</span>}
                    {millionenspielCompleted && lernkontrolleCompleted && <span> • </span>}
                    {lernkontrolleCompleted && <span>Lernkontrolle: {lernkontrolleScore}% ✓</span>}
                    {!millionenspielCompleted && <span>Millionenspiel: ausstehend</span>}
                    {!lernkontrolleCompleted && millionenspielCompleted && <span> • Lernkontrolle: ausstehend</span>}
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

        {/* Quiz 1: Millionenspiel */}
        <div
          id="millionenspiel-card"
          className={`bg-white rounded-xl shadow-sm overflow-hidden transition-all ${readingHelpActive && currentReadingIndex === 1 ? 'reading-highlight-box' : ''}`}
          data-reading-label="🎮 Aufgabe 1"
        >
          <div className="bg-purple-50 p-4 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-purple-600 p-2 rounded-lg">
                  <Gamepad2 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Quiz 1: Millionenspiel</h3>
                  <p className="text-sm text-gray-500">7 Fragen mit steigendem Schwierigkeitsgrad • Joker ab Stufe 3 • max. {maxPointsMillionenspiel} Punkte</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {millionenspielCompleted && (
                  <>
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      {millionenspielScore}% ({Math.round((millionenspielScore || 0) / 100 * maxPointsMillionenspiel)}P)
                    </span>
                    <button
                      onClick={() => resetQuiz('millionenspiel')}
                      className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                      title="Quiz wiederholen"
                    >
                      <RefreshCw className="h-3 w-3" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="p-4">
            <MillionenSpiel
              onComplete={handleMillionenspielComplete}
              onReset={() => resetQuiz('millionenspiel')}
              initialCompleted={millionenspielCompleted}
              initialScore={millionenspielScore || undefined}
            />
          </div>
        </div>

        {/* Quiz 2: Lernkontrolle */}
        <div
          id="lernkontrolle-card"
          className={`bg-white rounded-xl shadow-sm overflow-hidden transition-all ${readingHelpActive && currentReadingIndex === 2 ? 'reading-highlight-box' : ''}`}
          data-reading-label="📝 Aufgabe 2"
        >
          <div className="bg-teal-50 p-4 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-teal-600 p-2 rounded-lg">
                  <ClipboardCheck className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Quiz 2: Lernkontrolle</h3>
                  <p className="text-sm text-gray-500">10 Fragen mit ausführlichen Erklärungen • max. {maxPointsLernkontrolle} Punkte</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {lernkontrolleCompleted && (
                  <>
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      {lernkontrolleScore}% ({Math.round((lernkontrolleScore || 0) / 100 * maxPointsLernkontrolle)}P)
                    </span>
                    <button
                      onClick={() => resetQuiz('quizslides')}
                      className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                      title="Quiz wiederholen"
                    >
                      <RefreshCw className="h-3 w-3" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="p-4">
            <Lernkontrolle
              onComplete={handleLernkontrolleComplete}
              onReset={() => resetQuiz('quizslides')}
              initialCompleted={lernkontrolleCompleted}
              initialScore={lernkontrolleScore || undefined}
            />
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
              onClick={() => handleNavigate('/dashboard')}
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
