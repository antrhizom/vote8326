import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { doc, updateDoc, getDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import {
  ArrowLeft, CheckCircle2, Award, ChevronDown, ChevronUp, X,
  Vote, Film, ExternalLink, BarChart3, Scale, Building2,
  Users, Calendar, Sparkles, Star, Lightbulb, ArrowRight, Info, Glasses
} from 'lucide-react'

// Tutorial Steps für das Ausgangslage-Modul (Übersicht) - nur für erste Seite
const TUTORIAL_STEPS = [
  {
    id: 'welcome',
    title: 'Willkommen zum ersten Modul! 👋',
    description: 'Dieses Modul führt Sie Schritt für Schritt in die Abstimmung vom 8. März 2026 ein. Sie werden drei Kapitel durcharbeiten, die aufeinander aufbauen.',
    highlight: null,
    position: 'center'
  },
  {
    id: 'chapter1',
    title: '📊 Kapitel 1: Ihre Ausgangslage',
    description: 'Zuerst füllen Sie eine kurze Umfrage aus und reflektieren Ihre persönliche Situation.',
    highlight: 'chapter-survey',
    position: 'center'
  },
  {
    id: 'chapter2',
    title: '🗳️ Kapitel 2: Referendum verstehen',
    description: 'Im zweiten Kapitel lernen Sie, wie ein Referendum funktioniert und wie lange politische Prozesse dauern können.',
    highlight: 'chapter-referendum',
    position: 'center'
  },
  {
    id: 'chapter3',
    title: '🎬 Kapitel 3: Geschichte im Video',
    description: 'Im dritten Kapitel sehen Sie ein Erklärvideo zur Geschichte der Heiratsstrafe.',
    highlight: 'chapter-video',
    position: 'center'
  },
  {
    id: 'infoboxes',
    title: '📰 Wichtige Hintergrundinformationen',
    description: 'In den blauen und grünen Info-Boxen finden Sie aktuelle Zitate und Fakten aus Qualitätsmedien.',
    highlight: 'info-boxes',
    position: 'center'
  },
  {
    id: 'readinghelp',
    title: '👓 Lesehilfe aktivieren',
    description: 'Unten rechts finden Sie einen Brillen-Button. Klicken Sie darauf, um wichtige Texte hervorzuheben, die Sie lesen sollten.',
    highlight: 'reading-help-btn',
    position: 'center'
  },
  {
    id: 'start',
    title: 'Los geht\'s! 🚀',
    description: 'Klicken Sie auf Kapitel 1, um zu beginnen. Viel Erfolg!',
    highlight: null,
    position: 'center'
  }
]

// ===========================================
// AUSGANGSLAGE MODULE - KAPITEL-STRUKTUR
// ===========================================

type Chapter = 'survey' | 'referendum' | 'video' | null

export default function AusgangslagePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [activeChapter, setActiveChapter] = useState<Chapter>(null)
  const [completedSections, setCompletedSections] = useState<Set<string>>(new Set())
  const [totalScore, setTotalScore] = useState(0)
  const [bonusScore, setBonusScore] = useState(0)
  
  // Survey states
  const [surveyCompleted, setSurveyCompleted] = useState(false)
  const [resultsViewed, setResultsViewed] = useState(false)
  
  // Referendum states
  const [revealedCards, setRevealedCards] = useState<Set<string>>(new Set())
  const [timelineRevealed, setTimelineRevealed] = useState<Set<number>>(new Set())
  const [matchingAnswers, setMatchingAnswers] = useState<{[key: string]: string}>({})
  const [matchingSubmitted, setMatchingSubmitted] = useState(false)
  
  // Video states
  const [flippedCards, setFlippedCards] = useState<Set<number>>(new Set())
  const [videoQuizAnswers, setVideoQuizAnswers] = useState<{[key: string]: string}>({})
  const [videoQuizSubmitted, setVideoQuizSubmitted] = useState(false)

  // Tutorial states (nur für Übersicht)
  const [showTutorial, setShowTutorial] = useState(false)
  const [tutorialStep, setTutorialStep] = useState(0)

  // Lesehilfe state
  const [readingHelpActive, setReadingHelpActive] = useState(false)
  const [currentReadingIndex, setCurrentReadingIndex] = useState(0)

  // Lesehilfe Targets - definiert welche Elemente markiert werden sollen
  const READING_TARGETS = [
    { id: 'intro-text', label: '📖 Infotext' },
    { id: 'info-gegenvorschlag', label: '📰 Hintergrundinfo' },
    { id: 'info-profitiert', label: '📊 Fakten & Zahlen' },
  ]

  // Tutorial Position basierend auf hervorgehobenem Element
  const [tutorialTopOffset, setTutorialTopOffset] = useState<number | null>(null)

  // Effect um Tutorial-Position zu aktualisieren
  useEffect(() => {
    if (showTutorial && currentTutorialStep.highlight) {
      const element = document.getElementById(currentTutorialStep.highlight)
      if (element) {
        const rect = element.getBoundingClientRect()
        const viewportHeight = window.innerHeight
        // Position das Tutorial-Panel so, dass es auf gleicher Höhe wie das hervorgehobene Element ist
        const targetTop = Math.max(80, Math.min(rect.top, viewportHeight - 400))
        setTutorialTopOffset(targetTop)
      } else {
        setTutorialTopOffset(null)
      }
    } else {
      setTutorialTopOffset(null)
    }
  }, [showTutorial, tutorialStep, currentTutorialStep.highlight])

  // Lesehilfe Navigation
  const navigateReadingHelp = () => {
    if (!readingHelpActive) {
      // Lesehilfe aktivieren und zum ersten Element scrollen
      setReadingHelpActive(true)
      setCurrentReadingIndex(0)
      scrollToReadingTarget(0)
    } else {
      // Zum nächsten Element navigieren
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

  // Lesehilfe Button Position - schwebt mit dem aktuellen Element
  const [readingHelpPosition, setReadingHelpPosition] = useState<{ top: number } | null>(null)

  // Effect um Lesehilfe-Button Position zu aktualisieren
  useEffect(() => {
    const updatePosition = () => {
      if (readingHelpActive && READING_TARGETS[currentReadingIndex]) {
        const element = document.getElementById(READING_TARGETS[currentReadingIndex].id)
        if (element) {
          const rect = element.getBoundingClientRect()
          // Position den Button neben dem aktuellen Element (viewport-relativ)
          const targetTop = rect.top + (rect.height / 2) - 30
          // Begrenze auf sichtbaren Bereich
          const clampedTop = Math.max(80, Math.min(targetTop, window.innerHeight - 100))
          setReadingHelpPosition({ top: clampedTop })
        }
      } else {
        setReadingHelpPosition(null)
      }
    }

    updatePosition()

    // Auch bei Scroll aktualisieren
    if (readingHelpActive) {
      window.addEventListener('scroll', updatePosition)
      return () => window.removeEventListener('scroll', updatePosition)
    }
  }, [readingHelpActive, currentReadingIndex])

  const maxPoints = 150

  useEffect(() => {
    const load = async () => {
      const user = auth.currentUser
      if (!user) { router.push('/'); return }
      
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid))
        if (userDoc.exists()) {
          const data = userDoc.data().modules?.ausgangslage
          if (data) {
            setTotalScore(data.score || 0)
            setBonusScore(data.bonusScore || 0)
            setCompletedSections(new Set(data.completedSections || []))
          } else {
            // Neuer User - Tutorial anzeigen
            const tutorialSeen = localStorage.getItem('ausgangslage_tutorial_seen')
            if (!tutorialSeen) {
              setShowTutorial(true)
            }
          }
        } else {
          // Neuer User - Tutorial anzeigen
          const tutorialSeen = localStorage.getItem('ausgangslage_tutorial_seen')
          if (!tutorialSeen) {
            setShowTutorial(true)
          }
        }
      } catch (e) { console.error(e) }
      setLoading(false)
    }
    load()
  }, [router])

  const completeSection = async (sectionId: string, points: number, isBonus: boolean = false) => {
    if (completedSections.has(sectionId)) return
    
    const newCompleted = new Set(completedSections)
    newCompleted.add(sectionId)
    setCompletedSections(newCompleted)
    
    let newScore = totalScore
    let newBonus = bonusScore
    
    if (isBonus) {
      newBonus += points
      setBonusScore(newBonus)
    } else {
      newScore += points
      setTotalScore(newScore)
    }
    
    await saveProgress(newScore, newBonus, Array.from(newCompleted))
  }

  const saveProgress = async (score: number, bonus: number, completed: string[]) => {
    const user = auth.currentUser
    if (!user) return
    
    try {
      const userRef = doc(db, 'users', user.uid)
      const userDoc = await getDoc(userRef)
      
      if (userDoc.exists()) {
        const userData = userDoc.data()
        const modules = userData.modules || {}
        
        const requiredSections = ['survey', 'results', 'referendum_info', 'timeline', 'matching', 'flipcards', 'videoquiz']
        const allComplete = requiredSections.every(s => completed.includes(s))
        
        modules.ausgangslage = {
          completed: allComplete,
          score,
          bonusScore: bonus,
          progress: Math.round((score / maxPoints) * 100),
          completedSections: completed,
          lastUpdated: new Date().toISOString()
        }
        
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

  const getChapterProgress = (chapter: Chapter) => {
    switch (chapter) {
      case 'survey':
        const surveyDone = completedSections.has('survey') && completedSections.has('results')
        return { done: surveyDone ? 2 : (completedSections.has('survey') ? 1 : 0), total: 2, points: surveyDone ? 30 : 0 }
      case 'referendum':
        const refDone = ['referendum_info', 'timeline', 'matching'].filter(s => completedSections.has(s)).length
        return { done: refDone, total: 3, points: refDone * 15 + (refDone >= 2 ? 5 : 0) }
      case 'video':
        const vidDone = ['flipcards', 'videoquiz'].filter(s => completedSections.has(s)).length
        return { done: vidDone, total: 2, points: (completedSections.has('flipcards') ? 15 : 0) + (completedSections.has('videoquiz') ? 30 : 0) }
      default:
        return { done: 0, total: 0, points: 0 }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    )
  }

  // CSS für Animationen
  const styles = `
    .flip-card {
      perspective: 1000px;
      cursor: pointer;
    }
    .flip-card-inner {
      position: relative;
      width: 100%;
      height: 100%;
      transition: transform 0.6s;
      transform-style: preserve-3d;
    }
    .flip-card.flipped .flip-card-inner {
      transform: rotateY(180deg);
    }
    .flip-card-front, .flip-card-back {
      position: absolute;
      width: 100%;
      height: 100%;
      backface-visibility: hidden;
      border-radius: 12px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 16px;
      text-align: center;
    }
    .flip-card-front {
      background: linear-gradient(135deg, #7c3aed, #8b5cf6);
      color: white;
    }
    .flip-card-back {
      background: white;
      border: 2px solid #7c3aed;
      color: #4c1d95;
      transform: rotateY(180deg);
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .fade-in {
      animation: fadeIn 0.3s ease-out;
    }
    /* Lesehilfe Styles */
    .reading-highlight-box {
      position: relative;
      box-shadow: 0 0 0 4px #f59e0b, 0 0 20px rgba(245, 158, 11, 0.4) !important;
      border-radius: 12px;
      transition: all 0.5s ease;
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
      box-shadow: 0 2px 8px rgba(245, 158, 11, 0.4);
    }
    @keyframes reading-pulse {
      0%, 100% { box-shadow: 0 0 0 4px #f59e0b, 0 0 20px rgba(245, 158, 11, 0.4); }
      50% { box-shadow: 0 0 0 6px #f59e0b, 0 0 35px rgba(245, 158, 11, 0.6); }
    }
  `

  // Tutorial-Funktionen
  const closeTutorial = () => {
    setShowTutorial(false)
    setTutorialStep(0)
    localStorage.setItem('ausgangslage_tutorial_seen', 'true')
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

  // ========== CHAPTER OVERVIEW ==========
  if (!activeChapter) {
    const surveyProgress = getChapterProgress('survey')
    const refProgress = getChapterProgress('referendum')
    const vidProgress = getChapterProgress('video')
    const isComplete = surveyProgress.done === 2 && refProgress.done === 3 && vidProgress.done === 2

    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50">
        <style dangerouslySetInnerHTML={{ __html: styles }} />

        {/* Tutorial Styles */}
        {showTutorial && (
          <style dangerouslySetInnerHTML={{ __html: `
            .tutorial-highlight {
              position: relative;
              z-index: 45;
              box-shadow: 0 0 0 4px #8b5cf6, 0 0 0 8px rgba(139, 92, 246, 0.3), 0 0 30px rgba(139, 92, 246, 0.4);
              border-radius: 12px;
              animation: pulse-highlight 2s ease-in-out infinite;
            }
            @keyframes pulse-highlight {
              0%, 100% { box-shadow: 0 0 0 4px #8b5cf6, 0 0 0 8px rgba(139, 92, 246, 0.3), 0 0 30px rgba(139, 92, 246, 0.4); }
              50% { box-shadow: 0 0 0 4px #8b5cf6, 0 0 0 12px rgba(139, 92, 246, 0.2), 0 0 40px rgba(139, 92, 246, 0.5); }
            }
          `}} />
        )}

        {/* Tutorial Overlay - Seitlich positioniert, schmal */}
        {showTutorial && (
          <div className="fixed inset-0 z-40 pointer-events-none">
            <div
              className="absolute inset-0 bg-black/30 pointer-events-auto"
              onClick={closeTutorial}
            />

            {/* Tutorial Panel - ganz links am Rand, schmal, dynamische Höhe */}
            <div
              className="fixed z-50 left-0 w-56 pointer-events-auto transition-all duration-300"
              style={{
                top: tutorialTopOffset !== null ? `${tutorialTopOffset}px` : '50%',
                transform: tutorialTopOffset !== null ? 'none' : 'translateY(-50%)'
              }}
            >
              <div className="bg-white rounded-r-xl shadow-2xl overflow-hidden flex flex-col border-l-4 border-purple-500">
                {/* Progress Bar */}
                <div className="h-1 bg-gray-200 flex-shrink-0">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-300"
                    style={{ width: `${((tutorialStep + 1) / TUTORIAL_STEPS.length) * 100}%` }}
                  />
                </div>

                {/* Header - kompakt */}
                <div className="bg-gradient-to-r from-purple-500 to-indigo-600 px-3 py-2 flex items-center justify-between flex-shrink-0">
                  <div className="flex items-center gap-1.5">
                    <Lightbulb className="h-4 w-4 text-white" />
                    <span className="text-white font-semibold text-xs">{tutorialStep + 1}/{TUTORIAL_STEPS.length}</span>
                  </div>
                  <button
                    onClick={closeTutorial}
                    className="p-0.5 text-white/70 hover:text-white"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Content - kompakt */}
                <div className="p-3 flex-1">
                  <h3 className="text-sm font-bold text-gray-900 mb-1.5 leading-tight">
                    {currentTutorialStep.title}
                  </h3>
                  <p className="text-gray-600 text-xs mb-3 leading-relaxed">
                    {currentTutorialStep.description}
                  </p>

                  {currentTutorialStep.highlight && (
                    <div className="bg-purple-50 border border-purple-200 rounded px-2 py-1.5 text-xs text-purple-700 flex items-center gap-1.5 mb-3">
                      <span>👉</span>
                      <span className="text-[10px]">Markiert</span>
                    </div>
                  )}
                </div>

                {/* Footer Buttons - kompakt */}
                <div className="px-3 pb-3 flex-shrink-0">
                  <div className="flex gap-1.5">
                    {tutorialStep > 0 && (
                      <button
                        onClick={prevTutorialStep}
                        className="flex-1 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded text-xs"
                      >
                        ←
                      </button>
                    )}
                    <button
                      onClick={nextTutorialStep}
                      className="flex-1 py-1.5 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-medium rounded text-xs flex items-center justify-center gap-1"
                    >
                      {tutorialStep === TUTORIAL_STEPS.length - 1 ? (
                        <>Start</>
                      ) : (
                        <>Weiter →</>
                      )}
                    </button>
                  </div>
                  <button
                    onClick={closeTutorial}
                    className="w-full mt-1.5 py-1 text-[10px] text-gray-400 hover:text-gray-600"
                  >
                    Überspringen
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Floating Lesehilfe Button - schwebt mit dem Element */}
        <div
          className="fixed z-30 right-4 transition-all duration-300 ease-out"
          style={{
            top: readingHelpActive && readingHelpPosition ? `${readingHelpPosition.top}px` : 'auto',
            bottom: readingHelpActive && readingHelpPosition ? 'auto' : '6rem'
          }}
        >
          <div className="relative">
            <button
              id="reading-help-btn"
              onClick={navigateReadingHelp}
              className={`p-4 rounded-full shadow-lg hover:shadow-xl transition-all group ${
                readingHelpActive
                  ? 'bg-amber-500 hover:bg-amber-600 text-white ring-4 ring-amber-300'
                  : 'bg-white hover:bg-amber-50 text-amber-600 border-2 border-amber-300'
              } ${showTutorial && currentTutorialStep.highlight === 'reading-help-btn' ? 'tutorial-highlight' : ''}`}
              title={readingHelpActive ? `${currentReadingIndex + 1}/${READING_TARGETS.length} - Klicken für nächstes` : 'Lesehilfe aktivieren'}
            >
              <Glasses className="h-6 w-6" />
            </button>

            {/* Zähler Badge */}
            {readingHelpActive && (
              <div className="absolute -top-2 -right-2 bg-amber-600 text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[2.5rem] text-center shadow-md animate-pulse">
                {currentReadingIndex + 1}/{READING_TARGETS.length}
              </div>
            )}

            {/* Tooltip mit aktuellem Label */}
            {readingHelpActive && (
              <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-amber-600 text-white text-sm px-3 py-2 rounded-lg shadow-lg whitespace-nowrap">
                <div className="font-semibold text-xs">{READING_TARGETS[currentReadingIndex]?.label}</div>
                <div className="text-[10px] text-amber-200 mt-0.5">Klicken → weiter</div>
                {/* Pfeil */}
                <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full">
                  <div className="border-8 border-transparent border-l-amber-600"></div>
                </div>
              </div>
            )}

            {/* Schliessen-Button wenn aktiv */}
            {readingHelpActive && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  closeReadingHelp()
                }}
                className="absolute -top-1 -left-1 bg-gray-700 hover:bg-gray-800 text-white rounded-full p-1 shadow-md"
                title="Lesehilfe beenden"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>

        {/* Help Button - unten rechts fixiert */}
        <div className="fixed bottom-6 right-6 z-30">
          <button
            onClick={() => {
              setTutorialStep(0)
              setShowTutorial(true)
            }}
            className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all group"
            title="Hilfe & Tutorial"
          >
            <Info className="h-6 w-6" />
            <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-sm px-3 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              Hilfe anzeigen
            </span>
          </button>
        </div>

        {/* Header */}
        <header className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between mb-2">
              <button onClick={() => router.push('/dashboard')} className="flex items-center gap-1 text-white/80 hover:text-white text-sm">
                <ArrowLeft className="h-5 w-5" /><span>Dashboard</span>
              </button>
              <div
                id="points-display"
                className={`flex items-center gap-3 ${showTutorial && currentTutorialStep.highlight === 'points-display' ? 'tutorial-highlight' : ''}`}
              >
                <div className="flex items-center gap-2 text-sm bg-white/20 px-3 py-1 rounded-full">
                  <Award className="h-4 w-4" />
                  <span className="font-semibold">{totalScore} / {maxPoints}</span>
                </div>
                {bonusScore > 0 && (
                  <div className="flex items-center gap-1 text-sm bg-yellow-400/30 px-2 py-1 rounded-full">
                    <Star className="h-3 w-3" />
                    <span className="text-xs">+{bonusScore}</span>
                  </div>
                )}
              </div>
            </div>
            <h1 className="text-2xl font-bold">1. Ausgangslage</h1>
            <p className="text-purple-200 text-sm mt-1">Abstimmung vom 8. März 2026 – Individualbesteuerung</p>
          </div>
        </header>

        <main className={`max-w-4xl mx-auto px-4 py-6 space-y-4 ${readingHelpActive ? 'reading-active' : ''}`}>
          {/* Lesehilfe Info-Banner */}
          {readingHelpActive && (
            <div className="bg-amber-100 border border-amber-300 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Glasses className="h-6 w-6 text-amber-600 flex-shrink-0" />
                <div>
                  <p className="text-amber-800 font-semibold text-sm flex items-center gap-2">
                    Lesehilfe aktiv
                    <span className="bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full">
                      {currentReadingIndex + 1}/{READING_TARGETS.length}
                    </span>
                  </p>
                  <p className="text-amber-700 text-xs">
                    Aktuell: <strong>{READING_TARGETS[currentReadingIndex]?.label}</strong> — Klicken Sie auf den Button rechts für den nächsten Bereich
                  </p>
                </div>
              </div>
              <button
                onClick={closeReadingHelp}
                className="text-amber-600 hover:text-amber-800 p-1"
                title="Lesehilfe beenden"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          )}

          {/* Intro Text */}
          <div
            id="intro-text"
            className={`bg-white rounded-xl p-6 shadow-sm transition-all ${readingHelpActive && currentReadingIndex === 0 ? 'reading-highlight-box' : ''}`}
            data-reading-label="📖 Infotext"
          >
            <p className="text-gray-700 mb-3">
              Bevor Sie in die Details der Abstimmung eintauchen, erkunden Sie Ihre <strong>persönliche Ausgangslage</strong>.
              In einer kurzen Umfrage reflektieren Sie Ihre eigene Situation – zum Beispiel: Wie werden Sie heute besteuert?
              Würde sich für Sie etwas ändern? Diese Selbstreflexion hilft Ihnen, die Abstimmungsvorlage aus Ihrer
              persönlichen Perspektive zu betrachten.
            </p>
            <p className="text-gray-700 mb-3">
              Anschliessend lernen Sie das <strong>Referendum und die Gesetzgebung</strong> als wichtige Instrumente der
              direkten Demokratie kennen. Sie erfahren, wie aus einer Idee ein Gesetz wird – und wie die Stimmberechtigten
              das letzte Wort haben können. Der interaktive <strong>Zeitstrahl</strong> zeigt Ihnen, wie lange der politische
              Prozess von der ersten Idee bis zur Volksabstimmung dauern kann – oft sind es Jahrzehnte!
            </p>
            <p className="text-gray-700">
              Schliesslich entdecken Sie die <strong>Geschichte der Heiratsstrafe</strong>: Seit 1984 ist das
              heutige System laut Bundesgericht verfassungswidrig – warum hat es über 40 Jahre gedauert, bis eine Lösung
              zur Abstimmung kommt? Ein Erklärvideo zeigt die wichtigsten Meilensteine dieser bewegten Geschichte.
            </p>
          </div>

          {/* Info-Boxen mit Zitaten */}
          <div
            id="info-boxes"
            className={`space-y-4 ${showTutorial && currentTutorialStep.highlight === 'info-boxes' ? 'tutorial-highlight p-2 -m-2' : ''}`}
          >
          {/* Info-Box: Indirekter Gegenvorschlag */}
          <div
            id="info-gegenvorschlag"
            className={`bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5 shadow-sm border border-blue-200 transition-all ${readingHelpActive && currentReadingIndex === 1 ? 'reading-highlight-box' : ''}`}
            data-reading-label="📰 Hintergrundinfo"
          >
            <div className="flex items-start gap-3">
              <div className="bg-blue-500 p-2 rounded-lg text-white">
                <Scale className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-blue-900 mb-2">Gut zu wissen: Indirekter Gegenvorschlag</h3>
                <p className="text-blue-800 text-sm mb-3">
                  Das aktuelle Gesetz, über das wir am 8. März 2026 abstimmen, ist ein <strong>indirekter Gegenvorschlag</strong> zur
                  «Steuergerechtigkeits-Initiative» der FDP-Frauen.
                </p>
                <blockquote className="border-l-4 border-blue-400 pl-3 py-1 bg-white/50 rounded-r-lg text-sm text-blue-700 italic">
                  «Wir stimmen nicht über die Initiative der FDP-Frauen ab, sondern über einen indirekten Gegenvorschlag.
                  Inhaltlich unterscheiden sie sich kaum. Nach der parlamentarischen Debatte zogen die Initiantinnen im
                  Sommer 2025 ihre Initiative bedingt zurück – das bedeutet, sie unterstützen die Vorlage des Parlaments,
                  behalten sich aber vor, ihre Initiative zu reaktivieren, falls es am 8. März ein Nein gibt.»
                </blockquote>
                <p className="text-xs text-blue-600 mt-2 flex items-center gap-1">
                  <ExternalLink className="h-3 w-3" />
                  <a href="https://www.republik.ch/2026/02/06/heiratsstrafe-in-guten-wie-in-teuren-tagen" target="_blank" rel="noopener" className="hover:underline">
                    Quelle: Republik, 6. Februar 2026
                  </a>
                </p>
              </div>
            </div>
          </div>

          {/* Info-Box: Wer profitiert? */}
          <div
            id="info-profitiert"
            className={`bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-5 shadow-sm border border-emerald-200 transition-all ${readingHelpActive && currentReadingIndex === 2 ? 'reading-highlight-box' : ''}`}
            data-reading-label="📊 Fakten & Zahlen"
          >
            <div className="flex items-start gap-3">
              <div className="bg-emerald-500 p-2 rounded-lg text-white">
                <BarChart3 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-emerald-900 mb-2">Wer profitiert von der Vorlage?</h3>
                <blockquote className="border-l-4 border-emerald-400 pl-3 py-1 bg-white/50 rounded-r-lg text-sm text-emerald-700 italic mb-3">
                  «Die aktuellste Schätzung der Steuerverwaltung zeigt: <strong>51,6 Prozent</strong> der Steuerzahlenden
                  würden bei einer Annahme künftig weniger Steuern zahlen. <strong>12,6 Prozent</strong> müssten mehr bezahlen
                  und für <strong>35,8 Prozent</strong> würde sich nichts ändern.»
                </blockquote>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">51.6% weniger Steuern</span>
                  <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold">12.6% mehr Steuern</span>
                  <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold">35.8% keine Änderung</span>
                </div>
                <p className="text-xs text-emerald-600 mt-2 flex items-center gap-1">
                  <ExternalLink className="h-3 w-3" />
                  <a href="https://www.republik.ch/2026/02/06/heiratsstrafe-in-guten-wie-in-teuren-tagen" target="_blank" rel="noopener" className="hover:underline">
                    Quelle: Republik, 6. Februar 2026
                  </a>
                </p>
              </div>
            </div>
          </div>
          </div>

          {/* Chapter Cards */}
          <div className="space-y-3">
            {/* Kapitel 1: Umfrage */}
            <button
              id="chapter-survey"
              onClick={() => setActiveChapter('survey')}
              className={`w-full bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-all text-left border-2 border-transparent hover:border-purple-200 ${showTutorial && currentTutorialStep.highlight === 'chapter-survey' ? 'tutorial-highlight' : ''}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${surveyProgress.done === 2 ? 'bg-green-500' : 'bg-purple-500'}`}>
                    <span className="text-2xl">📊</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Kapitel 1: Ihre Ausgangslage</h3>
                    <p className="text-sm text-gray-500">Umfrage ausfüllen & Ergebnisse entdecken</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-purple-600">{surveyProgress.done}/{surveyProgress.total}</div>
                  <div className="text-xs text-gray-400">30 Punkte</div>
                </div>
              </div>
              {surveyProgress.done === 2 && (
                <div className="mt-3 flex items-center gap-2 text-green-600 text-sm">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Abgeschlossen</span>
                </div>
              )}
            </button>

            {/* Kapitel 2: Referendum */}
            <button
              id="chapter-referendum"
              onClick={() => setActiveChapter('referendum')}
              className={`w-full bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-all text-left border-2 border-transparent hover:border-purple-200 ${showTutorial && currentTutorialStep.highlight === 'chapter-referendum' ? 'tutorial-highlight' : ''}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${refProgress.done === 3 ? 'bg-green-500' : 'bg-indigo-500'}`}>
                    <Vote className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Kapitel 2: Referendum und Gesetzgebung</h3>
                    <p className="text-sm text-gray-500">Politisches Instrument verstehen</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-indigo-600">{refProgress.done}/{refProgress.total}</div>
                  <div className="text-xs text-gray-400">50 Punkte</div>
                </div>
              </div>
              {refProgress.done === 3 && (
                <div className="mt-3 flex items-center gap-2 text-green-600 text-sm">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Abgeschlossen</span>
                </div>
              )}
            </button>

            {/* Kapitel 3: Video */}
            <button
              id="chapter-video"
              onClick={() => setActiveChapter('video')}
              className={`w-full bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-all text-left border-2 border-transparent hover:border-purple-200 ${showTutorial && currentTutorialStep.highlight === 'chapter-video' ? 'tutorial-highlight' : ''}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${vidProgress.done === 2 ? 'bg-green-500' : 'bg-rose-500'}`}>
                    <Film className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Kapitel 3: Geschichte der Heiratsstrafe</h3>
                    <p className="text-sm text-gray-500">Video & Übungen</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-rose-600">{vidProgress.done}/{vidProgress.total}</div>
                  <div className="text-xs text-gray-400">45 Punkte</div>
                </div>
              </div>
              {vidProgress.done === 2 && (
                <div className="mt-3 flex items-center gap-2 text-green-600 text-sm">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Abgeschlossen</span>
                </div>
              )}
            </button>
          </div>

          {/* Completion Banner */}
          {isComplete && (
            <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl p-6 text-white text-center">
              <div className="text-4xl mb-3">🎉</div>
              <h3 className="text-xl font-bold mb-2">Modul abgeschlossen!</h3>
              <p className="text-purple-100 mb-4">
                Sie haben {totalScore} Punkte erreicht
                {bonusScore > 0 && <span> (+{bonusScore} Bonus)</span>}
              </p>
              <button 
                onClick={() => router.push('/dashboard')}
                className="px-6 py-2 bg-white text-purple-600 rounded-lg font-semibold hover:bg-purple-50"
              >
                Weiter zum nächsten Modul
              </button>
            </div>
          )}
        </main>
      </div>
    )
  }

  // ========== CHAPTER: SURVEY ==========
  if (activeChapter === 'survey') {
    return (
      <div className={`min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 ${readingHelpActive ? 'reading-active' : ''}`}>
        <style dangerouslySetInnerHTML={{ __html: styles }} />

        {/* Lesehilfe Button */}
        <button
          onClick={() => setReadingHelpActive(!readingHelpActive)}
          className={`fixed bottom-6 right-6 z-30 p-4 rounded-full shadow-lg hover:shadow-xl transition-all ${
            readingHelpActive
              ? 'bg-amber-500 hover:bg-amber-600 text-white ring-4 ring-amber-300'
              : 'bg-white hover:bg-amber-50 text-amber-600 border-2 border-amber-300'
          }`}
          title={readingHelpActive ? 'Lesehilfe deaktivieren' : 'Lesehilfe aktivieren'}
        >
          <Glasses className="h-6 w-6" />
        </button>

        <header className="bg-gradient-to-r from-purple-600 to-purple-700 text-white sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <button onClick={() => setActiveChapter(null)} className="flex items-center gap-1 text-white/80 hover:text-white text-sm">
                <ArrowLeft className="h-5 w-5" /><span>Übersicht</span>
              </button>
              <div className="flex items-center gap-2 text-sm bg-white/20 px-3 py-1 rounded-full">
                <Award className="h-4 w-4" />
                <span className="font-semibold">{totalScore} / {maxPoints}</span>
              </div>
            </div>
            <h1 className="text-xl font-bold mt-2">Kapitel 1: Ihre Ausgangslage</h1>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
          {/* Lesehilfe Info-Banner */}
          {readingHelpActive && (
            <div className="bg-amber-100 border border-amber-300 rounded-xl p-4 flex items-center gap-3">
              <Glasses className="h-6 w-6 text-amber-600 flex-shrink-0" />
              <div>
                <p className="text-amber-800 font-semibold text-sm">Lesehilfe aktiv</p>
                <p className="text-amber-700 text-xs">Die gelb markierten Bereiche enthalten wichtige Informationen.</p>
              </div>
            </div>
          )}

          {/* Aufgabe 1: Umfrage */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="bg-purple-50 p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">📝</span>
                <div>
                  <h3 className="font-bold text-gray-900">Aufgabe 1: Umfrage ausfüllen</h3>
                  <p className="text-sm text-gray-500">Reflektieren Sie Ihre persönliche Situation</p>
                </div>
              </div>
              {completedSections.has('survey') && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">+15P ✓</span>
              )}
            </div>
            
            <div className="p-6">
              <div
                className={`bg-purple-50 border-l-4 border-purple-500 p-4 mb-4 transition-all ${readingHelpActive ? 'reading-highlight-box' : ''}`}
                data-reading-label="📝 Aufgabenstellung"
              >
                <p className="text-purple-800 text-sm">
                  <strong>🎯 Warum diese Umfrage?</strong> Bevor Sie in die Inhalte eintauchen, interessiert uns Ihre
                  persönliche Ausgangslage. Die Umfrage hilft Ihnen, Ihre eigene Position zu reflektieren.
                </p>
              </div>
              
              <div className="bg-gray-100 rounded-lg overflow-hidden" style={{ minHeight: '500px' }}>
                <iframe 
                  src="https://findmind.ch/c/Gi3E-hSdy"
                  className="w-full h-[500px] border-0"
                  title="Ausgangslage Umfrage"
                />
              </div>
              
              {!completedSections.has('survey') && (
                <div
                  className={`mt-4 transition-all ${readingHelpActive ? 'reading-highlight-box' : ''}`}
                  data-reading-label="✅ Bestätigung"
                >
                  <button
                    onClick={() => completeSection('survey', 15)}
                    className="w-full py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-semibold"
                  >
                    ✓ Umfrage abgeschlossen (+15 Punkte)
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Aufgabe 2: Ergebnisse */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="bg-purple-50 p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                <BarChart3 className="h-6 w-6 text-purple-600" />
                <div>
                  <h3 className="font-bold text-gray-900">Aufgabe 2: Ergebnisse erkunden</h3>
                  <p className="text-sm text-gray-500">Vergleichen Sie mit anderen Teilnehmer:innen</p>
                </div>
              </div>
              {completedSections.has('results') && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">+15P ✓</span>
              )}
            </div>
            
            <div className="p-6">
              <div
                className={`bg-amber-50 border-l-4 border-amber-400 p-4 mb-4 transition-all ${readingHelpActive ? 'reading-highlight-box' : ''}`}
                data-reading-label="💡 Tipp"
              >
                <p className="text-amber-800 text-sm">
                  <strong>💡 Tipp:</strong> In der Ergebnisansicht können Sie auf die <strong>Antwortbezeichnungen</strong> klicken,
                  um die Ergebnisse entsprechend zu filtern. So sehen Sie z.B. nur die Antworten von Personen,
                  die bereits Steuern zahlen, oder von bestimmten Altersgruppen.
                </p>
              </div>
              
              <div className="bg-gray-100 rounded-lg overflow-hidden">
                <iframe 
                  src="https://de.findmind.ch/results/BNhB7FcjUd"
                  className="w-full h-[450px] border-0"
                  title="Umfrage-Ergebnisse"
                />
              </div>
              
              <p className="text-xs text-gray-500 mt-2 text-center">
                Die Ergebnisse werden laufend aktualisiert
              </p>
              
              {!completedSections.has('results') && (
                <div
                  className={`mt-4 transition-all ${readingHelpActive ? 'reading-highlight-box' : ''}`}
                  data-reading-label="✅ Bestätigung"
                >
                  <button
                    onClick={() => completeSection('results', 15)}
                    className="w-full py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-semibold"
                  >
                    ✓ Ergebnisse angeschaut (+15 Punkte)
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between">
            <button 
              onClick={() => setActiveChapter(null)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              ← Zurück zur Übersicht
            </button>
            <button 
              onClick={() => setActiveChapter('referendum')}
              className="px-6 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-semibold"
            >
              Weiter zu Kapitel 2 →
            </button>
          </div>
        </main>
      </div>
    )
  }

  // ========== CHAPTER: REFERENDUM ==========
  if (activeChapter === 'referendum') {
    return (
      <div className={`min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-cyan-50 ${readingHelpActive ? 'reading-active' : ''}`}>
        <style dangerouslySetInnerHTML={{ __html: styles }} />

        {/* Lesehilfe Button */}
        <button
          onClick={() => setReadingHelpActive(!readingHelpActive)}
          className={`fixed bottom-6 right-6 z-30 p-4 rounded-full shadow-lg hover:shadow-xl transition-all ${
            readingHelpActive
              ? 'bg-amber-500 hover:bg-amber-600 text-white ring-4 ring-amber-300'
              : 'bg-white hover:bg-amber-50 text-amber-600 border-2 border-amber-300'
          }`}
          title={readingHelpActive ? 'Lesehilfe deaktivieren' : 'Lesehilfe aktivieren'}
        >
          <Glasses className="h-6 w-6" />
        </button>

        <header className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <button onClick={() => setActiveChapter(null)} className="flex items-center gap-1 text-white/80 hover:text-white text-sm">
                <ArrowLeft className="h-5 w-5" /><span>Übersicht</span>
              </button>
              <div className="flex items-center gap-2 text-sm bg-white/20 px-3 py-1 rounded-full">
                <Award className="h-4 w-4" />
                <span className="font-semibold">{totalScore} / {maxPoints}</span>
              </div>
            </div>
            <h1 className="text-xl font-bold mt-2">Kapitel 2: Referendum und Gesetzgebung</h1>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
          {/* Lesehilfe Info-Banner */}
          {readingHelpActive && (
            <div className="bg-amber-100 border border-amber-300 rounded-xl p-4 flex items-center gap-3">
              <Glasses className="h-6 w-6 text-amber-600 flex-shrink-0" />
              <div>
                <p className="text-amber-800 font-semibold text-sm">Lesehilfe aktiv</p>
                <p className="text-amber-700 text-xs">Die gelb markierten Bereiche enthalten wichtige Informationen.</p>
              </div>
            </div>
          )}

          {/* Einführung */}
          <div
            className={`bg-white rounded-xl p-6 shadow-sm transition-all ${readingHelpActive ? 'reading-highlight-box' : ''}`}
            data-reading-label="📖 Infotext"
          >
            <p className="text-gray-700 mb-3">
              Das Referendum ist ein zentrales Instrument der <strong>direkten Demokratie</strong> in der Schweiz.
              Es ermöglicht den Stimmberechtigten, über Entscheide des Parlaments das letzte Wort zu haben.
            </p>
            <p className="text-gray-700 mb-3">
              Im interaktiven <strong>Zeitstrahl</strong> unten sehen Sie, wie sich die Diskussion um die Individualbesteuerung
              über die Jahre entwickelt hat. Von der ersten Idee über parlamentarische Debatten bis zur Volksabstimmung
              dauert es oft <strong>Jahrzehnte</strong> – diese Darstellung zeigt Ihnen, wie lange der Weg zur Gesetzesänderung sein kann.
            </p>
            <p className="text-gray-700">
              Klicken Sie auf die Ereignisse, um zu verstehen, welche Hürden genommen werden mussten und welche
              politischen Kräfte die Entwicklung beeinflusst haben.
            </p>
          </div>

          {/* Aufgabe 1: Info-Karten */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="bg-indigo-50 p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🎴</span>
                <div>
                  <h3 className="font-bold text-gray-900">Aufgabe 1: Referendum-Arten entdecken</h3>
                  <p className="text-sm text-gray-500">Klicken Sie alle Karten auf</p>
                </div>
              </div>
              {completedSections.has('referendum_info') && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">+15P ✓</span>
              )}
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { id: 'obligatorisch', icon: Scale, color: 'blue', title: 'Obligatorisches Referendum',
                    content: 'Bei Verfassungsänderungen muss das Volk immer abstimmen.',
                    details: ['Gilt seit 1848', 'Braucht Volks- UND Ständemehr', 'Keine Unterschriften nötig'] },
                  { id: 'fakultativ', icon: Users, color: 'green', title: 'Fakultatives Referendum',
                    content: 'Gegen Bundesgesetze kann innerhalb von 100 Tagen ein Referendum ergriffen werden.',
                    details: ['50\'000 Unterschriften ODER', '8 Kantone verlangen es', 'Nur Volksmehr nötig'] },
                  { id: 'kantonsref', icon: Building2, color: 'orange', title: 'Kantonsreferendum',
                    content: '8 Kantone können gemeinsam ein Referendum erzwingen – sehr selten!',
                    details: ['Erst 2x in der Geschichte', '2003: Steuerpaket (65.9% Nein)', '2025: Individualbesteuerung'] },
                  { id: 'aktuell', icon: Calendar, color: 'red', title: 'Individualbesteuerung 2026',
                    content: '10 Kantone haben das Referendum ergriffen!',
                    details: ['Dafür: SVP, Mitte, EVP, EDU', 'Dagegen: SP, FDP, Grüne, GLP', 'Abstimmung: 8. März 2026', 'Indirekter Gegenvorschlag zur FDP-Initiative'] }
                ].map(card => {
                  const Icon = card.icon
                  const revealed = revealedCards.has(card.id)
                  const colorClasses: {[key: string]: {bg: string, border: string, text: string}} = {
                    blue: { bg: 'bg-blue-50', border: 'border-blue-400', text: 'text-blue-800' },
                    green: { bg: 'bg-green-50', border: 'border-green-400', text: 'text-green-800' },
                    orange: { bg: 'bg-orange-50', border: 'border-orange-400', text: 'text-orange-800' },
                    red: { bg: 'bg-red-50', border: 'border-red-400', text: 'text-red-800' }
                  }
                  const colors = colorClasses[card.color]
                  
                  return (
                    <div 
                      key={card.id}
                      onClick={() => {
                        const newRevealed = new Set(revealedCards)
                        newRevealed.add(card.id)
                        setRevealedCards(newRevealed)
                      }}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        revealed ? `${colors.border} ${colors.bg}` : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`p-2 rounded-lg ${revealed ? colors.bg : 'bg-gray-100'}`}>
                          <Icon className={`h-5 w-5 ${revealed ? colors.text : 'text-gray-400'}`} />
                        </div>
                        <h4 className="font-bold text-gray-900">{card.title}</h4>
                      </div>
                      {revealed ? (
                        <div className="fade-in">
                          <p className={`${colors.text} text-sm mb-2`}>{card.content}</p>
                          <ul className={`${colors.text} text-xs space-y-1`}>
                            {card.details.map((d, i) => <li key={i}>• {d}</li>)}
                          </ul>
                        </div>
                      ) : (
                        <p className="text-gray-400 text-sm">Klicken zum Aufdecken...</p>
                      )}
                    </div>
                  )
                })}
              </div>
              
              {revealedCards.size >= 4 && !completedSections.has('referendum_info') && (
                <button 
                  onClick={() => completeSection('referendum_info', 15)}
                  className="mt-4 w-full py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-semibold"
                >
                  ✓ Alle Karten aufgedeckt (+15 Punkte)
                </button>
              )}
            </div>
          </div>

          {/* Aufgabe 2: Timeline */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="bg-indigo-50 p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">📅</span>
                <div>
                  <h3 className="font-bold text-gray-900">Aufgabe 2: Zeitstrahl entdecken</h3>
                  <p className="text-sm text-gray-500">Klicken Sie auf die Ereignisse</p>
                </div>
              </div>
              {completedSections.has('timeline') && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">+15P ✓</span>
              )}
            </div>
            
            <div className="p-6">
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-indigo-400 to-purple-500"></div>
                
                {[
                  { year: '1984', event: 'Bundesgerichtsurteil', detail: 'Das Bundesgericht erklärt die Heiratsstrafe für verfassungswidrig.' },
                  { year: '2016', event: 'CVP-Initiative abgelehnt', detail: 'Volk lehnt Initiative ab – später stellt sich heraus, dass der Bundesrat mit falschen Zahlen informiert hatte!' },
                  { year: '2024', event: 'Parlament beschliesst Reform', detail: 'National- und Ständerat stimmen der Individualbesteuerung zu.' },
                  { year: '2025', event: 'Kantonsreferendum', detail: '10 Kantone ergreifen das Referendum – erst das 2. Mal in der Geschichte.' },
                  { year: '8.3.2026', event: 'Volksabstimmung', detail: 'Das Schweizer Volk entscheidet an der Urne.' }
                ].map((item, idx) => (
                  <div 
                    key={idx}
                    onClick={() => {
                      const newRevealed = new Set(timelineRevealed)
                      newRevealed.add(idx)
                      setTimelineRevealed(newRevealed)
                    }}
                    className="relative pl-10 mb-4 cursor-pointer"
                  >
                    <div className={`absolute left-2 top-1 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                      timelineRevealed.has(idx) ? 'bg-indigo-500 border-indigo-500' : 'bg-white border-gray-300 hover:border-indigo-400'
                    }`}>
                      {timelineRevealed.has(idx) && <CheckCircle2 className="h-3 w-3 text-white" />}
                    </div>
                    
                    <div className={`p-3 rounded-lg border transition-all ${
                      timelineRevealed.has(idx) ? 'bg-indigo-50 border-indigo-200' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                    }`}>
                      <span className="font-bold text-indigo-700">{item.year}</span>
                      <p className="font-semibold text-gray-900 text-sm">{item.event}</p>
                      {timelineRevealed.has(idx) && (
                        <p className="text-gray-600 text-sm mt-1 fade-in">{item.detail}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              {timelineRevealed.size >= 5 && !completedSections.has('timeline') && (
                <button 
                  onClick={() => completeSection('timeline', 15)}
                  className="w-full py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-semibold"
                >
                  ✓ Timeline abgeschlossen (+15 Punkte)
                </button>
              )}
            </div>
          </div>

          {/* Aufgabe 3: Zuordnung */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="bg-indigo-50 p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🔗</span>
                <div>
                  <h3 className="font-bold text-gray-900">Aufgabe 3: Begriffe zuordnen</h3>
                  <p className="text-sm text-gray-500">Testen Sie Ihr Wissen</p>
                </div>
              </div>
              {completedSections.has('matching') && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">+20P ✓</span>
              )}
            </div>
            
            <div className="p-6">
              <div className="space-y-3">
                {[
                  { term: '50\'000 Unterschriften', options: ['Obligatorisches Ref.', 'Fakultatives Ref.', 'Kantonsreferendum'], correct: 'Fakultatives Ref.' },
                  { term: '8 Kantone', options: ['Obligatorisches Ref.', 'Fakultatives Ref.', 'Kantonsreferendum'], correct: 'Kantonsreferendum' },
                  { term: 'Verfassungsänderung', options: ['Obligatorisches Ref.', 'Fakultatives Ref.', 'Kantonsreferendum'], correct: 'Obligatorisches Ref.' },
                  { term: 'Bundesgesetz anfechten', options: ['Obligatorisches Ref.', 'Fakultatives Ref.', 'Kantonsreferendum'], correct: 'Fakultatives Ref.' },
                ].map((item, idx) => {
                  const answer = matchingAnswers[`match${idx}`]
                  const isCorrect = matchingSubmitted && answer === item.correct
                  const isWrong = matchingSubmitted && answer && answer !== item.correct
                  
                  return (
                    <div key={idx} className={`p-3 rounded-lg border ${
                      isCorrect ? 'border-green-400 bg-green-50' : 
                      isWrong ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-white'
                    }`}>
                      <p className="font-medium text-gray-800 text-sm mb-2">{item.term}</p>
                      <div className="flex flex-wrap gap-2">
                        {item.options.map(opt => (
                          <button
                            key={opt}
                            onClick={() => !matchingSubmitted && setMatchingAnswers({...matchingAnswers, [`match${idx}`]: opt})}
                            disabled={matchingSubmitted}
                            className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
                              answer === opt
                                ? matchingSubmitted
                                  ? opt === item.correct ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                                  : 'bg-indigo-500 text-white'
                                : matchingSubmitted && opt === item.correct
                                  ? 'bg-green-200 text-green-800'
                                  : 'bg-gray-100 hover:bg-gray-200'
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
              
              {!matchingSubmitted && Object.keys(matchingAnswers).length >= 4 && (
                <button 
                  onClick={() => {
                    setMatchingSubmitted(true)
                    if (!completedSections.has('matching')) {
                      completeSection('matching', 20)
                    }
                  }}
                  className="mt-4 w-full py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-semibold"
                >
                  Antworten prüfen
                </button>
              )}
              
              {matchingSubmitted && (
                <div className="mt-4 p-3 bg-green-100 rounded-lg text-green-800 text-sm">
                  <strong>✓ Zuordnung abgeschlossen!</strong>
                </div>
              )}
            </div>
          </div>

          {/* Quellenangabe */}
          <div className="text-xs text-gray-500 flex items-center gap-1 justify-center">
            <ExternalLink className="h-3 w-3" />
            <a href="https://hls-dhs-dss.ch/de/articles/010387/2011-12-23/" target="_blank" rel="noopener" className="hover:underline">
              Quelle: Historisches Lexikon der Schweiz (CC BY-SA)
            </a>
          </div>

          {/* Navigation */}
          <div className="flex justify-between">
            <button 
              onClick={() => setActiveChapter('survey')}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              ← Kapitel 1
            </button>
            <button 
              onClick={() => setActiveChapter('video')}
              className="px-6 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-lg font-semibold"
            >
              Weiter zu Kapitel 3 →
            </button>
          </div>
        </main>
      </div>
    )
  }

  // ========== CHAPTER: VIDEO ==========
  if (activeChapter === 'video') {
    return (
      <div className={`min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 ${readingHelpActive ? 'reading-active' : ''}`}>
        <style dangerouslySetInnerHTML={{ __html: styles }} />

        {/* Lesehilfe Button */}
        <button
          onClick={() => setReadingHelpActive(!readingHelpActive)}
          className={`fixed bottom-6 right-6 z-30 p-4 rounded-full shadow-lg hover:shadow-xl transition-all ${
            readingHelpActive
              ? 'bg-amber-500 hover:bg-amber-600 text-white ring-4 ring-amber-300'
              : 'bg-white hover:bg-amber-50 text-amber-600 border-2 border-amber-300'
          }`}
          title={readingHelpActive ? 'Lesehilfe deaktivieren' : 'Lesehilfe aktivieren'}
        >
          <Glasses className="h-6 w-6" />
        </button>

        <header className="bg-gradient-to-r from-rose-600 to-rose-700 text-white sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <button onClick={() => setActiveChapter(null)} className="flex items-center gap-1 text-white/80 hover:text-white text-sm">
                <ArrowLeft className="h-5 w-5" /><span>Übersicht</span>
              </button>
              <div className="flex items-center gap-2 text-sm bg-white/20 px-3 py-1 rounded-full">
                <Award className="h-4 w-4" />
                <span className="font-semibold">{totalScore} / {maxPoints}</span>
              </div>
            </div>
            <h1 className="text-xl font-bold mt-2">Kapitel 3: Geschichte der Heiratsstrafe</h1>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
          {/* Lesehilfe Info-Banner */}
          {readingHelpActive && (
            <div className="bg-amber-100 border border-amber-300 rounded-xl p-4 flex items-center gap-3">
              <Glasses className="h-6 w-6 text-amber-600 flex-shrink-0" />
              <div>
                <p className="text-amber-800 font-semibold text-sm">Lesehilfe aktiv</p>
                <p className="text-amber-700 text-xs">Die gelb markierten Bereiche enthalten wichtige Informationen.</p>
              </div>
            </div>
          )}

          {/* Video */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="bg-rose-50 p-4 border-b">
              <div className="flex items-center gap-3">
                <Film className="h-6 w-6 text-rose-600" />
                <div>
                  <h3 className="font-bold text-gray-900">Video: Der Weg zur Individualbesteuerung</h3>
                  <p className="text-sm text-gray-500">Warum dauerte es über 40 Jahre?</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div
                className={`bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-lg mb-4 transition-all ${readingHelpActive ? 'reading-highlight-box' : ''}`}
                data-reading-label="📖 Infotext"
              >
                <p className="text-amber-800 text-sm mb-2">
                  <strong>📖 Worum geht es?</strong> Dieses Video erklärt die bewegte Geschichte der Heiratsstrafe in der Schweiz.
                </p>
                <p className="text-amber-800 text-sm mb-2">
                  Seit <strong>1984</strong> ist das heutige Steuersystem laut Bundesgericht verfassungswidrig – trotzdem hat es über
                  <strong> 40 Jahre</strong> gedauert, bis eine Lösung zur Abstimmung kommt. Warum?
                </p>
                <p className="text-amber-800 text-sm">
                  Das Video zeigt die wichtigsten Meilensteine: Von der CVP-Initiative 2016 (bei der der Bundesrat mit
                  <strong> falschen Zahlen</strong> informierte) bis zur aktuellen Vorlage.
                </p>
              </div>
              <div className="bg-gray-900 rounded-lg overflow-hidden">
                <iframe
                  className="w-full aspect-video"
                  src="https://www.youtube.com/embed/wP8DA6YHkJo"
                  title="Geschichte der Heiratsstrafe"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              <p className="text-sm text-gray-500 mt-3 text-center">
                Schauen Sie das Video und bearbeiten Sie anschliessend die Übungen
              </p>
            </div>
          </div>

          {/* Aufgabe 1: Flipcards */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="bg-rose-50 p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🎴</span>
                <div>
                  <h3 className="font-bold text-gray-900">Aufgabe 1: Schlüsselbegriffe</h3>
                  <p className="text-sm text-gray-500">Drehen Sie alle Karten um</p>
                </div>
              </div>
              {completedSections.has('flipcards') && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">+15P ✓</span>
              )}
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { front: 'Heiratsstrafe', back: 'Ehepaare zahlen mehr Steuern als unverheiratete Paare mit gleichem Einkommen.', emoji: '💍' },
                  { front: 'Steuerprogression', back: 'Je höher das Einkommen, desto höher der Steuersatz. Zusammengelegte Einkommen werden stärker besteuert.', emoji: '📈' },
                  { front: 'Individualbesteuerung', back: 'Jede Person füllt eine eigene Steuererklärung aus – unabhängig vom Zivilstand.', emoji: '👤' }
                ].map((card, idx) => (
                  <div 
                    key={idx}
                    onClick={() => {
                      const newFlipped = new Set(flippedCards)
                      newFlipped.add(idx)
                      setFlippedCards(newFlipped)
                    }}
                    className={`flip-card h-36 ${flippedCards.has(idx) ? 'flipped' : ''}`}
                  >
                    <div className="flip-card-inner">
                      <div className="flip-card-front">
                        <span className="text-3xl mb-2">{card.emoji}</span>
                        <p className="font-bold text-sm">{card.front}</p>
                        <p className="text-xs mt-2 opacity-75">Klicken</p>
                      </div>
                      <div className="flip-card-back">
                        <p className="text-sm">{card.back}</p>
                        <CheckCircle2 className="h-5 w-5 text-purple-500 mt-2" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {flippedCards.size >= 3 && !completedSections.has('flipcards') && (
                <button 
                  onClick={() => completeSection('flipcards', 15)}
                  className="mt-4 w-full py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-lg font-semibold"
                >
                  ✓ Flipcards abgeschlossen (+15 Punkte)
                </button>
              )}
            </div>
          </div>

          {/* Aufgabe 2: Video-Quiz */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="bg-rose-50 p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">❓</span>
                <div>
                  <h3 className="font-bold text-gray-900">Aufgabe 2: Verständnisfragen zum Video</h3>
                  <p className="text-sm text-gray-500">Fragen in chronologischer Reihenfolge</p>
                </div>
              </div>
              {completedSections.has('videoquiz') && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">+30P ✓</span>
              )}
            </div>
            
            <div className="p-6 space-y-4">
              {/* Frage 1 - Anfang Video */}
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="font-medium text-gray-800 mb-3">
                  1. In welchem Jahr erklärte das Bundesgericht die Heiratsstrafe für verfassungswidrig?
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {['1974', '1984', '1994', '2004'].map(opt => {
                    const isSelected = videoQuizAnswers.vq1 === opt
                    const isCorrect = videoQuizSubmitted && opt === '1984'
                    const isWrong = videoQuizSubmitted && isSelected && opt !== '1984'
                    return (
                      <button
                        key={opt}
                        onClick={() => !videoQuizSubmitted && setVideoQuizAnswers({...videoQuizAnswers, vq1: opt})}
                        disabled={videoQuizSubmitted}
                        className={`p-2 rounded-lg text-sm font-medium transition-all ${
                          isCorrect ? 'bg-green-500 text-white' :
                          isWrong ? 'bg-red-500 text-white' :
                          isSelected ? 'bg-rose-500 text-white' :
                          'bg-white border border-gray-300 hover:border-rose-400'
                        }`}
                      >
                        {opt}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Frage 2 - Mitte Video */}
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="font-medium text-gray-800 mb-3">
                  2. Was passierte 2016 bei der CVP-Initiative?
                </p>
                <div className="space-y-2">
                  {[
                    'Sie wurde angenommen',
                    'Sie wurde abgelehnt, aber der Bundesrat hatte mit falschen Zahlen informiert',
                    'Sie kam gar nicht zur Abstimmung',
                    'Das Bundesgericht erklärte sie für ungültig'
                  ].map(opt => {
                    const isSelected = videoQuizAnswers.vq2 === opt
                    const correct = 'Sie wurde abgelehnt, aber der Bundesrat hatte mit falschen Zahlen informiert'
                    const isCorrect = videoQuizSubmitted && opt === correct
                    const isWrong = videoQuizSubmitted && isSelected && opt !== correct
                    return (
                      <button
                        key={opt}
                        onClick={() => !videoQuizSubmitted && setVideoQuizAnswers({...videoQuizAnswers, vq2: opt})}
                        disabled={videoQuizSubmitted}
                        className={`w-full p-2 rounded-lg text-sm font-medium text-left transition-all ${
                          isCorrect ? 'bg-green-500 text-white' :
                          isWrong ? 'bg-red-500 text-white' :
                          isSelected ? 'bg-rose-500 text-white' :
                          'bg-white border border-gray-300 hover:border-rose-400'
                        }`}
                      >
                        {opt}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Frage 3 - Ende Video */}
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="font-medium text-gray-800 mb-3">
                  3. Warum dauerte es über 40 Jahre, die Heiratsstrafe abzuschaffen?
                </p>
                <div className="space-y-2">
                  {[
                    'Es fehlte das politische Interesse',
                    'Das Bundesgericht blockierte alle Vorstösse',
                    'Es gab immer wieder Streit über den besten Lösungsweg',
                    'Die Kantone weigerten sich'
                  ].map(opt => {
                    const isSelected = videoQuizAnswers.vq3 === opt
                    const correct = 'Es gab immer wieder Streit über den besten Lösungsweg'
                    const isCorrect = videoQuizSubmitted && opt === correct
                    const isWrong = videoQuizSubmitted && isSelected && opt !== correct
                    return (
                      <button
                        key={opt}
                        onClick={() => !videoQuizSubmitted && setVideoQuizAnswers({...videoQuizAnswers, vq3: opt})}
                        disabled={videoQuizSubmitted}
                        className={`w-full p-2 rounded-lg text-sm font-medium text-left transition-all ${
                          isCorrect ? 'bg-green-500 text-white' :
                          isWrong ? 'bg-red-500 text-white' :
                          isSelected ? 'bg-rose-500 text-white' :
                          'bg-white border border-gray-300 hover:border-rose-400'
                        }`}
                      >
                        {opt}
                      </button>
                    )
                  })}
                </div>
              </div>

              {!videoQuizSubmitted && videoQuizAnswers.vq1 && videoQuizAnswers.vq2 && videoQuizAnswers.vq3 && (
                <button 
                  onClick={() => {
                    setVideoQuizSubmitted(true)
                    if (!completedSections.has('videoquiz')) {
                      completeSection('videoquiz', 30)
                    }
                  }}
                  className="w-full py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-lg font-semibold"
                >
                  Antworten prüfen
                </button>
              )}
              
              {videoQuizSubmitted && (
                <div className="p-4 bg-green-100 rounded-lg text-green-800">
                  <strong>✓ Verständnisfragen abgeschlossen!</strong>
                  <p className="text-sm mt-1">
                    Das Bundesgericht erklärte 1984 die Heiratsstrafe für verfassungswidrig. Die CVP-Initiative 2016 wurde
                    knapp abgelehnt – später stellte sich heraus, dass der Bundesrat mit falschen Zahlen informiert hatte
                    (80'000 statt 454'000 betroffene Ehepaare). 2019 annullierte das Bundesgericht deshalb die Abstimmung.
                    Der jahrzehntelange Streit über den besten Lösungsweg verzögerte eine Reform über 40 Jahre.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between">
            <button 
              onClick={() => setActiveChapter('referendum')}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              ← Kapitel 2
            </button>
            <button 
              onClick={() => setActiveChapter(null)}
              className="px-6 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-semibold"
            >
              Zur Übersicht →
            </button>
          </div>
        </main>
      </div>
    )
  }

  return null
}
