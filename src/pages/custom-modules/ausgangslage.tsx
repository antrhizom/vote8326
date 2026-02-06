import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { doc, updateDoc, getDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { 
  ArrowLeft, CheckCircle2, Award, ChevronDown, ChevronUp, X,
  Vote, Film, ExternalLink, BarChart3, Scale, Building2, 
  Users, Calendar, Sparkles, Star
} from 'lucide-react'

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
  `

  // ========== CHAPTER OVERVIEW ==========
  if (!activeChapter) {
    const surveyProgress = getChapterProgress('survey')
    const refProgress = getChapterProgress('referendum')
    const vidProgress = getChapterProgress('video')
    const isComplete = surveyProgress.done === 2 && refProgress.done === 3 && vidProgress.done === 2

    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50">
        <style dangerouslySetInnerHTML={{ __html: styles }} />
        
        {/* Header */}
        <header className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between mb-2">
              <button onClick={() => router.push('/dashboard')} className="flex items-center gap-1 text-white/80 hover:text-white text-sm">
                <ArrowLeft className="h-5 w-5" /><span>Dashboard</span>
              </button>
              <div className="flex items-center gap-3">
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

        <main className="max-w-4xl mx-auto px-4 py-6 space-y-4">
          {/* Intro Text */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <p className="text-gray-700 mb-3">
              Bevor Sie in die Details der Abstimmung eintauchen, erkunden Sie Ihre <strong>persönliche Ausgangslage</strong>.
              In einer kurzen Umfrage reflektieren Sie Ihre eigene Situation – zum Beispiel: Wie werden Sie heute besteuert?
              Würde sich für Sie etwas ändern?
            </p>
            <p className="text-gray-700 mb-3">
              Anschliessend lernen Sie das <strong>Referendum und die Gesetzgebung</strong> als wichtige Instrumente der
              direkten Demokratie kennen. Sie erfahren, wie aus einer Idee ein Gesetz wird – und wie die Bevölkerung
              das letzte Wort haben kann.
            </p>
            <p className="text-gray-700">
              Schliesslich entdecken Sie die <strong>Geschichte der Heiratsstrafe</strong>: Seit 1984 ist das
              heutige System verfassungswidrig – warum hat es über 40 Jahre gedauert, bis eine Lösung zur Abstimmung kommt?
            </p>
          </div>

          {/* Chapter Cards */}
          <div className="space-y-3">
            {/* Kapitel 1: Umfrage */}
            <button
              onClick={() => setActiveChapter('survey')}
              className="w-full bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-all text-left border-2 border-transparent hover:border-purple-200"
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
              onClick={() => setActiveChapter('referendum')}
              className="w-full bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-all text-left border-2 border-transparent hover:border-purple-200"
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
              onClick={() => setActiveChapter('video')}
              className="w-full bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-all text-left border-2 border-transparent hover:border-purple-200"
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
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50">
        <style dangerouslySetInnerHTML={{ __html: styles }} />
        
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
              <div className="bg-purple-50 border-l-4 border-purple-500 p-4 mb-4">
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
                <button 
                  onClick={() => completeSection('survey', 15)}
                  className="mt-4 w-full py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-semibold"
                >
                  ✓ Umfrage abgeschlossen (+15 Punkte)
                </button>
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
              <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-4">
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
                <button 
                  onClick={() => completeSection('results', 15)}
                  className="mt-4 w-full py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-semibold"
                >
                  ✓ Ergebnisse angeschaut (+15 Punkte)
                </button>
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
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-cyan-50">
        <style dangerouslySetInnerHTML={{ __html: styles }} />
        
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
          {/* Einführung */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
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
                    details: ['Dafür: SVP, Mitte, EVP, EDU', 'Dagegen: SP, FDP, Grüne, GLP', 'Abstimmung: 8. März 2026'] }
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
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50">
        <style dangerouslySetInnerHTML={{ __html: styles }} />
        
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
              <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-lg mb-4">
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
